import Foundation

class WalletService {
    func provisionWallet(for soulID: UUID) async throws -> String {
        // L0.4: Coinbase Smart Wallet (ERC-4337) on Base chain (ADR-33)
        // Returns wallet address (0x...)
        // Provisioned in background during onboarding (ADR-41)
        fatalError("Not implemented — requires L0.4 sprint")
    }

    func getBalance() async throws -> Decimal {
        // L0.4: Query USDC balance on Base
        fatalError("Not implemented — requires L0.4 sprint")
    }

    func withdraw(amount: Decimal, path: WithdrawalPath) async throws {
        // ADR-43: 3 withdrawal paths
        fatalError("Not implemented — requires L0.4 sprint")
    }

    enum WithdrawalPath {
        case fiatOfframp
        case usdcTransfer(toAddress: String)
        case accumulate
    }
}
