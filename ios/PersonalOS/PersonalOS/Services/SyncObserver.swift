import Foundation

struct ProviderSLA {
    let provider: Konnection.Provider
    let maxTimeToFirst: TimeInterval
    let maxTimeToComplete: TimeInterval
    let expectedVolumeRange: ClosedRange<Int>

    static let all: [Konnection.Provider: ProviderSLA] = [
        .plaid: ProviderSLA(provider: .plaid, maxTimeToFirst: 5, maxTimeToComplete: 30, expectedVolumeRange: 50...500),
        .setuAA: ProviderSLA(provider: .setuAA, maxTimeToFirst: 8, maxTimeToComplete: 45, expectedVolumeRange: 50...400),
        .googleDPA: ProviderSLA(provider: .googleDPA, maxTimeToFirst: 3, maxTimeToComplete: 20, expectedVolumeRange: 200...2000),
        .appleHealth: ProviderSLA(provider: .appleHealth, maxTimeToFirst: 2, maxTimeToComplete: 15, expectedVolumeRange: 500...5000),
        .amazonBYOD: ProviderSLA(provider: .amazonBYOD, maxTimeToFirst: 10, maxTimeToComplete: 60, expectedVolumeRange: 20...200),
        .uberBYOD: ProviderSLA(provider: .uberBYOD, maxTimeToFirst: 5, maxTimeToComplete: 30, expectedVolumeRange: 10...150),
        .instagramBYOD: ProviderSLA(provider: .instagramBYOD, maxTimeToFirst: 5, maxTimeToComplete: 30, expectedVolumeRange: 50...500),
    ]
}

class SyncObserver: ObservableObject {
    enum SyncState: Equatable {
        case idle
        case syncing
        case completed
        case failed
    }

    private var providerStates: [Konnection.Provider: SyncState] = [:]
    private var syncStarts: [Konnection.Provider: Date] = [:]
    private var firstRecordTimes: [Konnection.Provider: Date] = [:]
    private var recordCounts: [Konnection.Provider: Int] = [:]
    private var konnectionIDs: [Konnection.Provider: UUID] = [:]

    func state(for provider: Konnection.Provider) -> SyncState {
        providerStates[provider] ?? .idle
    }

    func beginSync(provider: Konnection.Provider, konnectionID: UUID) {
        syncStarts[provider] = Date()
        firstRecordTimes[provider] = nil
        recordCounts[provider] = 0
        konnectionIDs[provider] = konnectionID
        providerStates[provider] = .syncing
    }

    func recordReceived(provider: Konnection.Provider) {
        if firstRecordTimes[provider] == nil {
            firstRecordTimes[provider] = Date()
        }
        recordCounts[provider] = (recordCounts[provider] ?? 0) + 1
    }

    func completeSync(provider: Konnection.Provider) -> SyncReport {
        let now = Date()
        let start = syncStarts[provider] ?? now
        let konnectionID = konnectionIDs[provider] ?? UUID()
        let count = recordCounts[provider] ?? 0

        let timeToFirst = firstRecordTimes[provider].map { $0.timeIntervalSince(start) }
        let timeToComplete = now.timeIntervalSince(start)

        var slaViolations: [String] = []
        var consistencyWarnings: [String] = []

        if let sla = ProviderSLA.all[provider] {
            if let ttf = timeToFirst, ttf > sla.maxTimeToFirst {
                slaViolations.append("Time-to-first-record \(String(format: "%.1f", ttf))s exceeds SLA \(sla.maxTimeToFirst)s")
            }
            if timeToComplete > sla.maxTimeToComplete {
                slaViolations.append("Time-to-complete \(String(format: "%.1f", timeToComplete))s exceeds SLA \(sla.maxTimeToComplete)s")
            }
            if !sla.expectedVolumeRange.contains(count) {
                consistencyWarnings.append("Volume \(count) outside expected range \(sla.expectedVolumeRange)")
            }
        }

        providerStates[provider] = .completed
        cleanup(provider)

        return SyncReport(
            id: UUID(),
            konnectionID: konnectionID,
            provider: provider,
            startedAt: start,
            completedAt: now,
            status: .completed,
            recordsSynced: count,
            categoriesFound: 0,
            dateRangeStart: nil,
            dateRangeEnd: nil,
            timeToFirstRecord: timeToFirst,
            timeToComplete: timeToComplete,
            slaViolations: slaViolations,
            consistencyWarnings: consistencyWarnings
        )
    }

    func failSync(provider: Konnection.Provider, error: Error) -> SyncReport {
        let now = Date()
        let start = syncStarts[provider] ?? now
        let konnectionID = konnectionIDs[provider] ?? UUID()

        providerStates[provider] = .failed
        cleanup(provider)

        return SyncReport(
            id: UUID(),
            konnectionID: konnectionID,
            provider: provider,
            startedAt: start,
            completedAt: now,
            status: .failed,
            recordsSynced: 0,
            categoriesFound: 0,
            dateRangeStart: nil,
            dateRangeEnd: nil,
            timeToFirstRecord: nil,
            timeToComplete: nil,
            slaViolations: ["Sync failed: \(error.localizedDescription)"],
            consistencyWarnings: []
        )
    }

    private func cleanup(_ provider: Konnection.Provider) {
        syncStarts[provider] = nil
        firstRecordTimes[provider] = nil
        recordCounts[provider] = nil
        konnectionIDs[provider] = nil
    }
}
