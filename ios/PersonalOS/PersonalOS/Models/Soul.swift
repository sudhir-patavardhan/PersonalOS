import Foundation

struct Soul: Identifiable, Codable {
    let id: UUID
    let createdAt: Date
    var passkeyCredentialID: Data?
    var walletAddress: String?
    var walletProvisionedAt: Date?
    var depthScore: Double
    var phase: Phase

    enum Phase: String, Codable {
        case one
        case two
    }

    init() {
        self.id = UUID()
        self.createdAt = Date()
        self.passkeyCredentialID = nil
        self.walletAddress = nil
        self.walletProvisionedAt = nil
        self.depthScore = 0.0
        self.phase = .one
    }
}
