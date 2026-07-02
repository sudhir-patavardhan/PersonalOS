import Foundation

protocol PlaidProviding {
    func startLink() async throws -> PlaidLinkResult
    func fetchTransactions(for konnectionID: UUID) async throws -> [SoulTransaktion]
}

struct PlaidLinkResult {
    let institutionName: String
    let institutionID: String
    let accountMask: String
}

struct PlaidSecurityPolicy {
    static let publicTokenTTL: TimeInterval = 30 * 60
    static let publicTokenMustNotPersist = true
    static let publicTokenMustNotLog = true
    static let accessTokenNeverOnDevice = true
    static let backendRequiresPasskeyAuth = true
    static let requiresCertificatePinning = true
    static let minimumTLSVersion = "1.3"

    static func validateBackendURL(_ url: URL?) -> Bool {
        guard let url = url else {
            #if DEBUG
            return true
            #else
            return false
            #endif
        }
        return url.scheme == "https"
    }
}
