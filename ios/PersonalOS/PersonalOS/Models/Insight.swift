import Foundation

struct Insight: Identifiable, Codable {
    let id: UUID
    let soulID: UUID
    let category: String
    let score: Double
    let confidence: Double
    let computedAt: Date
    let algorithmVersion: String
    let isStale: Bool
    let marketplaceEligible: Bool
}
