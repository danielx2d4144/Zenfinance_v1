/**
 * Individual supply row component
 * This component handles a single asset's supply data
 */

import { useSupplyBalance, usePriceFromOracle } from "@/hooks/useContract";
import { useTokenDecimals } from "@/hooks/useBalance";
import { ConfigService } from "@/services/configService";
import { formatBalance, formatUSD, formatAPY } from "@/utils/format";
import { formatUnits } from "viem";
import { ArrowUpDown, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

interface SupplyRowProps {
  asset: ReturnType<typeof ConfigService.getAllAssets>[0];
  isConnected: boolean;
  onWithdraw: (supply: any) => void;
  onSupply: (supply: any) => void;
}

export default function SupplyRow({ asset, isConnected, onWithdraw, onSupply }: SupplyRowProps) {
  const queryClient = useQueryClient();
  const { data: balance, refetch: refetchBalance } = useSupplyBalance(asset.symbol, isConnected);
  const { price } = usePriceFromOracle(asset.symbol, isConnected);
  const { data: tokenDecimals } = useTokenDecimals(asset.symbol, isConnected);
  
  // Refetch balance periodically and on mount
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        refetchBalance();
      }, 10000); // Refetch every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [isConnected, refetchBalance]);

  // Use contract decimals if available, otherwise fall back to config
  const decimals = tokenDecimals !== undefined ? tokenDecimals : asset.decimals;

  const balanceRaw = balance || 0n;
  const balanceFormatted = balance ? formatBalance(formatUnits(balance, decimals)) : "0.00";
  const balanceUSD = price && balance 
    ? formatUSD(Number(formatUnits(balance, decimals)) * price) 
    : "$0.00";

  // Don't render if balance is 0
  if (balanceRaw === 0n) {
    return null;
  }

  return (
    <div className="py-3 sm:py-4 border-b border-white/5 last:border-0">
      {/* Mobile Card Layout */}
      <div className="lg:hidden">
        <div className="flex items-start justify-between gap-3 mb-2">
          {/* Asset Info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 flex items-center justify-center text-base shadow-lg shadow-green-500/20 transition-all duration-300 flex-shrink-0">
              {asset.icon || ""}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {asset.name}
              </p>
              <p className="text-gray-400 text-xs">{asset.symbol}</p>
            </div>
          </div>
        </div>
        
        {/* Mobile Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs ml-10 mb-2">
          <div>
            <p className="text-gray-400 mb-0.5">Balance</p>
            <p className="text-white font-medium">{balanceFormatted}</p>
            <p className="text-gray-400 text-[10px]">{balanceUSD}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">APY</p>
            <p className="text-white font-medium">{formatAPY(asset.supplyAPY)}</p>
          </div>
        </div>
        
        {/* Mobile Action Buttons */}
        <div className="flex gap-2 ml-10">
          <button
            onClick={() => onSupply({
              symbol: asset.symbol,
              name: asset.name,
              icon: asset.icon,
              balance: balanceFormatted,
              apy: formatAPY(asset.supplyAPY),
            })}
            className="flex-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white text-xs font-medium rounded transition-all duration-300 hover-glow whitespace-nowrap"
          >
            Supply
          </button>
          <button
            onClick={() => onWithdraw({
              symbol: asset.symbol,
              name: asset.name,
              icon: asset.icon,
              balance: balanceFormatted,
              apy: formatAPY(asset.supplyAPY),
            })}
            className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-gradient-to-r hover:from-yellow-400/20 hover:via-green-400/20 hover:to-cyan-400/20 text-white text-xs font-medium rounded transition-all duration-300 border border-white/20 hover:border-green-400/30 whitespace-nowrap"
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid grid-cols-[2fr_1fr_80px_auto] gap-4 items-center">
        {/* Asset Column */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 flex items-center justify-center text-lg shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-110 flex-shrink-0">
            {asset.icon || ""}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {asset.name}
            </p>
            <p className="text-gray-400 text-xs">{asset.symbol}</p>
          </div>
        </div>
        {/* Balance Column */}
        <div className="flex flex-col items-end justify-center">
          <p className="text-sm font-medium text-white whitespace-nowrap">{balanceFormatted}</p>
          <p className="text-gray-400 text-xs whitespace-nowrap">{balanceUSD}</p>
        </div>
        {/* APY Column */}
        <div className="flex items-center justify-end">
          <p className="text-sm font-medium text-white whitespace-nowrap">{formatAPY(asset.supplyAPY)}</p>
        </div>
        {/* Action Buttons Column */}
        <div className="flex gap-2 flex-shrink-0 justify-end">
          <button
            onClick={() => onSupply({
              symbol: asset.symbol,
              name: asset.name,
              icon: asset.icon,
              balance: balanceFormatted,
              apy: formatAPY(asset.supplyAPY),
            })}
            className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white text-xs font-medium rounded transition-all duration-300 hover-glow whitespace-nowrap"
          >
            Supply
          </button>
          <button
            onClick={() => onWithdraw({
              symbol: asset.symbol,
              name: asset.name,
              icon: asset.icon,
              balance: balanceFormatted,
              apy: formatAPY(asset.supplyAPY),
            })}
            className="px-3 py-1.5 bg-white/10 hover:bg-gradient-to-r hover:from-yellow-400/20 hover:via-green-400/20 hover:to-cyan-400/20 text-white text-xs font-medium rounded transition-all duration-300 border border-white/20 hover:border-green-400/30 whitespace-nowrap"
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}

