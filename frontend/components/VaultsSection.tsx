"use client";

export default function VaultsSection() {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6">Validator-Backed Vaults</h2>
      <p className="text-gray-400 mb-6">
        Create overcollateralized vaults by staking ZTC and providing BTC liquidity to mint zBTC.
      </p>
      
      <div className="space-y-4">
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
          <p className="text-gray-400 text-sm">
            Validator-backed vault functionality will be implemented in the next phase.
          </p>
        </div>
      </div>
    </div>
  );
}
