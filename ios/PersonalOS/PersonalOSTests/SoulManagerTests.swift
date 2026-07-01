import XCTest
@testable import PersonalOS

@MainActor
final class SoulManagerTests: XCTestCase {
    func testCreateSoul() async throws {
        let manager = SoulManager()
        XCTAssertNil(manager.currentSoul)

        try await manager.createSoul()
        XCTAssertNotNil(manager.currentSoul)
        XCTAssertEqual(manager.currentSoul?.phase, .one)
        XCTAssertEqual(manager.currentSoul?.depthScore, 0.0)
    }

    func testAdvanceOnboarding() {
        let manager = SoulManager()
        XCTAssertEqual(manager.onboardingStep, .welcome)

        manager.advanceOnboarding()
        XCTAssertEqual(manager.onboardingStep, .passkeyCreation)

        manager.advanceOnboarding()
        XCTAssertEqual(manager.onboardingStep, .plaidLink)

        manager.advanceOnboarding()
        XCTAssertEqual(manager.onboardingStep, .firstInsight)

        // Should not advance past last step
        manager.advanceOnboarding()
        XCTAssertEqual(manager.onboardingStep, .firstInsight)
    }

    func testDepthScore() {
        let manager = SoulManager()
        XCTAssertEqual(manager.depthScore, 0.0)
        XCTAssertFalse(manager.isPhaseTwo)
    }
}
