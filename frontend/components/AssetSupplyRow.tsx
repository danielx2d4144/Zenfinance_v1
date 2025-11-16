/**
 * Individual asset row component for AssetsToSupply
 * This component handles a single asset's wallet balance data
 */

import { useTokenBalance, usePriceFromOracle } from "@/hooks/useContract";
import { useTokenDecimals } from "@/hooks/useBalance";
import { ConfigService } from "@/services/configService";
import { formatBalance, formatUSD, formatAPY } from "@/utils/format";
import { formatUnits } from "viem";

interface AssetSupplyRowProps {
  asset: ReturnType<typeof ConfigService.getAllAssets>[0];
  isConnected: boolean;
  showZeroBalance: boolean;
  onSupply: (asset: any) => void;
}

export default function AssetSupplyRow({ asset, isConnected, showZeroBalance, onSupply }: AssetSupplyRowProps) {
  const { data: balance } = useTokenBalance(asset.symbol, isConnected);
  const { price } = usePriceFromOracle(asset.symbol, isConnected);
  const { data: decimals } = useTokenDecimals(asset.symbol, isConnected);

  // Use contract decimals if available, otherwise fall back to config
  const tokenDecimals = decimals !== undefined ? decimals : asset.decimals;

  const balanceRaw = balance || 0n;
  const walletBalance = balance ? formatBalance(formatUnits(balance, tokenDecimals)) : "0.00";
  const walletBalanceUSD = price && balance 
    ? formatUSD(Number(formatUnits(balance, tokenDecimals)) * price) 
    : "$0.00";

  // Don't render if balance is 0 and showZeroBalance is false
  if (balanceRaw === 0n && !showZeroBalance) {
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
          {/* Action Button */}
          <button
            onClick={() => onSupply({
              symbol: asset.symbol,
              name: asset.name,
              icon: asset.icon,
              balance: walletBalance,
              apy: formatAPY(asset.supplyAPY),
              healthFactor: "8.81",
            })}
            className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white text-xs font-medium rounded transition-all duration-300 hover-glow whitespace-nowrap flex-shrink-0"
          >
            Supply
          </button>
        </div>
        
        {/* Mobile Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs ml-10">
          <div>
            <p className="text-gray-400 mb-0.5">Balance</p>
            <p className="text-white font-medium">{walletBalance}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">APY</p>
            <p className="text-white font-medium">{formatAPY(asset.supplyAPY)}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Collateral</p>
            {asset.canBeCollateral ? (
              <span className="text-green-400">✓ Yes</span>
            ) : (
              <span className="text-gray-500">- No</span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1.2fr_1.3fr_auto] gap-4 items-center">
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
        {/* Wallet Balance Column */}
        <div className="flex items-center justify-center">
          <p className="text-sm font-medium text-white whitespace-nowrap">{walletBalance}</p>
        </div>
        {/* APY Column */}
        <div className="flex items-center justify-center">
          <p className="text-sm font-medium text-white whitespace-nowrap">{formatAPY(asset.supplyAPY)}</p>
        </div>
        {/* Can be Collateral Column */}
        <div className="flex items-center justify-center">
          {asset.canBeCollateral ? (
            <span className="text-green-400 text-sm">✓</span>
          ) : (
            <span className="text-gray-500 text-sm">-</span>
          )}
        </div>
        {/* Action Buttons Column */}
        <div className="flex gap-2 flex-shrink-0 justify-end">
          <button
            onClick={() => onSupply({
              symbol: asset.symbol,
              name: asset.name,
              icon: asset.icon,
              balance: walletBalance,
              apy: formatAPY(asset.supplyAPY),
              healthFactor: "8.81",
            })}
            className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white text-xs font-medium rounded transition-all duration-300 hover-glow whitespace-nowrap"
          >
            Supply
          </button>
        </div>
      </div>
    </div>
  );
}

