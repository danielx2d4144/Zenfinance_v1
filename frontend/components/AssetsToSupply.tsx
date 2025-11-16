"use client";

import { useState } from "react";
import { Info, Eye, EyeOff, ExternalLink, ArrowUpDown } from "lucide-react";
import { useAccount } from "wagmi";
import SupplyModal from "./SupplyModal";
import AssetSupplyRow from "./AssetSupplyRow";
import { ConfigService } from "@/services/configService";

interface AssetsToSupplyProps {
  isHidden: boolean;
  onToggle: () => void;
}

export default function AssetsToSupply({ isHidden, onToggle }: AssetsToSupplyProps) {
  const { isConnected } = useAccount();
  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showZeroBalance, setShowZeroBalance] = useState(false);

  // Get all assets from config
  const allAssets = ConfigService.getAllAssets();

  const handleSupply = (asset: any) => {
    setSelectedAsset(asset);
    setSupplyModalOpen(true);
  };

  if (isHidden) {
    return (
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Assets to supply</h2>
          <button onClick={onToggle} className="text-gray-400 hover:text-white">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="text-xs sm:text-sm font-medium text-white">Assets to supply</h2>
          <select className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white text-[10px] focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/30 transition-all duration-300">
            <option>All Categories</option>
            <option>Stablecoins</option>
            <option>Cryptocurrencies</option>
          </select>
        </div>
        <button onClick={onToggle} className="text-gray-400 hover:text-white self-end sm:self-auto">
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
        <label className="flex items-center gap-2 text-gray-400 text-[10px] cursor-pointer">
          <input 
            type="checkbox" 
            className="rounded" 
            checked={showZeroBalance}
            onChange={(e) => setShowZeroBalance(e.target.checked)}
          />
          Show assets with 0 balance
        </label>
        <a href="https://faucet.zenchain.io/" target="_blank" rel="noopener noreferrer" className="text-purple-400 text-[10px] hover:text-purple-300 flex items-center gap-1">
          ZENCHAIN TESTNET FAUCET
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Table Header - Desktop Only */}
      <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1.2fr_1.3fr_auto] gap-4 pb-2 mb-2 border-b border-white/5 items-center">
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-[11px] font-medium">Assets</span>
          <button className="text-gray-500 hover:text-gray-400 transition-colors" aria-label="Sort by asset">
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center justify-center gap-1">
          <button className="text-gray-500 hover:text-gray-400 transition-colors flex-shrink-0" aria-label="Sort by wallet balance">
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <span className="text-gray-400 text-[11px] font-medium">Wallet balance</span>
          <button className="text-gray-500 hover:text-gray-400 transition-colors flex-shrink-0" aria-label="Sort by wallet balance">
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center justify-center gap-1">
          <button className="text-gray-500 hover:text-gray-400 transition-colors flex-shrink-0" aria-label="Sort by APY">
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <span className="text-gray-400 text-[11px] font-medium whitespace-nowrap">APY</span>
          <button className="text-gray-500 hover:text-gray-400 transition-colors flex-shrink-0" aria-label="Sort by APY">
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center justify-center gap-1">
          <button className="text-gray-500 hover:text-gray-400 transition-colors flex-shrink-0" aria-label="Sort by collateral">
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <span className="text-gray-400 text-[11px] font-medium">Can be collateral</span>
          <button className="text-gray-500 hover:text-gray-400 transition-colors flex-shrink-0" aria-label="Sort by collateral">
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
        <div></div> {/* Empty column for action buttons */}
      </div>

      {/* Assets List */}
      <div className="space-y-2 sm:space-y-4">
        {allAssets.map((asset) => (
          <AssetSupplyRow
            key={asset.symbol}
            asset={asset}
            isConnected={isConnected}
            showZeroBalance={showZeroBalance}
            onSupply={handleSupply}
          />
        ))}
      </div>

      {/* Supply Modal */}
      {selectedAsset && (
        <SupplyModal
          isOpen={supplyModalOpen}
          onClose={() => {
            setSupplyModalOpen(false);
            setSelectedAsset(null);
          }}
          asset={selectedAsset}
        />
      )}
    </div>
  );
}
