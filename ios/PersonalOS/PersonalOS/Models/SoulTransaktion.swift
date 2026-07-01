import Foundation

struct SoulTransaktion: Identifiable, Codable {
    let id: UUID
    let source: Source
    let transactionType: TransactionType
    let harvestedAt: Date
    let occurredAt: Date
    let rawRef: String
    let amountUSD: Decimal?
    let currency: String?
    let merchantRaw: String?
    var merchantCanonical: String?
    let categoryRaw: String?
    var soulCategory: String
    var soulTags: [String]
    var intentSignals: [String]
    let healthFlag: Bool
    var marketplaceEligible: Bool
    var useLimitationTags: [String]
    var confidence: Double

    enum Source: String, Codable {
        case plaid
        case setuAA = "setu_aa"
        case googleActivity = "google_activity"
        case appleHealth = "apple_health"
        case uber
        case amazon
        case instagram
        case mychart
    }

    enum TransactionType: String, Codable {
        case purchase
        case transfer
        case payment
        case income
        case fee
        case refund
        case interest
        case activity
        case unknown
    }
}
