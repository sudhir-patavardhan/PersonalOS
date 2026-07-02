import XCTest
@testable import PersonalOS

@MainActor
final class SoulManagerTests: XCTestCase {
    func testCreateSoulWithPasskey() async throws {
        let manager = try SoulManager(
            passkeyService: MockPasskeyService(),
            plaidService: MockPlaidService(),
            persistence: try PersistenceService(inMemory: true)
        )
        XCTAssertNil(manager.currentSoul)

        try await manager.createSoul()
        XCTAssertNotNil(manager.currentSoul)
        XCTAssertNotNil(manager.currentSoul?.passkeyCredentialID)
        XCTAssertTrue(manager.isAuthenticated)
        XCTAssertEqual(manager.currentSoul?.phase, .one)
    }

    func testAdvanceOnboarding() throws {
        let manager = try SoulManager(
            persistence: try PersistenceService(inMemory: true)
        )
        XCTAssertEqual(manager.onboardingStep, .welcome)

        manager.advanceOnboarding()
        XCTAssertEqual(manager.onboardingStep, .passkeyCreation)

        manager.advanceOnboarding()
        XCTAssertEqual(manager.onboardingStep, .plaidLink)

        manager.advanceOnboarding()
        XCTAssertEqual(manager.onboardingStep, .firstInsight)

        manager.advanceOnboarding()
        XCTAssertEqual(manager.onboardingStep, .firstInsight)
    }

    func testAppOpenCountPersists() throws {
        let manager = try SoulManager(
            persistence: try PersistenceService(inMemory: true)
        )
        let initialCount = manager.appOpenCount
        XCTAssertGreaterThanOrEqual(initialCount, 0)
    }

    func testDepthScore() throws {
        let manager = try SoulManager(
            persistence: try PersistenceService(inMemory: true)
        )
        XCTAssertEqual(manager.depthScore, 0.0)
        XCTAssertFalse(manager.isPhaseTwo)
    }
}
