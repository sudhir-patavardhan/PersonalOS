import XCTest
@testable import PersonalOS

final class BasicScoringEngineTests: XCTestCase {
    let engine = BasicScoringEngine()
    let soulID = UUID()

    func testEmptyTransactionsProducesNoInsights() {
        let insights = engine.computeInsights(transaktions: [], soulID: soulID)
        XCTAssertTrue(insights.isEmpty)
    }

    func testInsightsComputedFromTransactions() {
        let txns = makeDiningTransactions(count: 20)
        let insights = engine.computeInsights(transaktions: txns, soulID: soulID)

        XCTAssertFalse(insights.isEmpty)
        XCTAssertTrue(insights.allSatisfy { $0.score >= 0 && $0.score <= 100 })
        XCTAssertTrue(insights.allSatisfy { $0.confidence > 0 && $0.confidence <= 1.0 })
        XCTAssertEqual(insights.first?.algorithmVersion, BasicScoringEngine.algorithmVersion)
    }

    func testHealthMedicalNotMarketplaceEligible() {
        let txns = makeTransactions(category: "health.medical", count: 15)
        let insights = engine.computeInsights(transaktions: txns, soulID: soulID)

        let healthInsight = insights.first { $0.category == "health.medical" }
        XCTAssertNotNil(healthInsight)
        XCTAssertFalse(healthInsight!.marketplaceEligible)
    }

    func testDepthScoreFromInsights() {
        let insights = [
            Insight(id: UUID(), soulID: soulID, category: "dining.grocery", score: 70, confidence: 0.8, computedAt: Date(), algorithmVersion: "v1", isStale: false, marketplaceEligible: true),
            Insight(id: UUID(), soulID: soulID, category: "transport.commute", score: 50, confidence: 0.7, computedAt: Date(), algorithmVersion: "v1", isStale: false, marketplaceEligible: true),
            Insight(id: UUID(), soulID: soulID, category: "health.medical", score: 80, confidence: 0.9, computedAt: Date(), algorithmVersion: "v1", isStale: false, marketplaceEligible: false),
        ]

        let depth = engine.computeDepthScore(insights: insights)
        XCTAssertGreaterThan(depth, 0)
        XCTAssertLessThanOrEqual(depth, 100)
    }

    func testInsightsSortedByScoreDescending() {
        let txns = makeMixedTransactions()
        let insights = engine.computeInsights(transaktions: txns, soulID: soulID)

        for i in 0..<(insights.count - 1) {
            XCTAssertGreaterThanOrEqual(insights[i].score, insights[i + 1].score)
        }
    }

    func testAllCategoriesDefined() {
        XCTAssertEqual(BasicScoringEngine.allCategories.count, 12)
    }

    // MARK: - Helpers

    private func makeDiningTransactions(count: Int) -> [SoulTransaktion] {
        (0..<count).map { i in
            SoulTransaktion(
                source: .plaid, transactionType: .purchase,
                occurredAt: Date().addingTimeInterval(Double(-i * 86400)),
                rawRef: "ref_\(i)", amountUSD: Decimal(Double.random(in: 10...50)),
                currency: "USD", merchantRaw: "RESTAURANT \(i)",
                merchantCanonical: "Restaurant", categoryRaw: "FOOD_AND_DRINK",
                soulCategory: "dining.restaurant", soulTags: ["dining_out"]
            )
        }
    }

    private func makeTransactions(category: String, count: Int) -> [SoulTransaktion] {
        (0..<count).map { i in
            SoulTransaktion(
                source: .plaid, transactionType: .purchase,
                occurredAt: Date().addingTimeInterval(Double(-i * 86400)),
                rawRef: "ref_\(category)_\(i)", amountUSD: Decimal(Double.random(in: 20...200)),
                currency: "USD", soulCategory: category
            )
        }
    }

    private func makeMixedTransactions() -> [SoulTransaktion] {
        var txns: [SoulTransaktion] = []
        txns += makeDiningTransactions(count: 20)
        txns += makeTransactions(category: "transport.commute", count: 10)
        txns += makeTransactions(category: "health.fitness", count: 5)
        return txns
    }
}
