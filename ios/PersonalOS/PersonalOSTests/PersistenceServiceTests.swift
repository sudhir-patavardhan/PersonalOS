import XCTest
@testable import PersonalOS

@MainActor
final class PersistenceServiceTests: XCTestCase {
    func testCreateAndLoadSDSoul() throws {
        let persistence = try PersistenceService(inMemory: true)
        let soul = Soul()

        try persistence.createSDSoul(from: soul)

        let descriptor = SwiftData.FetchDescriptor<SDSoul>()
        let results = try persistence.modelContext.fetch(descriptor)
        XCTAssertEqual(results.count, 1)
        XCTAssertEqual(results.first?.soulID, soul.id)
    }

    func testConsistencyCheckFresh() throws {
        let persistence = try PersistenceService(inMemory: true)
        let result = persistence.consistencyCheck()

        switch result {
        case .fresh:
            break
        default:
            XCTFail("Expected fresh state")
        }
    }

    func testWipeAll() throws {
        let persistence = try PersistenceService(inMemory: true)
        let soul = Soul()
        try persistence.createSDSoul(from: soul)

        try persistence.wipeAll()

        let descriptor = SwiftData.FetchDescriptor<SDSoul>()
        let results = try persistence.modelContext.fetch(descriptor)
        XCTAssertEqual(results.count, 0)
    }

    func testSaveAndLoadInsights() throws {
        let persistence = try PersistenceService(inMemory: true)
        let soul = Soul()
        try persistence.createSDSoul(from: soul)

        let insights = [
            Insight(id: UUID(), soulID: soul.id, category: "dining.grocery", score: 72,
                    confidence: 0.85, computedAt: Date(), algorithmVersion: "basic-v1.0",
                    isStale: false, marketplaceEligible: true),
            Insight(id: UUID(), soulID: soul.id, category: "health.medical", score: 45,
                    confidence: 0.6, computedAt: Date(), algorithmVersion: "basic-v1.0",
                    isStale: false, marketplaceEligible: false),
        ]

        try persistence.saveInsights(insights, soulID: soul.id)

        let loaded = try persistence.loadInsights(for: soul.id)
        XCTAssertEqual(loaded.count, 2)
    }
}
