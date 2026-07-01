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

                Section("Your Insights") {
                    ForEach(soulManager.insights) { insight in
                        InsightRow(insight: insight)
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
            .overlay {
                if soulManager.insights.isEmpty {
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

                ProgressView(value: score, total: 60.0)
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
            VStack(alignment: .leading) {
                Text(insight.category)
                    .font(.headline)
                Text("Confidence: \(String(format: "%.0f%%", insight.confidence * 100))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Text(String(format: "%.0f", insight.score))
                .font(.title2.bold())
                .foregroundStyle(.tint)
        }
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
