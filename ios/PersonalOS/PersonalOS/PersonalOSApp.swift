import SwiftUI

@main
struct PersonalOSApp: App {
    @StateObject private var soulManager = SoulManager()

    var body: some Scene {
        WindowGroup {
            if soulManager.currentSoul != nil {
                MainTabView()
                    .environmentObject(soulManager)
            } else {
                OnboardingFlow()
                    .environmentObject(soulManager)
            }
        }
    }
}
