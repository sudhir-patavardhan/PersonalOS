import SwiftUI

struct WalletView: View {
    @EnvironmentObject var soulManager: SoulManager
    @State private var balance: Decimal = 0.00

    var body: some View {
        NavigationStack {
            List {
                Section {
                    VStack(spacing: 8) {
                        Text("USDC Balance")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("$\(balance)")
                            .font(.system(size: 40, weight: .bold, design: .rounded))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical)
                }
                .listRowBackground(Color.clear)

                Section("Withdraw") {
                    Button {
                        // ADR-43: fiat off-ramp via Coinbase Pay SDK
                    } label: {
                        Label("Cash Out to Bank", systemImage: "banknote.fill")
                    }

                    Button {
                        // ADR-43: USDC transfer to external wallet
                    } label: {
                        Label("Send USDC", systemImage: "arrow.up.circle.fill")
                    }
                }

                Section("History") {
                    if soulManager.offers.filter({ $0.status == .claimed }).isEmpty {
                        Text("No earnings yet")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(soulManager.offers.filter { $0.status == .claimed }) { offer in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(offer.brandName)
                                        .font(.subheadline)
                                    Text(offer.deliveredAt, style: .date)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                                Spacer()
                                Text("+$\(offer.yieldUSDC)")
                                    .foregroundStyle(.green)
                                    .font(.subheadline.bold())
                            }
                        }
                    }
                }

                if let wallet = soulManager.currentSoul?.walletAddress {
                    Section("Wallet") {
                        LabeledContent("Address", value: wallet.prefix(6) + "…" + wallet.suffix(4))
                        LabeledContent("Network", value: "Base (L2)")
                        LabeledContent("Token", value: "USDC")
                    }
                }
            }
            .navigationTitle("Wallet")
        }
    }
}
