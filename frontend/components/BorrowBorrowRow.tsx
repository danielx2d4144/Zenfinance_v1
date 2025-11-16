/**
 * Individual asset row component for YourBorrows
 * This component handles a single asset's borrow balance data
 */

import { useBorrowBalance, usePriceFromOracle } from "@/hooks/useContract";
import { useTokenDecimals } from "@/hooks/useBalance";
import { ConfigService } from "@/services/configService";
import { formatBalance, formatUSD, formatAPY } from "@/utils/format";
import { formatUnits } from "viem";

interface BorrowBorrowRowProps {
  asset: ReturnType<typeof ConfigService.getAllAssets>[0];
  isConnected: boolean;
  onBorrow: (asset: any) => void;
  onRepay: (asset: any) => void;
}

export default function BorrowBorrowRow({ asset, isConnected, onBorrow, onRepay }: BorrowBorrowRowProps) {
  const { data: borrowBalanceRaw } = useBorrowBalance(asset.symbol, isConnected);
  const { price } = usePriceFromOracle(asset.symbol, isConnected);
  const { data: tokenDecimals } = useTokenDecimals(asset.symbol, isConnected);

  // Use contract decimals if available, otherwise fall back to config
  const decimals = tokenDecimals !== undefined ? tokenDecimals : asset.decimals;

  const borrowBalanceFormatted = borrowBalanceRaw
    ? formatBalance(formatUnits(borrowBalanceRaw, decimals), undefined, asset.symbol)
    : (asset.symbol === "WBTC" ? "0.00000" : "0.00");

  const borrowBalanceUSD = price && borrowBalanceRaw
    ? formatUSD(Number(formatUnits(borrowBalanceRaw, decimals)) * price)
    : "$0.00";

  // Don't render if borrow balance is 0
  if (!borrowBalanceRaw || borrowBalanceRaw === 0n) {
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
            <p className="text-gray-400 mb-0.5">Debt</p>
            <p className="text-white font-medium">{borrowBalanceFormatted}</p>
            <p className="text-gray-400 text-[10px]">{borrowBalanceUSD}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Borrow APY</p>
            <p className="text-white font-medium">{formatAPY(asset.borrowAPY)}</p>
          </div>
        </div>
        
        {/* Mobile Action Buttons */}
        <div className="flex gap-2 ml-10">
          <button
            onClick={() => onBorrow({
              symbol: asset.symbol,
              name: asset.name,
              icon: asset.icon,
              borrowAPY: formatAPY(asset.borrowAPY),
            })}
            className="flex-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 hover:from-yellow-400/30 hover:via-green-400/30 hover:to-cyan-400/30 text-green-300 rounded text-xs font-medium transition-all duration-300 border border-green-400/30 hover:border-green-400/50 hover-glow whitespace-nowrap"
          >
            Borrow
          </button>
          <button
            onClick={() => onRepay({
              symbol: asset.symbol,
              name: asset.name,
              icon: asset.icon,
              borrowAPY: formatAPY(asset.borrowAPY),
              debt: borrowBalanceFormatted,
              debtUSD: borrowBalanceUSD,
            })}
            className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:via-green-400/10 hover:to-cyan-400/10 text-white rounded text-xs font-medium transition-all duration-300 border border-white/10 hover:border-green-400/30 whitespace-nowrap"
          >
            Repay
          </button>
        </div>
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid grid-cols-[2fr_1fr_80px_auto] gap-4 items-center">
        {/* Asset Column */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 flex items-center justify-center text-lg flex-shrink-0 shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-110">
            {asset.icon || ""}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{asset.name}</div>
            <div className="text-gray-400 text-xs">{asset.symbol}</div>
          </div>
        </div>
        {/* Balance Column */}
        <div className="flex flex-col items-end justify-center">
          <div className="text-white text-sm font-medium whitespace-nowrap">{borrowBalanceFormatted}</div>
          <div className="text-gray-400 text-xs whitespace-nowrap">{borrowBalanceUSD}</div>
        </div>
        {/* APY Column */}
        <div className="flex items-center justify-end gap-1">
          <div className="text-white text-sm font-medium whitespace-nowrap">{formatAPY(asset.borrowAPY)}</div>
        </div>
        {/* Action Buttons Column */}
        <div className="flex gap-2 flex-shrink-0 justify-end">
          <button
            onClick={() => onBorrow({
              symbol: asset.symbol,
              name: asset.name,
              icon: asset.icon,
              borrowAPY: formatAPY(asset.borrowAPY),
            })}
            className="px-3 py-1.5 bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 hover:from-yellow-400/30 hover:via-green-400/30 hover:to-cyan-400/30 text-green-300 rounded text-xs font-medium transition-all duration-300 border border-green-400/30 hover:border-green-400/50 hover-glow whitespace-nowrap"
          >
            Borrow
          </button>
          <button
            onClick={() => onRepay({
              symbol: asset.symbol,
              name: asset.name,
              icon: asset.icon,
              borrowAPY: formatAPY(asset.borrowAPY),
              debt: borrowBalanceFormatted,
              debtUSD: borrowBalanceUSD,
            })}
            className="px-3 py-1.5 bg-white/5 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:via-green-400/10 hover:to-cyan-400/10 text-white rounded text-xs font-medium transition-all duration-300 border border-white/10 hover:border-green-400/30 whitespace-nowrap"
          >
            Repay
          </button>
        </div>
      </div>
    </div>
  );
}

