import XCTest
@testable import PersonalOS

final class ModelTests: XCTestCase {
    func testSoulDefaults() {
        let soul = Soul()
        XCTAssertEqual(soul.phase, .one)
        XCTAssertEqual(soul.depthScore, 0.0)
        XCTAssertNil(soul.passkeyCredentialID)
        XCTAssertNil(soul.walletAddress)
    }

    func testKonnectionProviderTiers() {
        XCTAssertEqual(Konnection.Provider.plaid.tier, .one)
        XCTAssertEqual(Konnection.Provider.setuAA.tier, .one)
        XCTAssertEqual(Konnection.Provider.googleDPA.tier, .two)
        XCTAssertEqual(Konnection.Provider.appleHealth.tier, .two)
        XCTAssertEqual(Konnection.Provider.amazonBYOD.tier, .three)
    }

    func testKonnectionDepthWeightsSum() {
        let totalWeight = Konnection.Provider.allCases.reduce(0.0) { $0 + $1.depthWeight }
        XCTAssertEqual(totalWeight, 1.0, accuracy: 0.001)
    }

    func testConsentIsActive() {
        let active = Consent(id: UUID(), soulID: UUID(), category: "Finance", yieldFloorUSDC: 0.50, maxOffersPerDay: 3, grantedAt: Date(), revokedAt: nil)
        XCTAssertTrue(active.isActive)

        let revoked = Consent(id: UUID(), soulID: UUID(), category: "Finance", yieldFloorUSDC: 0.50, maxOffersPerDay: 3, grantedAt: Date(), revokedAt: Date())
        XCTAssertFalse(revoked.isActive)
    }

    func testTransactionTypeEnum() {
        let types: [SoulTransaktion.TransactionType] = [.purchase, .transfer, .payment, .income, .fee, .refund, .interest, .activity, .unknown]
        XCTAssertEqual(types.count, 9)
    }
}
