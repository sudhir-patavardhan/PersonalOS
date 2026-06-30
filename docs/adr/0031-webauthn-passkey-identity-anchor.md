# ADR-31: WebAuthn passkey as Soul identity anchor and AES key derivation source

**Status:** Accepted · **Source:** site Flow 1 (Soul Onboarding) + absent from ADR log

**Decision.** The Soul's WebAuthn passkey, created at first onboarding and stored in iCloud Keychain Secure Enclave, serves dual purpose:
1. **Authentication:** passkey assertion proves Soul identity for all API calls and on-chain Claim signing (ERC-4337 UserOperation).
2. **Encryption key derivation:** AES-256-GCM key for all on-device Transaktion encryption is derived from the passkey via PBKDF2 (310,000 iterations, SHA-256, device-specific salt). The decryption key never leaves the Secure Enclave context.

Passkey is stored in iCloud Keychain, providing automatic cross-device sync across the Soul's Apple ecosystem without PersonalOS involvement.

**Open sub-questions.** Passkey recovery path if iCloud Keychain is lost: options include Social Recovery (trusted contacts hold key shards), a hardware security key backup, or accepting that Ledger data is permanently inaccessible if the passkey is lost (with this risk disclosed in onboarding). This must be decided before launch.

**Consequences.** The Soul onboarding sequence is: passkey creation → Smart Wallet provisioning (ADR-32) → first Konnection (ADR-02). Passkey creation must complete before any Harvest can occur. The design of the passkey creation UX — including explaining why a passkey is being created and what it protects — is a critical onboarding moment.
