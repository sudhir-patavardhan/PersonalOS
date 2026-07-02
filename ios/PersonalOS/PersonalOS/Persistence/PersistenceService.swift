import Foundation
import SwiftData
import Security

@MainActor
class PersistenceService {
    let modelContainer: ModelContainer
    let modelContext: ModelContext

    private static let soulFileURL: URL = {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return docs.appendingPathComponent("soul.json")
    }()

    private static let keychainService = "app.personalos"
    private static let keychainAccount = "passkeyCredentialID"

    init() throws {
        let schema = Schema([SDSoul.self, SDKonnection.self, SDSoulTransaktion.self, SDInsight.self, SDSyncReport.self])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        self.modelContainer = try ModelContainer(for: schema, configurations: [config])
        self.modelContext = modelContainer.mainContext

        Self.setFileProtection()
    }

    init(inMemory: Bool) throws {
        let schema = Schema([SDSoul.self, SDKonnection.self, SDSoulTransaktion.self, SDInsight.self, SDSyncReport.self])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: inMemory)
        self.modelContainer = try ModelContainer(for: schema, configurations: [config])
        self.modelContext = modelContainer.mainContext
    }

    private static func setFileProtection() {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        try? FileManager.default.setAttributes(
            [.protectionKey: FileProtectionType.complete],
            ofItemAtPath: docs.path
        )
    }

    // MARK: - Soul JSON persistence

    func saveSoul(_ soul: Soul) throws {
        let data = try JSONEncoder().encode(soul)
        try data.write(to: Self.soulFileURL, options: .completeFileProtection)
    }

    func loadSoul() -> Soul? {
        guard let data = try? Data(contentsOf: Self.soulFileURL) else { return nil }
        return try? JSONDecoder().decode(Soul.self, from: data)
    }

    func deleteSoulFile() {
        try? FileManager.default.removeItem(at: Self.soulFileURL)
    }

    // MARK: - Keychain for passkey credential ID

    func saveCredentialID(_ credentialID: Data, for soulID: UUID) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: Self.keychainService,
            kSecAttrAccount as String: Self.keychainAccount,
            kSecValueData as String: credentialID,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        ]

        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw PersistenceError.keychainWriteFailed(status)
        }
    }

    func loadCredentialID() -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: Self.keychainService,
            kSecAttrAccount as String: Self.keychainAccount,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess else { return nil }
        return result as? Data
    }

    func deleteCredentialID() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: Self.keychainService,
            kSecAttrAccount as String: Self.keychainAccount,
        ]
        SecItemDelete(query as CFDictionary)
    }

    // MARK: - Consistency check

    func consistencyCheck() -> ConsistencyResult {
        let soul = loadSoul()
        let credentialID = loadCredentialID()

        switch (soul, credentialID) {
        case (.some(let s), .some) where s.passkeyCredentialID != nil:
            return .consistent
        case (.some, .none):
            return .mismatch(reason: "Soul exists but no credential in Keychain")
        case (.none, .some):
            return .mismatch(reason: "Credential in Keychain but no Soul file")
        case (.some(let s), _) where s.passkeyCredentialID == nil:
            return .mismatch(reason: "Soul exists but passkeyCredentialID is nil")
        case (.none, .none):
            return .fresh
        default:
            return .fresh
        }
    }

    func wipeAll() throws {
        deleteSoulFile()
        deleteCredentialID()

        try modelContext.delete(model: SDSoulTransaktion.self)
        try modelContext.delete(model: SDInsight.self)
        try modelContext.delete(model: SDSyncReport.self)
        try modelContext.delete(model: SDKonnection.self)
        try modelContext.delete(model: SDSoul.self)
        try modelContext.save()
    }

    // MARK: - Domain ↔ SwiftData mapping

    func saveKonnection(_ konnection: Konnection, soulID: UUID) throws {
        let descriptor = FetchDescriptor<SDSoul>(predicate: #Predicate { $0.soulID == soulID })
        guard let sdSoul = try modelContext.fetch(descriptor).first else { return }

        let sdk = SDKonnection(
            konnectionID: konnection.id,
            provider: konnection.provider.rawValue,
            status: konnection.status.rawValue,
            connectedAt: konnection.connectedAt,
            transaktionCount: konnection.transaktionCount
        )
        sdk.soul = sdSoul
        modelContext.insert(sdk)
        try modelContext.save()
    }

    func saveTransaktions(_ transaktions: [SoulTransaktion], konnectionID: UUID) throws {
        let descriptor = FetchDescriptor<SDKonnection>(predicate: #Predicate { $0.konnectionID == konnectionID })
        guard let sdKonnection = try modelContext.fetch(descriptor).first else { return }

        for txn in transaktions {
            let sd = SDSoulTransaktion(
                transaktionID: txn.id,
                source: txn.source.rawValue,
                transactionType: txn.transactionType.rawValue,
                harvestedAt: txn.harvestedAt,
                occurredAt: txn.occurredAt,
                rawRef: txn.rawRef,
                soulCategory: txn.soulCategory,
                confidence: txn.confidence
            )
            sd.amountUSD = (txn.amountUSD as NSDecimalNumber?)?.doubleValue
            sd.currency = txn.currency
            sd.merchantRaw = txn.merchantRaw
            sd.merchantCanonical = txn.merchantCanonical
            sd.categoryRaw = txn.categoryRaw
            sd.soulTags = encodeStrings(txn.soulTags)
            sd.intentSignals = encodeStrings(txn.intentSignals)
            sd.healthFlag = txn.healthFlag
            sd.marketplaceEligible = txn.marketplaceEligible
            sd.useLimitationTags = encodeStrings(txn.useLimitationTags)
            sd.konnection = sdKonnection
            modelContext.insert(sd)
        }

        sdKonnection.transaktionCount = sdKonnection.transaktions.count + transaktions.count
        sdKonnection.lastHarvestedAt = Date()
        try modelContext.save()
    }

    func saveInsights(_ insights: [Insight], soulID: UUID) throws {
        let descriptor = FetchDescriptor<SDSoul>(predicate: #Predicate { $0.soulID == soulID })
        guard let sdSoul = try modelContext.fetch(descriptor).first else { return }

        let existingDescriptor = FetchDescriptor<SDInsight>(predicate: #Predicate { $0.soul?.soulID == soulID })
        let existing = try modelContext.fetch(existingDescriptor)
        for old in existing {
            modelContext.delete(old)
        }

        for insight in insights {
            let sd = SDInsight(
                insightID: insight.id,
                category: insight.category,
                score: insight.score,
                confidence: insight.confidence,
                computedAt: insight.computedAt,
                algorithmVersion: insight.algorithmVersion
            )
            sd.isStale = insight.isStale
            sd.marketplaceEligible = insight.marketplaceEligible
            sd.soul = sdSoul
            modelContext.insert(sd)
        }
        try modelContext.save()
    }

    func saveSyncReport(_ report: SyncReport) throws {
        let konnectionID = report.konnectionID
        let descriptor = FetchDescriptor<SDKonnection>(predicate: #Predicate { $0.konnectionID == konnectionID })
        guard let sdKonnection = try modelContext.fetch(descriptor).first else { return }

        let sd = SDSyncReport(
            reportID: report.id,
            provider: report.provider.rawValue,
            startedAt: report.startedAt,
            status: report.status.rawValue,
            recordsSynced: report.recordsSynced
        )
        sd.completedAt = report.completedAt
        sd.categoriesFound = report.categoriesFound
        sd.dateRangeStart = report.dateRangeStart
        sd.dateRangeEnd = report.dateRangeEnd
        sd.timeToFirstRecord = report.timeToFirstRecord
        sd.timeToComplete = report.timeToComplete
        sd.slaViolations = encodeStrings(report.slaViolations)
        sd.consistencyWarnings = encodeStrings(report.consistencyWarnings)
        sd.konnection = sdKonnection
        modelContext.insert(sd)
        try modelContext.save()
    }

    func createSDSoul(from soul: Soul) throws {
        let sd = SDSoul(soulID: soul.id, createdAt: soul.createdAt, depthScore: soul.depthScore, phase: soul.phase.rawValue)
        sd.walletAddress = soul.walletAddress
        sd.walletProvisionedAt = soul.walletProvisionedAt
        modelContext.insert(sd)
        try modelContext.save()
    }

    func loadAllTransaktions(for soulID: UUID) throws -> [SoulTransaktion] {
        let descriptor = FetchDescriptor<SDSoulTransaktion>(
            predicate: #Predicate { $0.konnection?.soul?.soulID == soulID },
            sortBy: [SortDescriptor(\.occurredAt, order: .reverse)]
        )
        let results = try modelContext.fetch(descriptor)
        return results.compactMap { sd in
            guard let source = SoulTransaktion.Source(rawValue: sd.source),
                  let txnType = SoulTransaktion.TransactionType(rawValue: sd.transactionType) else { return nil }
            return SoulTransaktion(
                id: sd.transaktionID, source: source, transactionType: txnType,
                harvestedAt: sd.harvestedAt, occurredAt: sd.occurredAt, rawRef: sd.rawRef,
                amountUSD: sd.amountUSD.map { Decimal($0) }, currency: sd.currency,
                merchantRaw: sd.merchantRaw, merchantCanonical: sd.merchantCanonical,
                categoryRaw: sd.categoryRaw, soulCategory: sd.soulCategory,
                soulTags: decodeStrings(sd.soulTags), intentSignals: decodeStrings(sd.intentSignals),
                healthFlag: sd.healthFlag, marketplaceEligible: sd.marketplaceEligible,
                useLimitationTags: decodeStrings(sd.useLimitationTags), confidence: sd.confidence
            )
        }
    }

    func loadInsights(for soulID: UUID) throws -> [Insight] {
        let descriptor = FetchDescriptor<SDInsight>(
            predicate: #Predicate { $0.soul?.soulID == soulID },
            sortBy: [SortDescriptor(\.score, order: .reverse)]
        )
        return try modelContext.fetch(descriptor).map { sd in
            Insight(id: sd.insightID, soulID: soulID, category: sd.category,
                    score: sd.score, confidence: sd.confidence, computedAt: sd.computedAt,
                    algorithmVersion: sd.algorithmVersion, isStale: sd.isStale,
                    marketplaceEligible: sd.marketplaceEligible)
        }
    }

    func loadKonnections(for soulID: UUID) throws -> [Konnection] {
        let descriptor = FetchDescriptor<SDKonnection>(
            predicate: #Predicate { $0.soul?.soulID == soulID }
        )
        return try modelContext.fetch(descriptor).compactMap { sd in
            guard let provider = Konnection.Provider(rawValue: sd.provider),
                  let status = Konnection.Status(rawValue: sd.status) else { return nil }
            return Konnection(id: sd.konnectionID, soulID: soulID, provider: provider,
                              status: status, connectedAt: sd.connectedAt,
                              lastHarvestedAt: sd.lastHarvestedAt, transaktionCount: sd.transaktionCount)
        }
    }

    func exportAllData(for soulID: UUID) throws -> Data {
        let transaktions = try loadAllTransaktions(for: soulID)
        let insights = try loadInsights(for: soulID)
        let soul = loadSoul()

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601

        struct ExportPayload: Codable {
            let exportedAt: String
            let soul: Soul?
            let transaktions: [SoulTransaktion]
            let insights: [Insight]
        }

        let payload = ExportPayload(
            exportedAt: ISO8601DateFormatter().string(from: Date()),
            soul: soul,
            transaktions: transaktions,
            insights: insights
        )
        return try encoder.encode(payload)
    }

    // MARK: - Helpers

    private func encodeStrings(_ strings: [String]) -> String {
        (try? JSONEncoder().encode(strings)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
    }

    private func decodeStrings(_ string: String) -> [String] {
        (try? JSONDecoder().decode([String].self, from: Data(string.utf8))) ?? []
    }

    enum PersistenceError: Error {
        case keychainWriteFailed(OSStatus)
    }

    enum ConsistencyResult {
        case consistent
        case mismatch(reason: String)
        case fresh
    }
}
