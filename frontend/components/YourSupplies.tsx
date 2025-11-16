"use client";

import { Info, Eye, EyeOff, ArrowUpDown, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import WithdrawModal from "./WithdrawModal";
import SupplyModal from "./SupplyModal";
import SupplyRow from "./SupplyRow";
import { ConfigService } from "@/services/configService";
import { useUserSupplies } from "@/hooks/useUserData";
import { useUserBorrows } from "@/hooks/useUserData";

interface YourSuppliesProps {
  isHidden: boolean;
  onToggle: () => void;
}

export default function YourSupplies({ isHidden, onToggle }: YourSuppliesProps) {
  const { isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get all assets
  const allAssets = ConfigService.getAllAssets();

  // Get real totals from hooks
  const { totalBalance, totalAPY } = useUserSupplies();
  const { totalBalance: totalCollateral } = useUserBorrows();
  
  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Invalidate and refetch all queries
    await queryClient.invalidateQueries({ queryKey: [] });
    await queryClient.refetchQueries({ queryKey: [] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleWithdraw = (supply: any) => {
    setSelectedAsset({
      symbol: supply.symbol,
      name: supply.assetName,
      icon: supply.icon,
      balance: supply.balance,
      apy: supply.apy,
      healthFactor: "8.81", // TODO: Get from contract
    });
    setWithdrawModalOpen(true);
  };

  const handleSupply = (supply: any) => {
    setSelectedAsset({
      symbol: supply.symbol,
      name: supply.assetName,
      icon: supply.icon,
      balance: supply.balance,
      apy: supply.apy,
      healthFactor: "8.81", // TODO: Get from contract
    });
    setSupplyModalOpen(true);
  };

  if (isHidden) {
    return (
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white">Your supplies</p>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Show supplies"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <p className="text-sm font-medium text-white">Your supplies</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Refresh supplies"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Hide supplies"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-white/10">
        <div>
              <div className="flex items-center gap-1 mb-1">
            <p className="text-gray-400 text-[11px]">Balance</p>
            <button
              className="text-gray-400 hover:text-green-400 transition-colors duration-300 cursor-help"
              title="Total supply balance"
              aria-label="Balance info"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs font-medium text-white">{totalBalance}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <p className="text-gray-400 text-[11px]">APY</p>
            <button
              className="text-gray-400 hover:text-green-400 transition-colors duration-300 cursor-help"
              title="Annual Percentage Yield"
              aria-label="APY info"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs font-medium text-white">{totalAPY}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <p className="text-gray-400 text-[11px]">Collateral</p>
            <button
              className="text-gray-400 hover:text-green-400 transition-colors duration-300 cursor-help"
              title="Total collateral value"
              aria-label="Collateral info"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <p className="text-xs font-medium text-white">{totalCollateral}</p>
        </div>
      </div>

      {/* Table Header */}
      <div className="hidden lg:grid grid-cols-[2fr_1fr_80px_auto] gap-4 pb-2 mb-2 border-b border-white/5 items-center">
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-[11px] font-medium">Asset</span>
          <button className="text-gray-500 hover:text-gray-400 transition-colors" aria-label="Sort by asset">
            <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>
        <div className="flex flex-col items-end justify-center">
          <span className="text-gray-400 text-[11px] font-medium">Balance</span>
        </div>
        <div className="flex items-center justify-end">
          <span className="text-gray-400 text-[11px] font-medium">APY</span>
        </div>
        <div></div> {/* Empty column for action buttons */}
      </div>

      {/* Assets List */}
      <div className="space-y-2 sm:space-y-4">
        {allAssets.map((asset) => (
          <SupplyRow
            key={asset.symbol}
            asset={asset}
            isConnected={isConnected}
            onWithdraw={handleWithdraw}
            onSupply={handleSupply}
          />
        ))}
      </div>
      
      {/* Show message if no supplies - Note: This is a simplified check */}
      {/* In production, track which assets have supplies and show message accordingly */}

      {/* Modals */}
      {selectedAsset && (
        <>
          <WithdrawModal
            isOpen={withdrawModalOpen}
            onClose={() => {
              setWithdrawModalOpen(false);
              setSelectedAsset(null);
            }}
            asset={selectedAsset}
          />
          <SupplyModal
            isOpen={supplyModalOpen}
            onClose={() => {
              setSupplyModalOpen(false);
              setSelectedAsset(null);
            }}
            asset={selectedAsset}
          />
        </>
      )}
    </div>
  );
}
