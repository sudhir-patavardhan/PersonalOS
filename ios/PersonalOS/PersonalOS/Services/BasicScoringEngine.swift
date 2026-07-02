import Foundation

class BasicScoringEngine {
    static let algorithmVersion = "basic-v1.0"

    static let allCategories = [
        "finance.health", "dining.grocery", "dining.restaurant",
        "transport.commute", "shopping.research", "shopping.impulse",
        "health.fitness", "health.medical",
        "entertainment.streaming", "travel.pattern",
        "education.growth", "subscription.management",
    ]

    static let marketplaceIneligible: Set<String> = ["health.medical"]

    struct ScoreDrivers {
        var crossSourceCorrelation: Double = 0
        var behavioralPattern: Double = 0
        var spendAllocation: Double = 0

        var weighted: Double {
            crossSourceCorrelation * 0.40 + behavioralPattern * 0.35 + spendAllocation * 0.25
        }
    }

    func computeInsights(transaktions: [SoulTransaktion], soulID: UUID) -> [Insight] {
        guard !transaktions.isEmpty else { return [] }

        let mapped = Dictionary(grouping: transaktions) { mapToScoringCategory($0.soulCategory) }
        let totalSpend = transaktions.compactMap { $0.amountUSD }.filter { $0 > 0 }.reduce(Decimal.zero, +)
        let sources = Set(transaktions.map(\.source))

        return Self.allCategories.compactMap { category -> Insight? in
            guard let txns = mapped[category], !txns.isEmpty else { return nil }

            let drivers = computeDrivers(
                categoryTxns: txns,
                allTxns: transaktions,
                totalSpend: totalSpend,
                sourceCount: sources.count
            )

            let score = min(max(drivers.weighted, 0), 100)
            let confidence = computeConfidence(txnCount: txns.count, daySpan: daySpan(txns))

            return Insight(
                id: UUID(),
                soulID: soulID,
                category: category,
                score: score,
                confidence: confidence,
                computedAt: Date(),
                algorithmVersion: Self.algorithmVersion,
                isStale: false,
                marketplaceEligible: !Self.marketplaceIneligible.contains(category)
            )
        }.sorted { $0.score > $1.score }
    }

    func computeDepthScore(insights: [Insight]) -> Double {
        guard !insights.isEmpty else { return 0 }
        let eligible = insights.filter(\.marketplaceEligible)
        guard !eligible.isEmpty else { return 0 }
        let avgScore = eligible.map(\.score).reduce(0, +) / Double(eligible.count)
        let breadthBonus = min(Double(eligible.count) / Double(Self.allCategories.count) * 20, 20)
        return min(avgScore + breadthBonus, 100)
    }

    // MARK: - Private

    private func computeDrivers(categoryTxns: [SoulTransaktion], allTxns: [SoulTransaktion],
                                  totalSpend: Decimal, sourceCount: Int) -> ScoreDrivers {
        var drivers = ScoreDrivers()

        let categorySources = Set(categoryTxns.map(\.source))
        let baseCorrelation: Double = 25
        if categorySources.count > 1 {
            let multiSourceBonus = Double(categorySources.count - 1) * 25
            drivers.crossSourceCorrelation = min(baseCorrelation + multiSourceBonus, 100)
        } else {
            drivers.crossSourceCorrelation = baseCorrelation
        }

        drivers.behavioralPattern = computeBehavioralPattern(categoryTxns)

        if totalSpend > 0 {
            let categorySpend = categoryTxns.compactMap { $0.amountUSD }.filter { $0 > 0 }.reduce(Decimal.zero, +)
            let ratio = NSDecimalNumber(decimal: categorySpend).doubleValue / NSDecimalNumber(decimal: totalSpend).doubleValue
            drivers.spendAllocation = min(ratio * 100 * 3, 100)
        }

        return drivers
    }

    private func computeBehavioralPattern(_ txns: [SoulTransaktion]) -> Double {
        var score: Double = 0
        let count = txns.count

        if count >= 20 { score += 30 }
        else if count >= 10 { score += 20 }
        else if count >= 5 { score += 10 }

        let merchantCounts = Dictionary(grouping: txns, by: { $0.merchantCanonical ?? $0.merchantRaw ?? "unknown" })
            .mapValues(\.count)
        let repeatMerchants = merchantCounts.values.filter { $0 >= 3 }.count
        score += min(Double(repeatMerchants) * 10, 30)

        let calendar = Calendar.current
        let hourCounts = Dictionary(grouping: txns, by: { calendar.component(.hour, from: $0.occurredAt) })
            .mapValues(\.count)
        if let peakHour = hourCounts.max(by: { $0.value < $1.value }),
           Double(peakHour.value) / Double(count) > 0.3 {
            score += 15
        }

        let hasTags = txns.filter { !$0.soulTags.isEmpty }.count
        if Double(hasTags) / Double(count) > 0.5 {
            score += 10
        }

        let hasIntentSignals = txns.filter { !$0.intentSignals.isEmpty }.count
        if hasIntentSignals > 0 {
            score += min(Double(hasIntentSignals) * 5, 15)
        }

        return min(score, 100)
    }

    private func computeConfidence(txnCount: Int, daySpan: Int) -> Double {
        let volumeConfidence: Double
        if txnCount >= 30 { volumeConfidence = 1.0 }
        else if txnCount >= 10 { volumeConfidence = 0.7 }
        else if txnCount >= 5 { volumeConfidence = 0.5 }
        else { volumeConfidence = 0.3 }

        let spanConfidence: Double
        if daySpan >= 60 { spanConfidence = 1.0 }
        else if daySpan >= 30 { spanConfidence = 0.7 }
        else if daySpan >= 14 { spanConfidence = 0.5 }
        else { spanConfidence = 0.3 }

        return (volumeConfidence + spanConfidence) / 2.0
    }

    static let subcategoryMap: [String: String] = [
        "dining.coffee": "dining.restaurant",
        "dining.delivery": "dining.restaurant",
        "transport.rideshare": "transport.commute",
        "transport.transit": "transport.commute",
        "transport.fuel": "transport.commute",
        "shopping.online": "shopping.research",
        "shopping.clothing": "shopping.impulse",
        "shopping.home": "shopping.research",
        "shopping.business": "shopping.research",
        "shopping.tools": "shopping.research",
        "entertainment.recreation": "entertainment.streaming",
        "health.personal_care": "health.medical",
        "travel.flights": "travel.pattern",
        "travel.lodging": "travel.pattern",
        "workspace.coworking": "transport.commute",
        "education.kids": "education.growth",
        "finance.insurance": "finance.health",
        "finance.investment": "finance.health",
        "finance.loan": "finance.health",
        "finance.property_tax": "finance.health",
        "finance.income": "finance.health",
        "finance.alimony": "finance.health",
        "finance.remittance": "finance.health",
        "housing.rent": "finance.health",
        "housing.mortgage": "finance.health",
        "bills.utilities": "subscription.management",
    ]

    private func mapToScoringCategory(_ soulCategory: String) -> String {
        if Self.allCategories.contains(soulCategory) {
            return soulCategory
        }
        if let mapped = Self.subcategoryMap[soulCategory] {
            return mapped
        }
        let root = String(soulCategory.split(separator: ".").first ?? Substring(soulCategory))
        return Self.allCategories.first { $0.hasPrefix(root + ".") } ?? soulCategory
    }

    private func daySpan(_ txns: [SoulTransaktion]) -> Int {
        guard let earliest = txns.map(\.occurredAt).min(),
              let latest = txns.map(\.occurredAt).max() else { return 0 }
        return Calendar.current.dateComponents([.day], from: earliest, to: latest).day ?? 0
    }
}
