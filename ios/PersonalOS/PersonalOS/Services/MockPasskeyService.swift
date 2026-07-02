import Foundation

class MockPasskeyService: PasskeyProviding {
    var shouldFail = false
    private(set) var lastCreatedCredentialID: Data?

    func createPasskey(for soulID: UUID) async throws -> Data {
        try await Task.sleep(nanoseconds: 500_000_000)

        if shouldFail {
            throw PasskeyError.creationFailed
        }

        let credentialID = soulID.uuidString.data(using: .utf8)!
        lastCreatedCredentialID = credentialID
        return credentialID
    }

    func authenticate(credentialID: Data) async throws -> Bool {
        try await Task.sleep(nanoseconds: 300_000_000)

        if shouldFail {
            throw PasskeyError.authenticationFailed
        }

        return true
    }

    enum PasskeyError: LocalizedError {
        case creationFailed
        case authenticationFailed

        var errorDescription: String? {
            switch self {
            case .creationFailed: return "Passkey creation failed (mock)"
            case .authenticationFailed: return "Authentication failed (mock)"
            }
        }
    }
}
