import Foundation

struct Offer: Identifiable, Codable {
    let id: UUID
    let soulID: UUID
    let listingID: UUID
    let brandName: String
    let category: String
    let yieldUSDC: Decimal
    let headline: String
    let body: String
    let ctaURL: URL
    let ctaLabel: String
    let imageURL: URL?
    let voucherText: String?
    let deliveredAt: Date
    let expiresAt: Date
    var status: Status

    enum Status: String, Codable {
        case pending
        case claimed
        case dismissed
        case expired
    }
}
