# ADR-34 — Blended settlement: USDC Yield (primary) + optional fiat Voucher (supplementary)
**Status:** Accepted · **Source:** ADR model (coupon/cashback) blended with site (USDC Yield)

**Decision.** The original ADR model described cashback and coupon rewards; the site uses pure USDC Yield. The blended model preserves both:

- **USDC Yield (primary, mandatory):** Every Claim settles USDC to the Soul's wallet via `BudgetEscrow.sol`. This is the blockchain-enforced, non-custodial, auditable payment that defines the product's value proposition. Minimum `yield_usdc` = Brand's `bid_per_claim_usdc` minus `platform_fee_usdc`.
- **Voucher (supplementary, Brand-optional):** A Brand may attach a Voucher to a Listing — a single-use discount code or promotional offer delivered after Claim. Vouchers are Brand-generated and Brand-controlled; PersonalOS mediates delivery via `voucher_delivery_webhook` but does not guarantee Voucher value. Voucher presence does not reduce the USDC Yield — it is additive.

The ADR model's concept of "matched offers / coupons" maps to the Voucher layer. The Yield layer is new from the site architecture. Together: a Soul Claims, receives USDC (guaranteed by smart contract) + optionally receives a Voucher (guaranteed by Brand).

**Consequences.** Brands who want to offer both a cash reward and a product discount can do so. The USDC Yield is the headline promise; the Voucher is a Brand marketing tool. Soul-facing UX shows: "Earn $4.50 USDC + $30 off your next Whole Foods order." Both are real; both are distinct settlement mechanisms.

---
