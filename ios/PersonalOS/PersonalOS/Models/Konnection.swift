import Foundation

struct Konnection: Identifiable, Codable {
    let id: UUID
    let soulID: UUID
    let provider: Provider
    let status: Status
    let connectedAt: Date
    var lastHarvestedAt: Date?
    var transaktionCount: Int

    enum Provider: String, Codable, CaseIterable {
        case plaid
        case setuAA = "setu_aa"
        case googleDPA = "google_dpa"
        case appleHealth = "apple_health"
        case amazonBYOD = "amazon_byod"
        case uberBYOD = "uber_byod"
        case instagramBYOD = "instagram_byod"

        var displayName: String {
            switch self {
            case .plaid: return "Bank Account"
            case .setuAA: return "Bank Account (India)"
            case .googleDPA: return "Google Activity"
            case .appleHealth: return "Apple Health"
            case .amazonBYOD: return "Amazon"
            case .uberBYOD: return "Uber"
            case .instagramBYOD: return "Instagram"
            }
        }

        var tier: OnboardingTier {
            switch self {
            case .plaid, .setuAA: return .one
            case .googleDPA, .appleHealth: return .two
            case .amazonBYOD, .uberBYOD, .instagramBYOD: return .three
            }
        }

        var depthWeight: Double {
            switch self {
            case .plaid, .setuAA: return 0.30
            case .appleHealth: return 0.20
            case .googleDPA: return 0.15
            case .amazonBYOD: return 0.15
            case .uberBYOD: return 0.10
            case .instagramBYOD: return 0.10
            }
        }
    }

    enum Status: String, Codable {
        case active
        case stale
        case revoked
    }

    enum OnboardingTier: Int, Codable, Comparable {
        case one = 1
        case two = 2
        case three = 3

        static func < (lhs: OnboardingTier, rhs: OnboardingTier) -> Bool {
            lhs.rawValue < rhs.rawValue
        }
    }
}
