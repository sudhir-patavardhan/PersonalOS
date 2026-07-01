# ADR-43: Wallet withdrawal — USDC transfer and fiat off-ramp via Coinbase

**Status:** Accepted · **Source:** gap identified during ADR pressure testing (June 2026)

**Context.** Yield accumulates as USDC in the Soul's non-custodial Coinbase Smart Wallet on Base chain (ADR-32). No ADR specifies how a Soul converts that USDC to fiat currency, transfers it to another wallet, or manages their balance. The README listed "Wallet withdrawal mechanics" as unresolved. PersonalOS is non-custodial — it cannot move funds on the Soul's behalf — so the withdrawal flow must be Soul-initiated and passkey-signed at every step.

**Decision.** Three withdrawal paths are supported, all Soul-initiated from the Wallet screen in the iOS app:

### Path 1 — Fiat off-ramp via Coinbase (primary)

For Souls who want USD/INR/EUR in their bank account:

1. **Initiate.** Soul taps "Cash Out" in the Wallet screen. The app displays the current USDC balance and an estimated fiat amount (using Coinbase's real-time USDC/fiat rate — USDC is pegged 1:1 to USD but conversion fees apply for non-USD currencies).
2. **Amount selection.** Soul enters the USDC amount to withdraw. Minimum withdrawal: $5.00 USDC (below this, Coinbase's fixed fees make the conversion uneconomical). Maximum: full balance.
3. **Coinbase off-ramp session.** The app opens a Coinbase-hosted off-ramp WebView (Coinbase Pay SDK). The Soul:
   - Signs in to or creates a Coinbase account (first time only — subsequent withdrawals use the cached session)
   - Links a bank account or debit card for fiat deposit (handled entirely by Coinbase — PersonalOS never sees bank credentials)
   - Confirms the conversion and withdrawal
4. **On-chain transfer.** The Soul's passkey signs an ERC-4337 UserOperation transferring the specified USDC amount from their Smart Wallet to Coinbase's deposit address on Base. Gas is sponsored by PersonalOS via paymaster (same as Claim settlement).
5. **Fiat deposit.** Coinbase converts USDC to fiat and deposits to the Soul's linked bank account. Timing: instant for debit card (Coinbase Instant), 1–3 business days for ACH bank transfer, 1–2 days for SEPA (EU), UPI for India (near-instant).

**Fee structure:**
- Coinbase conversion fee: ~1.5% for card, ~0% for ACH/SEPA (Coinbase sets this, not PersonalOS)
- Base chain gas: sponsored by PersonalOS (absorbed into platform operating costs)
- PersonalOS withdrawal fee: **none**. Charging a withdrawal fee contradicts the "your Yield is yours" narrative. The platform earns from the Claim fee split (ADR-35), not from withdrawals.

### Path 2 — USDC transfer to external wallet

For crypto-native Souls who want USDC in another wallet:

1. Soul taps "Transfer" and enters a destination address (Base chain) or scans a QR code.
2. The app validates the destination address format (Base/EVM address, checksum valid).
3. Soul confirms the amount and signs the UserOperation with their passkey.
4. USDC transfers on-chain directly. No Coinbase involvement. Gas sponsored by PersonalOS.

**Safeguards:**
- First-time transfer to a new address requires re-authentication (passkey assertion + 6-digit confirmation code displayed and typed back) to prevent accidental sends to wrong addresses.
- The app warns if the destination address has no prior on-chain activity ("This address has never received tokens. Double-check it's correct.").
- Transfer history is displayed in the Wallet screen with destination address, amount, timestamp, and Base chain `tx_hash` link.

### Path 3 — In-app balance (default, no action needed)

USDC accumulates in the Smart Wallet with no action required. The Soul can let their balance grow and withdraw at any time. There is no expiry, no minimum balance requirement, and no inactivity penalty. The balance is on-chain and accessible via the Coinbase Wallet app directly — independent of PersonalOS.

### Wallet UX

The Wallet screen shows:
- **Total balance:** USDC amount + estimated fiat equivalent (Soul's local currency, via Coinbase rate)
- **Yield history:** list of Claims with date, Brand name, Category, and USDC amount earned
- **Withdrawal history:** list of withdrawals with date, destination (Coinbase/external address), amount, status (pending/confirmed)
- **"Cash Out" button:** opens Path 1
- **"Transfer" button:** opens Path 2
- **Wallet address:** displayed with copy/QR, with note: "Your wallet address is yours forever, accessible via Coinbase Wallet"

### Auto-withdrawal (future consideration)

A "sweep" feature where the Soul sets a threshold (e.g., "cash out automatically when balance exceeds $50") is deferred. It requires a pre-authorized recurring UserOperation pattern that ERC-4337 supports but adds complexity to the passkey signing model. Revisit after launch if manual withdrawal friction becomes a retention issue.

**Consequences.** PersonalOS never touches Soul funds at any point in the withdrawal flow — the Smart Wallet transfers directly to Coinbase's deposit address or the external wallet. The non-custodial guarantee (ADR-32) is preserved end-to-end. Coinbase is a dependency for fiat off-ramp — if Coinbase's off-ramp service is unavailable, Souls can still use Path 2 to transfer USDC to any wallet and off-ramp through any exchange. The $5 minimum prevents micro-withdrawals that would be consumed by Coinbase fees. Gas sponsorship for withdrawals is a platform cost (~$0.01–0.05 per transaction on Base) that must be modelled in the Bill of Materials.
