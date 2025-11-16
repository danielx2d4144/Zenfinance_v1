"use client";

import { useState, useMemo } from "react";
import { Info, Eye, EyeOff, ArrowUpDown } from "lucide-react";
import { useAccount } from "wagmi";
import BorrowModal from "./BorrowModal";
import RepayModal from "./RepayModal";
import BorrowBorrowRow from "./BorrowBorrowRow";
import { ConfigService } from "@/services/configService";
import { useUserBorrows } from "@/hooks/useUserData";
import { useUserSupplies } from "@/hooks/useUserData";
import { formatUSD, formatPercentage } from "@/utils/format";
import { calculateBorrowPowerUsed } from "@/utils/calculations";
import { formatUnits } from "viem";

interface YourBorrowsProps {
  isHidden: boolean;
  onToggle: () => void;
}

export default function YourBorrows({ isHidden, onToggle }: YourBorrowsProps) {
  const { isConnected } = useAccount();
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const { borrows, totalBalance, totalAPY } = useUserBorrows();
  const { totalBalance: totalSuppliedBalance } = useUserSupplies();

  // Calculate borrow power used
  const borrowPowerUsed = useMemo(() => {
    if (!isConnected || borrows.length === 0) return "0.00%";
    
    const totalBorrowedValue = borrows.reduce((sum, borrow) => {
      return sum + (Number(formatUnits(borrow.balanceRaw, borrow.decimals)) * borrow.price);
    }, 0);

    // Get total supplied value
    const totalSuppliedValueStr = totalSuppliedBalance.replace("$", "").replace(/,/g, "");
    const totalSuppliedValue = parseFloat(totalSuppliedValueStr) || 0;

    const powerUsed = calculateBorrowPowerUsed(totalBorrowedValue, totalSuppliedValue);
    return formatPercentage(powerUsed / 100);
  }, [borrows, totalSuppliedBalance, isConnected]);

  const allAssets = ConfigService.getAllAssets();

  if (isHidden) {
    return (
      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Your borrows</h2>
          <button onClick={onToggle} className="text-gray-400 hover:text-white">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-sm font-medium text-white">Your borrows</h2>
        <button onClick={onToggle} className="text-gray-400 hover:text-white">
          <EyeOff className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <p className="text-gray-400 text-[11px]">Balance</p>
            <Info className="w-3 h-3 text-gray-400 hover:text-green-400 transition-colors duration-300 cursor-help" />
          </div>
          <p className="text-xs font-medium text-white">{totalBalance}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <p className="text-gray-400 text-[11px]">APY</p>
            <Info className="w-3 h-3 text-gray-400 hover:text-green-400 transition-colors duration-300 cursor-help" />
          </div>
          <p className="text-xs font-medium text-white">{totalAPY}</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-1">
            <p className="text-gray-400 text-[11px]">Borrow power used</p>
            <Info className="w-3 h-3 text-gray-400 hover:text-green-400 transition-colors duration-300 cursor-help" />
          </div>
          <p className="text-xs font-medium text-white">{borrowPowerUsed}</p>
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
        <div className="flex items-center justify-end gap-1">
          <button className="text-gray-500 hover:text-gray-400 transition-colors flex-shrink-0" aria-label="Sort by balance">
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <span className="text-gray-400 text-[11px] font-medium">Balance</span>
        </div>
        <div className="flex items-center justify-end gap-1">
          <button className="text-gray-500 hover:text-gray-400 transition-colors flex-shrink-0" aria-label="Sort by APY">
            <ArrowUpDown className="w-3 h-3" />
          </button>
          <span className="text-gray-400 text-[11px] font-medium">APY</span>
        </div>
        <div></div> {/* Empty column for action buttons */}
      </div>

      {/* Assets List */}
      <div className="space-y-2 sm:space-y-4">
        {borrows.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            No borrows yet. Borrow assets to see them here.
          </div>
        ) : (
          allAssets.map((asset) => (
            <BorrowBorrowRow
              key={asset.symbol}
              asset={asset}
              isConnected={isConnected}
              onBorrow={(borrowAsset) => {
                setSelectedAsset(borrowAsset);
                setBorrowModalOpen(true);
              }}
              onRepay={(borrowAsset) => {
                setSelectedAsset(borrowAsset);
                setRepayModalOpen(true);
              }}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {selectedAsset && (
        <>
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
          <RepayModal
            isOpen={repayModalOpen}
            onClose={() => {
              setRepayModalOpen(false);
              setSelectedAsset(null);
            }}
            asset={{
              symbol: selectedAsset.symbol,
              name: selectedAsset.name,
              icon: selectedAsset.icon,
              borrowAPY: selectedAsset.borrowAPY,
              healthFactor: "8.81", // TODO: Get from contract
              debt: selectedAsset.debt,
              debtUSD: selectedAsset.debtUSD,
            }}
          />
        </>
      )}
    </div>
  );
}
