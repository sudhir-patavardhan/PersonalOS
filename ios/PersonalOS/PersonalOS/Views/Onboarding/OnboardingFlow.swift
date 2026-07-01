import SwiftUI

struct OnboardingFlow: View {
    @EnvironmentObject var soulManager: SoulManager

    var body: some View {
        NavigationStack {
            VStack {
                ProgressView(value: progress)
                    .padding(.horizontal)

                TabView(selection: $soulManager.onboardingStep) {
                    WelcomeStep()
                        .tag(SoulManager.OnboardingStep.welcome)

                    PasskeyStep()
                        .tag(SoulManager.OnboardingStep.passkeyCreation)

                    PlaidLinkStep()
                        .tag(SoulManager.OnboardingStep.plaidLink)

                    FirstInsightStep()
                        .tag(SoulManager.OnboardingStep.firstInsight)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: soulManager.onboardingStep)
            }
            .navigationTitle("PersonalOS")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var progress: Double {
        let total = Double(SoulManager.OnboardingStep.allCases.count)
        return Double(soulManager.onboardingStep.rawValue) / total
    }
}

struct WelcomeStep: View {
    @EnvironmentObject var soulManager: SoulManager

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "person.crop.circle.badge.checkmark")
                .font(.system(size: 72))
                .foregroundStyle(.tint)

            Text("Own Your Data")
                .font(.largeTitle.bold())

            Text("PersonalOS gives you control over your personal data — and lets you earn from it on your terms.")
                .font(.body)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()

            Button("Create Your Soul") {
                Task {
                    try? await soulManager.createSoul()
                    soulManager.advanceOnboarding()
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .padding(.bottom, 48)
        }
    }
}

struct PasskeyStep: View {
    @EnvironmentObject var soulManager: SoulManager

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "key.fill")
                .font(.system(size: 72))
                .foregroundStyle(.tint)

            Text("Secure with Passkey")
                .font(.title.bold())

            Text("Your passkey protects your data with biometric authentication. No passwords to remember.")
                .font(.body)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()

            Button("Create Passkey") {
                // L0.2: PasskeyService.createPasskey()
                soulManager.advanceOnboarding()
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .padding(.bottom, 48)
        }
    }
}

struct PlaidLinkStep: View {
    @EnvironmentObject var soulManager: SoulManager

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "building.columns.fill")
                .font(.system(size: 72))
                .foregroundStyle(.tint)

            Text("Connect Your Bank")
                .font(.title.bold())

            Text("Link a bank account to start building your financial profile. Your data stays encrypted on your device.")
                .font(.body)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()

            Button("Link Bank Account") {
                // L0.2+: Plaid Link SDK integration
                soulManager.advanceOnboarding()
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)

            Button("Skip for Now") {
                soulManager.advanceOnboarding()
            }
            .foregroundStyle(.secondary)
            .padding(.bottom, 48)
        }
    }
}

struct FirstInsightStep: View {
    @EnvironmentObject var soulManager: SoulManager

    var body: some View {
        VStack(spacing: 24) {
            Spacer()
            Image(systemName: "chart.bar.xaxis.ascending")
                .font(.system(size: 72))
                .foregroundStyle(.tint)

            Text("Your First Insight")
                .font(.title.bold())

            Text("PersonalOS analyzes your data on-device to build Insight scores — your knowledge profile that you control.")
                .font(.body)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()

            Button("Get Started") {
                // Onboarding complete — transition to main app
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .padding(.bottom, 48)
        }
    }
}
