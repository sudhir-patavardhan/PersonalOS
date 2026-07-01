import CryptoKit
import XCTest
@testable import PersonalOS

final class CryptoServiceTests: XCTestCase {
    func testEncryptDecryptRoundTrip() throws {
        let service = CryptoService()
        let key = SymmetricKey(size: .bits256)
        let plaintext = "Hello, PersonalOS".data(using: .utf8)!

        let ciphertext = try service.encrypt(plaintext, using: key)
        XCTAssertNotEqual(ciphertext, plaintext)

        let decrypted = try service.decrypt(ciphertext, using: key)
        XCTAssertEqual(decrypted, plaintext)
    }

    func testDecryptWithWrongKeyFails() throws {
        let service = CryptoService()
        let key1 = SymmetricKey(size: .bits256)
        let key2 = SymmetricKey(size: .bits256)
        let plaintext = "Secret data".data(using: .utf8)!

        let ciphertext = try service.encrypt(plaintext, using: key1)
        XCTAssertThrowsError(try service.decrypt(ciphertext, using: key2))
    }
}
