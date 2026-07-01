import Foundation
import SwiftUI

@MainActor
class SoulManager: ObservableObject {
    @Published var currentSoul: Soul?
    @Published var konnections: [Konnection] = []
    @Published var insights: [Insight] = []
    @Published var offers: [Offer] = []
    @Published var onboardingStep: OnboardingStep = .welcome

    enum OnboardingStep: Int, CaseIterable {
        case welcome = 0
        case passkeyCreation = 1
        case plaidLink = 2
        case firstInsight = 3
    }

    func createSoul() async throws {
        var soul = Soul()
        // L0.2: passkey creation will go here
        // L0.3: AES key derivation will go here
        // L0.4: wallet provisioning will go here (background)
        self.currentSoul = soul
    }

    func advanceOnboarding() {
        let allSteps = OnboardingStep.allCases
        guard let currentIndex = allSteps.firstIndex(of: onboardingStep),
              currentIndex + 1 < allSteps.count else { return }
        onboardingStep = allSteps[currentIndex + 1]
    }

    var depthScore: Double {
        currentSoul?.depthScore ?? 0.0
    }

    var isPhaseTwo: Bool {
        currentSoul?.phase == .two
    }
}
