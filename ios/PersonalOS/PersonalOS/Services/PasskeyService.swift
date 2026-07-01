import AuthenticationServices
import Foundation

class PasskeyService {
    private let relyingParty = "personalos.app"

    func createPasskey(for soulID: UUID) async throws -> Data {
        // L0.2: ASAuthorizationPlatformPublicKeyCredentialProvider
        // Creates a passkey bound to the Soul's identity
        // Returns the credential ID stored in Soul.passkeyCredentialID
        fatalError("Not implemented — requires L0.2 sprint")
    }

    func authenticate(credentialID: Data) async throws -> Bool {
        // L0.2: ASAuthorizationPlatformPublicKeyCredentialAssertionRequest
        // Used for: pre-deletion assertion, wallet withdrawal re-auth, consent grant
        fatalError("Not implemented — requires L0.2 sprint")
    }
}
