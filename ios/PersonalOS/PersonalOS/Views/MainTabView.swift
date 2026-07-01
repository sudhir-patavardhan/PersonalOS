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
    }
}

struct KonnectionListView: View {
    @EnvironmentObject var soulManager: SoulManager

    var body: some View {
        NavigationStack {
            List {
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
            .navigationTitle("Data Sources")
            .overlay {
                if soulManager.konnections.isEmpty {
                    ContentUnavailableView(
                        "No Sources Connected",
                        systemImage: "link.circle",
                        description: Text("Connect a data source to start building your profile.")
                    )
                }
            }
        }
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

    var body: some View {
        NavigationStack {
            List {
                Section("Soul") {
                    if let soul = soulManager.currentSoul {
                        LabeledContent("ID", value: soul.id.uuidString.prefix(8) + "…")
                        LabeledContent("Phase", value: soul.phase == .one ? "Self-Knowledge" : "Marketplace")
                        LabeledContent("Depth Score", value: String(format: "%.1f%%", soul.depthScore))
                    }
                }

                Section("Security") {
                    Button("Export Data") { }
                    Button("Delete Account", role: .destructive) { }
                }
            }
            .navigationTitle("Settings")
        }
    }
}
