"use client";

import { useAccount } from "wagmi";
import { useState, useMemo } from "react";
import { Info } from "lucide-react";
import Link from "next/link";
import YourSupplies from "./YourSupplies";
import YourBorrows from "./YourBorrows";
import AssetsToSupply from "./AssetsToSupply";
import AssetsToBorrow from "./AssetsToBorrow";
import { useHealthFactor } from "@/hooks/useContract";
import { useUserSupplies, useUserBorrows } from "@/hooks/useUserData";
import { ConfigService } from "@/services/configService";
import { formatUSD, formatAPY, formatHealthFactor } from "@/utils/format";
import { formatUnits } from "viem";

export default function DashboardView() {
  const { address, isConnected } = useAccount();
  const [hideSupplies, setHideSupplies] = useState(false);
  const [hideBorrows, setHideBorrows] = useState(false);
  const [hideSupplyAssets, setHideSupplyAssets] = useState(false);
  const [hideBorrowAssets, setHideBorrowAssets] = useState(false);

  // Get health factor from contract
  const { data: healthFactorData, isLoading: healthFactorLoading } = useHealthFactor(isConnected);

  // Get supplies and borrows data
  const { supplies, totalBalance: totalSuppliedBalance } = useUserSupplies();
  const { borrows, totalBalance: totalBorrowedBalance } = useUserBorrows();

  // Calculate health factor (convert from 1e18 scale)
  const healthFactor = useMemo(() => {
    if (!healthFactorData) return Infinity;
    const hf = Number(healthFactorData);
    if (hf === Number.MAX_SAFE_INTEGER || hf > 1e18) return Infinity;
    return hf / 1e18;
  }, [healthFactorData]);

  // Format health factor for display
  const healthFactorDisplay = useMemo(() => {
    // If no borrows, show a user-friendly message instead of infinity
    if (borrows.length === 0) {
      return "No Debt";
    }
    return formatHealthFactor(healthFactor);
  }, [healthFactor, borrows.length]);

  // Calculate Net Worth = Total Supplied - Total Borrowed
  const netWorth = useMemo(() => {
    if (!isConnected) return "$0.00";
    
    const suppliedValueStr = totalSuppliedBalance.replace("$", "").replace(/,/g, "");
    const borrowedValueStr = totalBorrowedBalance.replace("$", "").replace(/,/g, "");
    
    const suppliedValue = parseFloat(suppliedValueStr) || 0;
    const borrowedValue = parseFloat(borrowedValueStr) || 0;
    
    return formatUSD(suppliedValue - borrowedValue);
  }, [totalSuppliedBalance, totalBorrowedBalance, isConnected]);

  // Calculate Net APY = (Weighted Supply APY) - (Weighted Borrow APY)
  const netAPY = useMemo(() => {
    if (!isConnected || (supplies.length === 0 && borrows.length === 0)) return "0.00%";
    
    // Calculate weighted supply APY
    const totalSuppliedValue = supplies.reduce((sum, supply) => {
      return sum + (Number(formatUnits(supply.balanceRaw, supply.decimals)) * supply.price);
    }, 0);
    
    const weightedSupplyAPY = supplies.reduce((sum, supply) => {
      const assetConfig = ConfigService.getAssetConfig(supply.symbol);
      if (!assetConfig) return sum;
      const value = Number(formatUnits(supply.balanceRaw, supply.decimals)) * supply.price;
      return sum + (assetConfig.supplyAPY * value);
    }, 0);
    
    // Calculate weighted borrow APY
    const totalBorrowedValue = borrows.reduce((sum, borrow) => {
      return sum + (Number(formatUnits(borrow.balanceRaw, borrow.decimals)) * borrow.price);
    }, 0);
    
    const weightedBorrowAPY = borrows.reduce((sum, borrow) => {
      const assetConfig = ConfigService.getAssetConfig(borrow.symbol);
      if (!assetConfig) return sum;
      const value = Number(formatUnits(borrow.balanceRaw, borrow.decimals)) * borrow.price;
      return sum + (assetConfig.borrowAPY * value);
    }, 0);
    
    // Net APY
    const supplyAPYValue = totalSuppliedValue > 0 ? weightedSupplyAPY / totalSuppliedValue : 0;
    const borrowAPYValue = totalBorrowedValue > 0 ? weightedBorrowAPY / totalBorrowedValue : 0;
    const netAPYValue = supplyAPYValue - borrowAPYValue;
    
    return formatAPY(netAPYValue);
  }, [supplies, borrows, isConnected]);

  // Determine Net APY color (green if positive, red if negative)
  const netAPYColor = useMemo(() => {
    const netAPYValue = parseFloat(netAPY.replace("%", "")) || 0;
    return netAPYValue >= 0 ? "text-green-400" : "text-red-400";
  }, [netAPY]);

  const availableRewards = "$0";

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Market Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-white">
            <span className="text-white">ZenChain</span>{" "}
            <span className="text-gradient-zen">Testnet Market</span>
          </h1>
          <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 text-green-300 text-[10px] font-medium rounded-full border border-green-400/30 animate-pulse-glow">
            TESTNET
          </span>
          <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 text-cyan-300 text-[10px] font-medium rounded-full border border-cyan-400/30">
            V1
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in">
          <p className="text-gray-400 text-[11px] mb-1">Net worth</p>
          <p className="text-sm font-medium text-white">{netWorth}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-gray-400 text-[11px]">Net APY</p>
            <button
              className="text-gray-400 hover:text-green-400 transition-colors duration-300 cursor-help"
              title="Net Annual Percentage Yield"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <p className={`text-sm font-medium ${netAPYColor}`}>{netAPY}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <p className="text-gray-400 text-[11px]">Health factor</p>
              <button
                className="text-gray-400 hover:text-green-400 transition-colors duration-300 cursor-help"
                title="Your account health factor"
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
            <button className="text-[10px] font-medium text-gradient-zen hover:opacity-80 transition-all duration-300">
              RISK DETAILS
            </button>
          </div>
          <p className="text-sm font-medium text-green-400">
            {healthFactorLoading ? "Loading..." : healthFactorDisplay}
          </p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-gray-400 text-[11px]">Available ZFI reward</p>
            <button className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white text-[10px] font-medium rounded transition-all duration-300 hover-glow">
              CLAIM
            </button>
          </div>
          <p className="text-sm font-medium text-white">{availableRewards}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
          <YourSupplies isHidden={hideSupplies} onToggle={() => setHideSupplies(!hideSupplies)} />
          <AssetsToSupply isHidden={hideSupplyAssets} onToggle={() => setHideSupplyAssets(!hideSupplyAssets)} />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 lg:gap-8 min-w-0">
          <YourBorrows isHidden={hideBorrows} onToggle={() => setHideBorrows(!hideBorrows)} />
          <AssetsToBorrow isHidden={hideBorrowAssets} onToggle={() => setHideBorrowAssets(!hideBorrowAssets)} />
        </div>
      </div>

      {/* View Transactions Button */}
      <div className="mt-8 lg:mt-12 flex justify-end animate-fade-in">
        <Link href="/transactions">
          <button className="px-3 py-1.5 bg-gradient-to-r from-yellow-400/10 via-green-400/10 to-cyan-400/10 hover:from-yellow-400/20 hover:via-green-400/20 hover:to-cyan-400/20 text-white text-xs font-medium rounded transition-all duration-300 border border-green-400/30 hover:border-green-400/50 hover-glow">
            VIEW TRANSACTIONS
          </button>
        </Link>
      </div>
    </div>
  );
}
