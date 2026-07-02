import SwiftUI

struct InsightFeedView: View {
    @EnvironmentObject var soulManager: SoulManager

    var body: some View {
        NavigationStack {
            List {
                Section {
                    DepthScoreCard(score: soulManager.depthScore, isPhaseTwo: soulManager.isPhaseTwo)
                }
                .listRowInsets(EdgeInsets())
                .listRowBackground(Color.clear)

                if soulManager.isSyncing {
                    Section {
                        HStack {
                            ProgressView()
                            Text("Syncing transactions...")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                if let error = soulManager.syncError {
                    Section {
                        Label(error, systemImage: "exclamationmark.triangle")
                            .font(.caption)
                            .foregroundStyle(.orange)
                    }
                }

                if !soulManager.insights.isEmpty {
                    Section("Your Insights") {
                        ForEach(soulManager.insights) { insight in
                            InsightRow(insight: insight)
                        }
                    }
                }

                if soulManager.isPhaseTwo {
                    Section("Active Offers") {
                        ForEach(soulManager.offers.filter { $0.status == .pending }) { offer in
                            OfferRow(offer: offer)
                        }
                    }
                }
            }
            .navigationTitle("PersonalOS")
            .refreshable {
                try? await soulManager.recomputeInsights()
            }
            .overlay {
                if soulManager.insights.isEmpty && !soulManager.isSyncing {
                    ContentUnavailableView(
                        "No Insights Yet",
                        systemImage: "chart.bar.xaxis.ascending",
                        description: Text("Connect a data source to generate your first Insight scores.")
                    )
                }
            }
        }
    }
}

struct DepthScoreCard: View {
    let score: Double
    let isPhaseTwo: Bool

    var body: some View {
        VStack(spacing: 12) {
            Text("Depth Score")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Text(String(format: "%.0f%%", score))
                .font(.system(size: 48, weight: .bold, design: .rounded))

            if !isPhaseTwo {
                Text("Reach 60% to unlock the marketplace")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                ProgressView(value: min(score, 60), total: 60.0)
                    .tint(.blue)
            } else {
                Label("Marketplace Active", systemImage: "checkmark.seal.fill")
                    .font(.caption)
                    .foregroundStyle(.green)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
    }
}

struct InsightRow: View {
    let insight: Insight

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(displayName(for: insight.category))
                    .font(.headline)
                HStack(spacing: 8) {
                    Text("Confidence: \(String(format: "%.0f%%", insight.confidence * 100))")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if !insight.marketplaceEligible {
                        Text("Private")
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 1)
                            .background(Color.red.opacity(0.15))
                            .clipShape(Capsule())
                    }
                    if insight.isStale {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption2)
                            .foregroundStyle(.orange)
                    }
                }
            }
            Spacer()
            VStack(alignment: .trailing) {
                Text(String(format: "%.0f", insight.score))
                    .font(.title2.bold())
                    .foregroundStyle(.tint)
                Text("/ 100")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private func displayName(for category: String) -> String {
        let names: [String: String] = [
            "finance.health": "Financial Health",
            "dining.grocery": "Grocery Patterns",
            "dining.restaurant": "Dining Out",
            "transport.commute": "Commute & Transport",
            "shopping.research": "Smart Shopping",
            "shopping.impulse": "Impulse Spending",
            "health.fitness": "Fitness & Wellness",
            "health.medical": "Health (Private)",
            "entertainment.streaming": "Entertainment",
            "travel.pattern": "Travel Patterns",
            "education.growth": "Learning & Growth",
            "subscription.management": "Subscriptions",
        ]
        return names[category] ?? category
    }
}

struct OfferRow: View {
    let offer: Offer

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(offer.brandName)
                    .font(.headline)
                Spacer()
                Text("$\(offer.yieldUSDC)")
                    .font(.subheadline.bold())
                    .foregroundStyle(.green)
            }
            Text(offer.headline)
                .font(.subheadline)
            Text(offer.body)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
        }
    }
}
