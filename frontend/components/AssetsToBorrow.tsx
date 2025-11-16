"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAccount } from "wagmi";
import BorrowModal from "./BorrowModal";
import BorrowRow from "./BorrowRow";
import { ConfigService } from "@/services/configService";

interface AssetsToBorrowProps {
  isHidden: boolean;
  onToggle: () => void;
}

export default function AssetsToBorrow({ isHidden, onToggle }: AssetsToBorrowProps) {
  const { isConnected } = useAccount();
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const allAssets = ConfigService.getAllAssets();

  if (isHidden) {
    return (
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Assets to borrow</h2>
          <button onClick={onToggle} className="text-gray-400 hover:text-white">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-white">Assets to borrow</h2>
          <select className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white text-[10px] focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option>All Categories</option>
            <option>Stablecoins</option>
            <option>Cryptocurrencies</option>
          </select>
        </div>
        <button onClick={onToggle} className="text-gray-400 hover:text-white">
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Assets List */}
      <div className="space-y-4">
        {allAssets.map((asset) => (
          <BorrowRow
            key={asset.symbol}
            asset={asset}
            isConnected={isConnected}
            onBorrow={(borrowAsset) => {
              setSelectedAsset(borrowAsset);
              setBorrowModalOpen(true);
            }}
          />
        ))}
      </div>

      {/* Modal */}
      {selectedAsset && (
        <BorrowModal
          isOpen={borrowModalOpen}
          onClose={() => {
            setBorrowModalOpen(false);
            setSelectedAsset(null);
          }}
          asset={{
            symbol: selectedAsset.symbol,
            name: selectedAsset.name,
            icon: selectedAsset.icon,
            borrowAPY: selectedAsset.borrowAPY,
            healthFactor: "8.81", // TODO: Get from contract
          }}
        />
      )}
    </div>
  );
}
