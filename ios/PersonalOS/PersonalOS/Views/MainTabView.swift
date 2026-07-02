import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var soulManager: SoulManager

    var body: some View {
        TabView {
            InsightFeedView()
                .tabItem {
                    Label("Insights", systemImage: "chart.bar.fill")
                }

            KonnectionListView()
                .tabItem {
                    Label("Sources", systemImage: "link.circle.fill")
                }

            WalletView()
                .tabItem {
                    Label("Wallet", systemImage: "wallet.pass.fill")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
        .alert("Connect Your Bank?", isPresented: .constant(soulManager.shouldShowPlaidNudge)) {
            Button("Link Now") {
                Task { try? await soulManager.linkPlaid() }
            }
            Button("Not Now", role: .cancel) { }
        } message: {
            Text("Linking a bank account helps PersonalOS build richer insights about your financial patterns.")
        }
    }
}

struct KonnectionListView: View {
    @EnvironmentObject var soulManager: SoulManager
    @State private var isLinking = false
    @State private var connectingProvider: Konnection.Provider?
    @State private var isActivatingAll = false

    var body: some View {
        NavigationStack {
            List {
                if soulManager.isSandboxMode {
                    Section {
                        HStack {
                            Image(systemName: "flask.fill")
                                .foregroundStyle(.orange)
                            Text("Sandbox Mode")
                                .font(.headline)
                                .foregroundStyle(.orange)
                            Spacer()
                            Text("Synthetic Data")
                                .font(.caption2)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.orange.opacity(0.2))
                                .clipShape(Capsule())
                        }
                    }
                }

                if !soulManager.konnections.isEmpty {
                    Section("Connected (\(soulManager.konnections.count))") {
                        ForEach(soulManager.konnections) { konnection in
                            HStack {
                                Image(systemName: iconName(for: konnection.provider))
                                VStack(alignment: .leading) {
                                    Text(konnection.provider.displayName)
                                        .font(.headline)
                                    Text("\(konnection.transaktionCount) transactions")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                statusBadge(konnection.status)
                            }
                        }
                    }
                }

                let availableProviders = allConnectors.filter { connector in
                    !soulManager.konnections.contains(where: { $0.provider == connector.provider })
                }

                if !availableProviders.isEmpty {
                    Section("Available") {
                        ForEach(availableProviders, id: \.provider) { connector in
                            Button {
                                Task {
                                    connectingProvider = connector.provider
                                    do {
                                        if connector.provider == .plaid {
                                            try await soulManager.linkPlaid()
                                        } else {
                                            try await soulManager.connectSandboxProvider(connector.provider)
                                        }
                                    } catch {}
                                    connectingProvider = nil
                                }
                            } label: {
                                HStack {
                                    Image(systemName: connector.icon)
                                    VStack(alignment: .leading) {
                                        Text(connector.name)
                                            .font(.headline)
                                        Text(connector.description)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    if connectingProvider == connector.provider {
                                        ProgressView()
                                    } else {
                                        Image(systemName: "plus.circle.fill")
                                            .foregroundStyle(.blue)
                                    }
                                }
                            }
                            .disabled(connectingProvider != nil)
                        }
                    }

                    Section {
                        Button {
                            Task {
                                isActivatingAll = true
                                try? await soulManager.activateSandboxMode()
                                isActivatingAll = false
                            }
                        } label: {
                            HStack {
                                Image(systemName: "flask.fill")
                                Text("Connect All (Sandbox)")
                                    .font(.headline)
                                Spacer()
                                if isActivatingAll {
                                    ProgressView()
                                } else {
                                    Image(systemName: "bolt.fill")
                                        .foregroundStyle(.orange)
                                }
                            }
                        }
                        .disabled(isActivatingAll || connectingProvider != nil)
                    } footer: {
                        Text("Loads synthetic data for all connectors to preview the full PersonalOS experience.")
                    }
                }
            }
            .navigationTitle("Data Sources")
            .overlay {
                if soulManager.konnections.isEmpty && connectingProvider == nil && !isActivatingAll {
                    ContentUnavailableView(
                        "No Sources Connected",
                        systemImage: "link.circle",
                        description: Text("Connect a data source or activate sandbox mode to explore.")
                    )
                }
            }
        }
    }

    private var allConnectors: [(provider: Konnection.Provider, name: String, icon: String, description: String)] {
        [
            (.plaid, "Bank Account (Plaid)", "building.columns.fill", "Financial transactions and patterns"),
            (.appleHealth, "Apple Health", "heart.fill", "Fitness, sleep, and wellness data"),
            (.googleDPA, "Google Activity", "globe", "Search, browsing, and location patterns"),
            (.amazonBYOD, "Amazon", "shippingbox.fill", "Purchase history and browsing"),
            (.uberBYOD, "Uber", "car.fill", "Rides and Uber Eats delivery"),
            (.instagramBYOD, "Instagram", "camera.fill", "Content engagement and interests"),
        ]
    }

    private func iconName(for provider: Konnection.Provider) -> String {
        switch provider {
        case .plaid, .setuAA: return "building.columns.fill"
        case .googleDPA: return "globe"
        case .appleHealth: return "heart.fill"
        case .amazonBYOD: return "shippingbox.fill"
        case .uberBYOD: return "car.fill"
        case .instagramBYOD: return "camera.fill"
        }
    }

    private func statusBadge(_ status: Konnection.Status) -> some View {
        Text(status.rawValue.capitalized)
            .font(.caption2)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(status == .active ? Color.green.opacity(0.2) : Color.orange.opacity(0.2))
            .clipShape(Capsule())
    }
}

struct SettingsView: View {
    @EnvironmentObject var soulManager: SoulManager
    @State private var showDeleteConfirm = false
    @State private var showExportSheet = false
    @State private var exportData: Data?
    @State private var isExporting = false
    @State private var isDeleting = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List {
                Section("Soul") {
                    if let soul = soulManager.currentSoul {
                        LabeledContent("ID", value: String(soul.id.uuidString.prefix(8)) + "...")
                        LabeledContent("Phase", value: soul.phase == .one ? "Self-Knowledge" : "Marketplace")
                        LabeledContent("Depth Score", value: String(format: "%.1f%%", soul.depthScore))
                        LabeledContent("Sources", value: "\(soulManager.konnections.count)")
                        LabeledContent("Insights", value: "\(soulManager.insights.count)")
                    }
                }

                Section("Data") {
                    Button {
                        Task {
                            isExporting = true
                            do {
                                exportData = try await soulManager.exportData()
                                showExportSheet = true
                            } catch {
                                errorMessage = error.localizedDescription
                            }
                            isExporting = false
                        }
                    } label: {
                        HStack {
                            Label("Export All Data", systemImage: "square.and.arrow.up")
                            Spacer()
                            if isExporting { ProgressView() }
                        }
                    }
                    .disabled(isExporting)
                }

                Section {
                    Button(role: .destructive) {
                        showDeleteConfirm = true
                    } label: {
                        HStack {
                            Label("Delete Account", systemImage: "trash")
                            Spacer()
                            if isDeleting { ProgressView() }
                        }
                    }
                    .disabled(isDeleting)
                } footer: {
                    Text("This permanently deletes all your data from this device. This cannot be undone.")
                }

                if let error = errorMessage {
                    Section {
                        Text(error)
                            .foregroundStyle(.red)
                            .font(.caption)
                    }
                }

                Section("About") {
                    LabeledContent("Version", value: "0.2.0")
                    LabeledContent("Algorithm", value: BasicScoringEngine.algorithmVersion)
                }
            }
            .navigationTitle("Settings")
            .confirmationDialog("Delete Account?", isPresented: $showDeleteConfirm, titleVisibility: .visible) {
                Button("Delete Everything", role: .destructive) {
                    Task {
                        isDeleting = true
                        do {
                            try await soulManager.deleteAccount()
                        } catch {
                            errorMessage = error.localizedDescription
                        }
                        isDeleting = false
                    }
                }
                Button("Cancel", role: .cancel) { }
            } message: {
                Text("This will permanently delete your Soul, all connected data sources, transaction history, and insights. You will need to re-authenticate with your passkey.")
            }
            .sheet(isPresented: $showExportSheet) {
                if let data = exportData {
                    ShareSheet(items: [data])
                }
            }
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
