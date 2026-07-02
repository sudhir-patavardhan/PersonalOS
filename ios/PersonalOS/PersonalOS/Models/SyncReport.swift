import Foundation

struct SyncReport: Identifiable, Codable {
    let id: UUID
    let konnectionID: UUID
    let provider: Konnection.Provider
    let startedAt: Date
    let completedAt: Date?
    let status: Status
    let recordsSynced: Int
    let categoriesFound: Int
    let dateRangeStart: Date?
    let dateRangeEnd: Date?
    let timeToFirstRecord: TimeInterval?
    let timeToComplete: TimeInterval?
    let slaViolations: [String]
    let consistencyWarnings: [String]

    enum Status: String, Codable {
        case syncing
        case completed
        case failed
    }

    var duration: TimeInterval? {
        guard let end = completedAt else { return nil }
        return end.timeIntervalSince(startedAt)
    }
}
