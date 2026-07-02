import Foundation
import SwiftUI

@MainActor
class SoulManager: ObservableObject {
    @Published var currentSoul: Soul?
    @Published var konnections: [Konnection] = []
    @Published var insights: [Insight] = []
    @Published var offers: [Offer] = []
    @Published var onboardingStep: OnboardingStep = .welcome
    @Published var isAuthenticated = false
    @Published var isSyncing = false
    @Published var syncError: String?
    @Published var appOpenCount: Int

    let passkeyService: PasskeyProviding
    let plaidService: PlaidProviding
    let scoringEngine: BasicScoringEngine
    let persistence: PersistenceService
    let syncObserver: SyncObserver

    private var backgroundTimestamp: Date?
    private static let backgroundTimeout: TimeInterval = 300

    enum OnboardingStep: Int, CaseIterable {
        case welcome = 0
        case passkeyCreation = 1
        case plaidLink = 2
        case firstInsight = 3
    }

    init(passkeyService: PasskeyProviding? = nil,
         plaidService: PlaidProviding? = nil,
         persistence: PersistenceService? = nil) throws {
        let ps = try persistence ?? PersistenceService()
        self.persistence = ps
        self.passkeyService = passkeyService ?? MockPasskeyService()
        self.plaidService = plaidService ?? MockPlaidService()
        self.scoringEngine = BasicScoringEngine()
        self.syncObserver = SyncObserver()
        self.appOpenCount = UserDefaults.standard.integer(forKey: "appOpenCount")
    }

    // MARK: - App lifecycle

    func onAppLaunch() async {
        appOpenCount += 1
        UserDefaults.standard.set(appOpenCount, forKey: "appOpenCount")

        let consistency = persistence.consistencyCheck()
        switch consistency {
        case .consistent:
            currentSoul = persistence.loadSoul()
        case .mismatch(let reason):
            print("Persistence mismatch: \(reason)")
            currentSoul = persistence.loadSoul()
        case .fresh:
            break
        }

        if currentSoul != nil {
            isAuthenticated = false
        }
    }

    func onEnterBackground() {
        backgroundTimestamp = Date()
    }

    func onEnterForeground() {
        guard let ts = backgroundTimestamp else { return }
        if Date().timeIntervalSince(ts) > Self.backgroundTimeout {
            isAuthenticated = false
        }
        backgroundTimestamp = nil
    }

    // MARK: - Authentication

    func authenticate() async throws {
        guard let soul = currentSoul,
              let credentialID = soul.passkeyCredentialID else {
            throw SoulManagerError.noCredential
        }
        let success = try await passkeyService.authenticate(credentialID: credentialID)
        if success {
            isAuthenticated = true
            try await loadPersistedData()
        }
    }

    func reauthenticateForSensitiveAction() async throws -> Bool {
        guard let soul = currentSoul,
              let credentialID = soul.passkeyCredentialID else { return false }
        return try await passkeyService.authenticate(credentialID: credentialID)
    }

    // MARK: - Onboarding

    func createSoul() async throws {
        var soul = Soul()
        let credentialID = try await passkeyService.createPasskey(for: soul.id)
        soul.passkeyCredentialID = credentialID

        try persistence.saveSoul(soul)
        try persistence.saveCredentialID(credentialID, for: soul.id)
        try persistence.createSDSoul(from: soul)

        self.currentSoul = soul
        self.isAuthenticated = true
    }

    func linkPlaid() async throws {
        guard let soul = currentSoul else { throw SoulManagerError.noSoul }

        _ = try await plaidService.startLink()

        let konnection = Konnection(
            id: UUID(),
            soulID: soul.id,
            provider: .plaid,
            status: .active,
            connectedAt: Date(),
            transaktionCount: 0
        )
        try persistence.saveKonnection(konnection, soulID: soul.id)
        konnections.append(konnection)

        try await syncTransactions(konnection: konnection)
    }

    func skipPlaid() {
        advanceOnboarding()
    }

    var shouldShowPlaidNudge: Bool {
        appOpenCount >= 3 && !konnections.contains(where: { $0.provider == .plaid })
    }

    func advanceOnboarding() {
        let allSteps = OnboardingStep.allCases
        guard let currentIndex = allSteps.firstIndex(of: onboardingStep),
              currentIndex + 1 < allSteps.count else { return }
        onboardingStep = allSteps[currentIndex + 1]
    }

    // MARK: - Sync

    func syncTransactions(konnection: Konnection) async throws {
        isSyncing = true
        syncError = nil

        syncObserver.beginSync(provider: konnection.provider, konnectionID: konnection.id)

        do {
            let transaktions = try await plaidService.fetchTransactions(for: konnection.id)

            for _ in transaktions {
                syncObserver.recordReceived(provider: konnection.provider)
            }

            try persistence.saveTransaktions(transaktions, konnectionID: konnection.id)
            let report = syncObserver.completeSync(provider: konnection.provider)
            try persistence.saveSyncReport(report)

            try await recomputeInsights()
            isSyncing = false
        } catch {
            let report = syncObserver.failSync(provider: konnection.provider, error: error)
            try? persistence.saveSyncReport(report)
            isSyncing = false
            syncError = error.localizedDescription
            throw error
        }
    }

    // MARK: - Scoring

    func recomputeInsights() async throws {
        guard let soul = currentSoul else { return }

        let allTxns = try persistence.loadAllTransaktions(for: soul.id)
        let newInsights = scoringEngine.computeInsights(transaktions: allTxns, soulID: soul.id)

        try persistence.saveInsights(newInsights, soulID: soul.id)
        insights = newInsights

        var updatedSoul = soul
        updatedSoul.depthScore = scoringEngine.computeDepthScore(insights: newInsights)
        try persistence.saveSoul(updatedSoul)
        currentSoul = updatedSoul
    }

    // MARK: - Account actions

    func deleteAccount() async throws {
        let confirmed = try await reauthenticateForSensitiveAction()
        guard confirmed else { throw SoulManagerError.reauthFailed }

        try persistence.wipeAll()
        currentSoul = nil
        konnections = []
        insights = []
        offers = []
        isAuthenticated = false
        onboardingStep = .welcome
    }

    func exportData() async throws -> Data {
        let confirmed = try await reauthenticateForSensitiveAction()
        guard confirmed else { throw SoulManagerError.reauthFailed }

        guard let soul = currentSoul else { throw SoulManagerError.noSoul }
        return try persistence.exportAllData(for: soul.id)
    }

    // MARK: - Private

    private func loadPersistedData() async throws {
        guard let soul = currentSoul else { return }
        konnections = try persistence.loadKonnections(for: soul.id)
        insights = try persistence.loadInsights(for: soul.id)
    }

    var depthScore: Double {
        currentSoul?.depthScore ?? 0.0
    }

    var isPhaseTwo: Bool {
        currentSoul?.phase == .two
    }

    enum SoulManagerError: LocalizedError {
        case noSoul
        case noCredential
        case reauthFailed

        var errorDescription: String? {
            switch self {
            case .noSoul: return "No Soul exists"
            case .noCredential: return "No passkey credential found"
            case .reauthFailed: return "Re-authentication required"
            }
        }
    }
}
