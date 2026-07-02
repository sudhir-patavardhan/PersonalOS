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

            Button("Get Started") {
                soulManager.advanceOnboarding()
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .padding(.bottom, 48)
        }
    }
}

struct PasskeyStep: View {
    @EnvironmentObject var soulManager: SoulManager
    @State private var isCreating = false
    @State private var errorMessage: String?

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

            Text("This step is required")
                .font(.caption)
                .foregroundStyle(.secondary)

            if let error = errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            Spacer()

            Button {
                Task {
                    isCreating = true
                    errorMessage = nil
                    do {
                        try await soulManager.createSoul()
                        soulManager.advanceOnboarding()
                    } catch {
                        errorMessage = error.localizedDescription
                    }
                    isCreating = false
                }
            } label: {
                HStack {
                    if isCreating {
                        ProgressView()
                            .tint(.white)
                    }
                    Text(isCreating ? "Creating Passkey..." : "Create Passkey")
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(isCreating)
            .padding(.bottom, 48)
        }
    }
}

struct PlaidLinkStep: View {
    @EnvironmentObject var soulManager: SoulManager
    @State private var isLinking = false
    @State private var errorMessage: String?

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

            if let error = errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            Spacer()

            Button {
                Task {
                    isLinking = true
                    errorMessage = nil
                    do {
                        try await soulManager.linkPlaid()
                        soulManager.advanceOnboarding()
                    } catch {
                        errorMessage = error.localizedDescription
                    }
                    isLinking = false
                }
            } label: {
                HStack {
                    if isLinking {
                        ProgressView()
                            .tint(.white)
                    }
                    Text(isLinking ? "Linking..." : "Link Bank Account")
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(isLinking)

            Button("Skip for Now") {
                soulManager.skipPlaid()
            }
            .foregroundStyle(.secondary)
            .padding(.bottom, 48)
        }
    }
}

struct FirstInsightStep: View {
    @EnvironmentObject var soulManager: SoulManager
    @State private var showInsights = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            if soulManager.insights.isEmpty {
                Image(systemName: "chart.bar.xaxis.ascending")
                    .font(.system(size: 72))
                    .foregroundStyle(.tint)

                Text("Your First Insight")
                    .font(.title.bold())

                if soulManager.konnections.isEmpty {
                    Text("Connect a data source to start building your profile. You can do this from the Sources tab.")
                        .font(.body)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                } else {
                    Text("Your data is being analyzed on-device to build Insight scores — your knowledge profile that you control.")
                        .font(.body)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                }
            } else {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 72))
                    .foregroundStyle(.green)

                Text("Insights Ready!")
                    .font(.title.bold())

                Text("\(soulManager.insights.count) insights computed. Depth Score: \(Int(soulManager.depthScore))")
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            Spacer()

            Button("Enter PersonalOS") {
                // Transition handled by PersonalOSApp — soul exists + authenticated = MainTabView
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .padding(.bottom, 48)
        }
    }
}
