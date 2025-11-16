"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="container mx-auto px-4 py-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">Terms &</span>{" "}
            <span className="text-gradient-zen">Conditions</span>
          </h1>
          <p className="text-gray-400 text-sm">Last Updated: 1 November, 2025</p>
        </div>

        {/* Introduction */}
        <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
          <p className="text-gray-300 leading-relaxed">
            Welcome to <span className="text-gradient-zen font-semibold">ZenFinance</span>.
            By accessing or using this website and the decentralized lending protocol built on the ZenChain blockchain, 
            you ("the User") agree to the following Terms and Conditions. Please read them carefully. 
            If you do not agree, do not use the Platform.
          </p>
        </div>

        {/* Terms Sections - All in One Card */}
        <div className="bg-white/5 rounded-xl p-8 border border-white/10 hover:border-green-400/30 transition-all duration-300">
          <div className="space-y-8">
            {/* Section 1 */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">1. Acceptance of Terms</h2>
              <p className="text-gray-300 mb-4">
                By accessing, connecting a wallet, supplying assets, borrowing assets, or interacting with any smart contract related to ZenFinance, you acknowledge that you:
              </p>
              <ul className="space-y-2 text-gray-300 list-none ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Have read, understood, and agree to be bound by these Terms & Conditions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Are at least 18 years old or of legal age in your jurisdiction.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Have the full authority to use the Platform and digital assets involved.</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Section 2 */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">2. Nature of the Platform</h2>
              <p className="text-gray-300 mb-4">
                ZenFinance is a decentralized, non-custodial lending protocol operating on the ZenChain blockchain.
                The Platform:
              </p>
              <ul className="space-y-2 text-gray-300 list-none ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Does not hold users' private keys.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Does not store or custody funds.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Allows users to interact directly with smart contracts at their own risk.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>All transactions are on-chain, irreversible, and publicly visible.</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Section 3 */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">3. No Financial Advice</h2>
              <p className="text-gray-300 mb-4">
                ZenFinance does not provide investment, legal, financial, or tax advice.
                By using the Platform, you agree that:
              </p>
              <ul className="space-y-2 text-gray-300 list-none ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>All actions are your own responsibility.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>You understand the risks of cryptocurrency and DeFi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>You will consult a professional advisor if needed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>All decisions (deposit, borrow, withdraw, repay, etc.) are solely your own.</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Section 4 */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">4. User Responsibilities</h2>
              <p className="text-gray-300 mb-4">You agree that you will:</p>
              <ul className="space-y-2 text-gray-300 list-none ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Use the Platform for lawful purposes only.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Not participate in money laundering, sanctions violations, or illegal activities.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Be responsible for all transactions made through your wallet.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span>Maintain control of your private keys and never share them.</span>
                </li>
              </ul>
              <p className="text-red-400 mt-4 font-semibold">
                ZenFinance is not liable for loss caused by compromised wallets.
              </p>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Section 5 */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">5. Smart Contract Risks</h2>
              <p className="text-gray-300 mb-4">
                You acknowledge that decentralized protocols involve risk, including but not limited to:
              </p>
              <ul className="space-y-2 text-gray-300 list-none ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">⚠</span>
                  <span>Smart contract vulnerabilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">⚠</span>
                  <span>Oracle failures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">⚠</span>
                  <span>Extreme market volatility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">⚠</span>
                  <span>Liquidations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">⚠</span>
                  <span>Loss of supplied assets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">⚠</span>
                  <span>Network congestion or downtime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">⚠</span>
                  <span>Governance changes</span>
                </li>
              </ul>
              <p className="text-red-400 mt-4 font-semibold">
                You use the protocol entirely at your own risk.
              </p>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Section 6 */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">6. Liquidation Disclaimer</h2>
              <p className="text-gray-300 mb-4">
                Borrowers are responsible for maintaining sufficient collateral.
                If your Health Factor drops below the required threshold:
              </p>
              <ul className="space-y-2 text-gray-300 list-none ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Your collateral may be partially or fully liquidated.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Liquidation penalties may apply.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>Liquidation is automatic and cannot be reversed.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span>You accept full responsibility for monitoring your positions.</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Section 7 */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">7. No Guarantees or Warranties</h2>
              <p className="text-gray-300 mb-4">
                ZenFinance is provided "as is" and "as available."
                We do NOT guarantee:
              </p>
              <ul className="space-y-2 text-gray-300 list-none ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">×</span>
                  <span>No bugs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">×</span>
                  <span>No exploits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">×</span>
                  <span>Stable token prices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">×</span>
                  <span>Safe liquidation buffers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500 mt-1">×</span>
                  <span>Continuous, uninterrupted service</span>
                </li>
              </ul>
              <p className="text-gray-400 mt-4">
                The Platform may change, upgrade, or discontinue without notice.
              </p>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Section 8 */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">8. Geographic Restrictions</h2>
              <p className="text-gray-300 mb-4">
                Users from jurisdictions where cryptocurrency or decentralized finance is restricted, banned, or illegal must not use the Platform.
                This includes regions under international sanctions.
              </p>
              <p className="text-yellow-400 font-semibold">
                By using the Platform, you confirm you are not located in a restricted region.
              </p>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Section 9 */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">9. Third-Party Integrations</h2>
              <p className="text-gray-300 mb-4">
                The Platform may rely on third-party services such as:
              </p>
              <ul className="space-y-2 text-gray-300 list-none ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">→</span>
                  <span>Wallet providers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">→</span>
                  <span>Price oracles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">→</span>
                  <span>Blockchain nodes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">→</span>
                  <span>Token bridges</span>
                </li>
              </ul>
              <p className="text-gray-400 mt-4">
                ZenFinance is not responsible for errors, downtime, or losses caused by these third parties.
              </p>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Section 10 */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">10. Limitation of Liability</h2>
              <p className="text-gray-300 mb-4">
                Under no circumstances shall ZenFinance, its developers, contributors, or affiliates be liable for:
              </p>
              <ul className="space-y-2 text-gray-300 list-none ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">!</span>
                  <span>Lost funds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">!</span>
                  <span>Lost profits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">!</span>
                  <span>Smart contract failures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">!</span>
                  <span>Market losses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">!</span>
                  <span>Unauthorized access to your wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">!</span>
                  <span>Liquidations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">!</span>
                  <span>Severe volatility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">!</span>
                  <span>Interruption of service</span>
                </li>
              </ul>
              <p className="text-red-400 mt-4 font-semibold">
                You agree to use the Platform at your own risk.
              </p>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Section 11 */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">11. Modification of Terms</h2>
              <p className="text-gray-300">
                We may update or change these Terms & Conditions at any time.
                Continued use of the Platform means you accept the updated terms.
              </p>
            </div>

            <div className="border-t border-white/10"></div>

            {/* Section 12 - Contact */}
            <div className="bg-gradient-to-r from-yellow-400/10 via-green-400/10 to-cyan-400/10 rounded-lg p-6 border border-green-400/20">
              <h2 className="text-2xl font-bold mb-4 text-gradient-zen">12. Contact Information</h2>
              <p className="text-gray-300">
                For inquiries, support, or reporting issues, visit:{" "}
                <span className="text-gradient-zen font-semibold">ZenFinance official community chats</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Notice */}
        <div className="mt-12 p-6 bg-white/5 rounded-xl border border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            By using ZenFinance, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.
          </p>
          <Link 
            href="/markets" 
            className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 text-[#0a0e27] font-semibold rounded-lg hover:opacity-90 transition-opacity duration-300"
          >
            I Accept - Go to Markets
          </Link>
        </div>
      </div>
    </div>
  );
}
