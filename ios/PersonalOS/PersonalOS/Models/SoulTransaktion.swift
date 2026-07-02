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

    init(id: UUID = UUID(), source: Source, transactionType: TransactionType,
         harvestedAt: Date = Date(), occurredAt: Date, rawRef: String,
         amountUSD: Decimal? = nil, currency: String? = nil,
         merchantRaw: String? = nil, merchantCanonical: String? = nil,
         categoryRaw: String? = nil, soulCategory: String,
         soulTags: [String] = [], intentSignals: [String] = [],
         healthFlag: Bool = false, marketplaceEligible: Bool = true,
         useLimitationTags: [String] = [], confidence: Double = 1.0) {
        self.id = id
        self.source = source
        self.transactionType = transactionType
        self.harvestedAt = harvestedAt
        self.occurredAt = occurredAt
        self.rawRef = rawRef
        self.amountUSD = amountUSD
        self.currency = currency
        self.merchantRaw = merchantRaw
        self.merchantCanonical = merchantCanonical
        self.categoryRaw = categoryRaw
        self.soulCategory = soulCategory
        self.soulTags = soulTags
        self.intentSignals = intentSignals
        self.healthFlag = healthFlag
        self.marketplaceEligible = marketplaceEligible
        self.useLimitationTags = useLimitationTags
        self.confidence = confidence
    }

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
