import AuthenticationServices
import Foundation

class LivePasskeyService: PasskeyProviding {
    private let relyingPartyIdentifier = "personalos.app"

    func createPasskey(for soulID: UUID) async throws -> Data {
        let challenge = Data(soulID.uuidString.utf8)
        let userID = Data(soulID.uuidString.utf8)

        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: relyingPartyIdentifier)
        let request = provider.createCredentialRegistrationRequest(
            challenge: challenge,
            name: "PersonalOS Soul",
            userID: userID
        )

        let credential = try await performRequest(request)

        guard let registration = credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration else {
            throw LivePasskeyError.unexpectedCredentialType
        }

        return registration.credentialID
    }

    func authenticate(credentialID: Data) async throws -> Bool {
        let challenge = Data(UUID().uuidString.utf8)

        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: relyingPartyIdentifier)
        let request = provider.createCredentialAssertionRequest(challenge: challenge)
        request.allowedCredentials = [ASAuthorizationPlatformPublicKeyCredentialDescriptor(credentialID: credentialID)]

        let credential = try await performRequest(request)

        guard credential is ASAuthorizationPlatformPublicKeyCredentialAssertion else {
            throw LivePasskeyError.unexpectedCredentialType
        }

        return true
    }

    private func performRequest(_ request: ASAuthorizationRequest) async throws -> ASAuthorizationCredential {
        try await withCheckedThrowingContinuation { continuation in
            let controller = ASAuthorizationController(authorizationRequests: [request])
            let delegate = PasskeyDelegate(continuation: continuation)
            controller.delegate = delegate
            controller.presentationContextProvider = delegate
            objc_setAssociatedObject(controller, &PasskeyDelegate.associatedKey, delegate, .OBJC_ASSOCIATION_RETAIN)
            controller.performRequests()
        }
    }

    enum LivePasskeyError: LocalizedError {
        case unexpectedCredentialType
        case authorizationFailed(Error)

        var errorDescription: String? {
            switch self {
            case .unexpectedCredentialType: return "Unexpected credential type returned"
            case .authorizationFailed(let error): return "Passkey authorization failed: \(error.localizedDescription)"
            }
        }
    }
}

private final class PasskeyDelegate: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding, @unchecked Sendable {
    nonisolated(unsafe) static var associatedKey = 0
    let continuation: CheckedContinuation<ASAuthorizationCredential, Error>

    init(continuation: CheckedContinuation<ASAuthorizationCredential, Error>) {
        self.continuation = continuation
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        continuation.resume(returning: authorization.credential)
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        continuation.resume(throwing: LivePasskeyService.LivePasskeyError.authorizationFailed(error))
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        ASPresentationAnchor()
    }
}
