import Foundation

protocol PasskeyProviding {
    func createPasskey(for soulID: UUID) async throws -> Data
    func authenticate(credentialID: Data) async throws -> Bool
}
