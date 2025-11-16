/**
 * Individual asset row component for AssetsToBorrow
 * This component handles a single asset's available borrow data
 */

import { useMemo } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { useAvailableBorrow, usePriceFromOracle, useTotalSupplied, useTotalBorrowed } from "@/hooks/useContract";
import { useTokenDecimals } from "@/hooks/useBalance";
import { ConfigService } from "@/services/configService";
import { formatBalance, formatUSD, formatAPY } from "@/utils/format";

interface BorrowRowProps {
  asset: ReturnType<typeof ConfigService.getAllAssets>[0];
  isConnected: boolean;
  onBorrow: (asset: any) => void;
}

export default function BorrowRow({ asset, isConnected, onBorrow }: BorrowRowProps) {
  const { data: availableBorrowRaw } = useAvailableBorrow(asset.symbol, isConnected);
  const { price } = usePriceFromOracle(asset.symbol, isConnected);
  const { data: totalSuppliedRaw } = useTotalSupplied(asset.symbol, true);
  const { data: totalBorrowedRaw } = useTotalBorrowed(asset.symbol, true);
  const { data: tokenDecimals } = useTokenDecimals(asset.symbol, isConnected);

  // Use contract decimals if available, otherwise fall back to config
  const decimals = tokenDecimals !== undefined ? tokenDecimals : asset.decimals;

  // Calculate utilization rate and borrow APY
  const { utilizationRate, borrowAPY } = useMemo(() => {
    if (!totalSuppliedRaw || !totalBorrowedRaw) {
      return { utilizationRate: 0, borrowAPY: asset.borrowAPY };
    }

    const totalSupplied = Number(formatUnits(totalSuppliedRaw, decimals));
    const totalBorrowed = Number(formatUnits(totalBorrowedRaw, decimals));

    const utilization = ConfigService.calculateUtilizationRate(totalBorrowed, totalSupplied);
    const borrowRate = ConfigService.calculateBorrowRate(utilization);
    const borrowAPYValue = ConfigService.calculateAPY(borrowRate);

    return {
      utilizationRate: utilization,
      borrowAPY: borrowAPYValue,
    };
  }, [totalSuppliedRaw, totalBorrowedRaw, decimals, asset.borrowAPY]);

  const availableBorrowFormatted = availableBorrowRaw
    ? formatBalance(formatUnits(availableBorrowRaw, decimals))
    : "0.00";

  const availableBorrowUSD = useMemo(() => {
    if (!price || !availableBorrowRaw) return "$0.00";
    const amount = Number(formatUnits(availableBorrowRaw, decimals));
    return formatUSD(amount * price);
  }, [price, availableBorrowRaw, decimals]);

  // Don't show if available borrow is 0 (but we might want to show it anyway for visibility)
  // For now, we'll show all assets since users should see what they can borrow

  return (
    <div className="py-3 sm:py-4 border-b border-white/5 last:border-0">
      {/* Mobile Card Layout */}
      <div className="lg:hidden">
        <div className="flex items-start justify-between gap-3 mb-2">
          {/* Asset Info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-base flex-shrink-0">
              {asset.icon || ""}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{asset.name}</div>
              <div className="text-gray-400 text-xs">{asset.symbol}</div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onBorrow({
                symbol: asset.symbol,
                name: asset.name,
                icon: asset.icon,
                borrowAPY: formatAPY(borrowAPY),
                available: availableBorrowFormatted,
              })}
              disabled={!availableBorrowRaw || availableBorrowRaw === 0n}
              className="px-3 py-1.5 bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 hover:from-yellow-400/30 hover:via-green-400/30 hover:to-cyan-400/30 text-green-300 rounded text-xs font-medium transition-all duration-300 border border-green-400/30 hover:border-green-400/50 hover-glow whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Borrow
            </button>
          </div>
        </div>
        
        {/* Mobile Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs ml-10">
          <div>
            <p className="text-gray-400 mb-0.5">Available</p>
            <p className="text-white font-medium">{availableBorrowFormatted}</p>
            <p className="text-gray-400 text-[10px]">{availableBorrowUSD}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Borrow APY</p>
            <p className="text-white font-medium">{formatAPY(borrowAPY)}</p>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center text-lg flex-shrink-0">
            {asset.icon || ""}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{asset.name}</div>
            <div className="text-gray-400 text-xs">{asset.symbol}</div>
          </div>
          <div className="text-right min-w-[80px] flex-shrink-0">
            <div className="text-white text-sm font-medium whitespace-nowrap">{availableBorrowFormatted}</div>
            <div className="text-gray-400 text-xs whitespace-nowrap">{availableBorrowUSD}</div>
          </div>
          <div className="text-right min-w-[70px] flex-shrink-0">
            <div className="flex items-center justify-end gap-1">
              <div className="text-white text-sm font-medium">{formatAPY(borrowAPY)}</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-4 flex-shrink-0">
          <button
            onClick={() => onBorrow({
              symbol: asset.symbol,
              name: asset.name,
              icon: asset.icon,
              borrowAPY: formatAPY(borrowAPY),
              available: availableBorrowFormatted,
            })}
            disabled={!availableBorrowRaw || availableBorrowRaw === 0n}
            className="px-3 py-1.5 bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 hover:from-yellow-400/30 hover:via-green-400/30 hover:to-cyan-400/30 text-green-300 rounded text-xs font-medium transition-all duration-300 border border-green-400/30 hover:border-green-400/50 hover-glow whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Borrow
          </button>
          <Link
            href={`/market/${asset.symbol}`}
            className="inline-block px-3 py-1.5 bg-white/5 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:via-green-400/10 hover:to-cyan-400/10 text-white rounded text-xs font-medium transition-all duration-300 border border-white/10 hover:border-green-400/30 whitespace-nowrap"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}

