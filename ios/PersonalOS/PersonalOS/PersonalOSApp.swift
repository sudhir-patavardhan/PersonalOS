import SwiftUI
import SwiftData

@main
struct PersonalOSApp: App {
    @StateObject private var soulManager: SoulManager
    @Environment(\.scenePhase) private var scenePhase

    init() {
        do {
            let manager = try SoulManager()
            _soulManager = StateObject(wrappedValue: manager)
        } catch {
            fatalError("Failed to initialize SoulManager: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if soulManager.currentSoul == nil {
                    OnboardingFlow()
                        .environmentObject(soulManager)
                } else if !soulManager.isAuthenticated {
                    AuthGateView()
                        .environmentObject(soulManager)
                } else {
                    MainTabView()
                        .environmentObject(soulManager)
                }
            }
            .task {
                await soulManager.onAppLaunch()
            }
            .onChange(of: scenePhase) { _, newPhase in
                switch newPhase {
                case .background:
                    soulManager.onEnterBackground()
                case .active:
                    soulManager.onEnterForeground()
                default:
                    break
                }
            }
        }
    }
}

struct AuthGateView: View {
    @EnvironmentObject var soulManager: SoulManager
    @State private var isAuthenticating = false
    @State private var authError: String?

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Image(systemName: "key.fill")
                .font(.system(size: 64))
                .foregroundStyle(.blue)

            Text("PersonalOS")
                .font(.largeTitle.bold())

            Text("Authenticate to continue")
                .font(.title3)
                .foregroundStyle(.secondary)

            if let error = authError {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            Button {
                Task {
                    isAuthenticating = true
                    authError = nil
                    do {
                        try await soulManager.authenticate()
                    } catch {
                        authError = error.localizedDescription
                    }
                    isAuthenticating = false
                }
            } label: {
                HStack {
                    if isAuthenticating {
                        ProgressView()
                            .tint(.white)
                    }
                    Text(isAuthenticating ? "Authenticating..." : "Unlock with Passkey")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(.blue)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(isAuthenticating)
            .padding(.horizontal, 40)

            Spacer()
        }
    }
}
