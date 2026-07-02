import XCTest
@testable import PersonalOS

final class MockPlaidServiceTests: XCTestCase {
    func testStartLinkReturnsResult() async throws {
        let service = MockPlaidService(persona: .priya)
        let result = try await service.startLink()

        XCTAssertEqual(result.institutionName, "Chase")
        XCTAssertEqual(result.accountMask, "4521")
        XCTAssertFalse(result.institutionID.isEmpty)
    }

    func testFetchTransactionsReturnsData() async throws {
        let service = MockPlaidService(persona: .priya)
        let konnectionID = UUID()
        let txns = try await service.fetchTransactions(for: konnectionID)

        XCTAssertGreaterThan(txns.count, 100)
        XCTAssertTrue(txns.allSatisfy { $0.source == .plaid })
    }

    func testAllPersonasGenerateTransactions() async throws {
        for persona in MockPlaidService.Persona.allCases {
            let service = MockPlaidService(persona: persona)
            let txns = try await service.fetchTransactions(for: UUID())
            XCTAssertGreaterThan(txns.count, 50, "\(persona) should generate substantial transactions")
        }
    }

    func testTransactionsHaveCategories() async throws {
        let service = MockPlaidService(persona: .marcus)
        let txns = try await service.fetchTransactions(for: UUID())
        let categories = Set(txns.map(\.soulCategory))

        XCTAssertGreaterThan(categories.count, 8, "Should have diverse categories")
    }

    func testTransactionsWithin90Days() async throws {
        let service = MockPlaidService(persona: .sofia)
        let txns = try await service.fetchTransactions(for: UUID())
        let ninetyDaysAgo = Calendar.current.date(byAdding: .day, value: -90, to: Date())!

        for txn in txns {
            XCTAssertGreaterThanOrEqual(txn.occurredAt, ninetyDaysAgo)
            XCTAssertLessThanOrEqual(txn.occurredAt, Date())
        }
    }

    func testTransactionsSortedByDateDescending() async throws {
        let service = MockPlaidService(persona: .james)
        let txns = try await service.fetchTransactions(for: UUID())

        for i in 0..<(txns.count - 1) {
            XCTAssertGreaterThanOrEqual(txns[i].occurredAt, txns[i + 1].occurredAt)
        }
    }

    func testIncomeTransactionsPresent() async throws {
        let service = MockPlaidService(persona: .priya)
        let txns = try await service.fetchTransactions(for: UUID())
        let income = txns.filter { $0.transactionType == .income }

        XCTAssertGreaterThan(income.count, 0, "Should have income transactions")
    }
}
