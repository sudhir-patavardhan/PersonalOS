import Foundation

struct Consent: Identifiable, Codable {
    let id: UUID
    let soulID: UUID
    let category: String
    let yieldFloorUSDC: Decimal
    let maxOffersPerDay: Int
    let grantedAt: Date
    var revokedAt: Date?

    var isActive: Bool { revokedAt == nil }
}
