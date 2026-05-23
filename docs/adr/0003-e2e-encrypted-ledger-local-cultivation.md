# ADR-0003: E2E Encrypted Ledger with Local Cultivation

## Status
Accepted

## Context
The Ledger holds a Soul's raw Transaktions. The question was who can read them and where Cultivation (Insight computation) runs.

## Decision
Transaktions are end-to-end encrypted with the Soul's passkey before leaving the device. PersonalOS never holds the decryption key. Cultivation runs entirely on the Soul's iOS device against locally decrypted data. Only the resulting Insight scores are sent to PersonalOS servers.

## Alternatives Considered
- **Platform-readable Ledger, server-side Cultivation** — simplest to build, but contradicts the platform's core promise. If PersonalOS can read all Transaktions, it is functionally indistinguishable from the data brokers it claims to replace.
- **Encrypted at rest, platform-decryptable** — protects against external breaches but not against platform misuse or legal compulsion. Does not support the sovereignty narrative.

## Consequences
- PersonalOS cannot compute Insights centrally — Cultivation logic must ship in the iOS app.
- Insight computation quality is bounded by what can run efficiently on a mobile device.
- Server-side ML models for Insight generation are not possible without a privacy-preserving compute layer (e.g. federated learning) — a future consideration.
- This is a genuine, auditable privacy guarantee: PersonalOS legally and technically cannot access raw Transaktions.
