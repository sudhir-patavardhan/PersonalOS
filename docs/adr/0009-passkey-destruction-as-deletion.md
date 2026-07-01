# ADR-09: Data deletion = passkey destruction, not Arweave erasure

**Status:** Accepted · Supersedes: original ADR-09 (immediate raw-file deletion) · **Source:** ADR-29 (delta analysis, June 2026)

**Context.** The original ADR-09 promised immediate deletion of raw export files after parsing. Under the Arweave Ledger architecture (ADR-11), encrypted Transaktion shards are written to a permanent, immutable blockchain — they cannot be deleted by any party. The deletion promise must be reframed to reflect this reality.

**Decision.** "Deletion" in PersonalOS means passkey destruction — the irreversible loss of the AES-256-GCM decryption key that makes all Arweave Ledger data permanently inaccessible. When a Soul requests account deletion, a pre-deletion checklist runs before any irreversible action:

### Pre-deletion checklist
1. **Revoke all Consents.** All active Consents are revoked immediately (`revoked_at` set). The Exchange stops matching this Soul — no new Offers will be generated.
2. **Expire pending Offers.** All pending Offers (delivered but not Claimed) are expired and returned to the Brand's matchable pool. No Offer expires silently with the Soul unable to act on it.
3. **Wallet balance warning.** If the Soul's Smart Wallet (ADR-32) holds any USDC balance, the deletion flow blocks and presents: "You have $X.XX in your wallet. Once your passkey is destroyed, these funds are permanently inaccessible. Withdraw via Coinbase off-ramp or transfer to another wallet before continuing." The Soul must either withdraw/transfer to a zero balance, or explicitly acknowledge the loss with a typed confirmation ("I understand I will lose $X.XX").
4. **Historical summary cache wipe.** The on-device historical summary cache (ADR-23) is zeroed.
5. **Final confirmation.** The Soul confirms deletion with a passkey assertion (Face ID / Touch ID) — the last use of the passkey before destruction.

### Deletion execution
After the pre-deletion checklist completes:

1. PersonalOS Backend removes all server-side references to the Soul: `soul_accounts` row, `konnections`, `consents`, `insights`, `offers`, `claims` rows deleted from PostgreSQL.
2. The Soul is instructed to delete the passkey from iCloud Keychain on their device.
3. The `arweave_ledger_hash` pointer is removed from the database. No server-side entity can locate the Ledger shards.
4. The encrypted Transaktion shards remain on Arweave permanently but are computationally inaccessible — indistinguishable from random noise — without the passkey.
5. The Soul's Smart Wallet address remains on-chain (immutable) but PersonalOS removes the association. If the Soul retained their passkey before deletion (against instructions), they could still access the wallet via Coinbase Wallet app directly — PersonalOS does not control this.

This satisfies GDPR Recital 26 (data rendered permanently inaccessible is no longer personal data) and the spirit of the India DPDP Act 2023 right to erasure. Legal confirmation required for each jurisdiction prior to launch.

The original ADR-09 spirit — that plaintext raw data is never persistently stored — is preserved and strengthened: SoulMind zeros the in-memory plaintext buffer immediately after AES encryption, before any Arweave upload.

**Consequences.** Privacy policy and deletion-request confirmation copy must accurately describe key-destruction-as-deletion. "Your data is deleted" is replaced with "your encryption key is destroyed, making your stored data permanently inaccessible to anyone including PersonalOS." A passkey recovery mechanism must be designed (see ADR-31 open sub-questions) or the consequences of passkey loss made explicit in onboarding.
