/**
 * Individual market row component for MarketsView
 * This component handles a single asset's market data
 */

import { useMemo } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { formatUnits } from "viem";
import { useTotalSupplied, useTotalBorrowed, usePriceFromOracle } from "@/hooks/useContract";
import { useTokenDecimals } from "@/hooks/useBalance";
import { ConfigService } from "@/services/configService";
import { formatBalance, formatUSD, formatAPY } from "@/utils/format";

interface MarketRowProps {
  asset: ReturnType<typeof ConfigService.getAllAssets>[0];
}

export default function MarketRow({ asset }: MarketRowProps) {
  const { data: totalSuppliedRaw } = useTotalSupplied(asset.symbol, true);
  const { data: totalBorrowedRaw } = useTotalBorrowed(asset.symbol, true);
  const { price } = usePriceFromOracle(asset.symbol, true);
  const { data: tokenDecimals } = useTokenDecimals(asset.symbol, true);

  // Use contract decimals if available, otherwise fall back to config
  const decimals = tokenDecimals !== undefined ? tokenDecimals : asset.decimals;

  // Calculate total supplied
  const totalSupplied = useMemo(() => {
    if (!totalSuppliedRaw) return { amount: "0.00", usd: "$0.00" };
    const amount = Number(formatUnits(totalSuppliedRaw, decimals));
    const usdValue = price ? amount * price : 0;
    return {
      amount: formatBalance(amount),
      usd: formatUSD(usdValue),
    };
  }, [totalSuppliedRaw, decimals, price]);

  // Calculate total borrowed
  const totalBorrowed = useMemo(() => {
    if (!totalBorrowedRaw || totalBorrowedRaw === 0n) {
      return { amount: "-", usd: "-" };
    }
    const amount = Number(formatUnits(totalBorrowedRaw, decimals));
    const usdValue = price ? amount * price : 0;
    return {
      amount: formatBalance(amount),
      usd: formatUSD(usdValue),
    };
  }, [totalBorrowedRaw, decimals, price]);

  // Calculate borrow APY from utilization rate
  const borrowAPY = useMemo(() => {
    if (!totalSuppliedRaw || !totalBorrowedRaw || totalBorrowedRaw === 0n) {
      return asset.borrowAPY; // Use static APY if no data
    }

    const totalSupplied = Number(formatUnits(totalSuppliedRaw, decimals));
    const totalBorrowed = Number(formatUnits(totalBorrowedRaw, decimals));

    const utilization = ConfigService.calculateUtilizationRate(totalBorrowed, totalSupplied);
    const borrowRate = ConfigService.calculateBorrowRate(utilization);
    const borrowAPYValue = ConfigService.calculateAPY(borrowRate);

    return borrowAPYValue;
  }, [totalSuppliedRaw, totalBorrowedRaw, decimals, asset.borrowAPY]);

  // Calculate supply APY from utilization rate
  const supplyAPY = useMemo(() => {
    if (!totalSuppliedRaw || !totalBorrowedRaw || totalBorrowedRaw === 0n) {
      return asset.supplyAPY; // Use static APY if no data
    }

    const totalSupplied = Number(formatUnits(totalSuppliedRaw, decimals));
    const totalBorrowed = Number(formatUnits(totalBorrowedRaw, decimals));

    const utilization = ConfigService.calculateUtilizationRate(totalBorrowed, totalSupplied);
    const borrowRate = ConfigService.calculateBorrowRate(utilization);
    const supplyAPYValue = ConfigService.calculateSupplyAPY(borrowRate, utilization, asset.reserveFactor);

    return supplyAPYValue;
  }, [totalSuppliedRaw, totalBorrowedRaw, decimals, asset.supplyAPY, asset.reserveFactor]);

  return (
    <tr className="border-b border-white/5 hover:bg-gradient-to-r hover:from-yellow-400/5 hover:via-green-400/5 hover:to-cyan-400/5 transition-all duration-300">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 flex items-center justify-center text-lg shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-110">
            {asset.icon || ""}
          </div>
          <div>
            <div className="text-white text-sm font-medium">{asset.name}</div>
            <div className="text-gray-400 text-xs">{asset.symbol}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="text-white text-sm font-medium">{totalSupplied.amount}</div>
        <div className="text-gray-400 text-xs">{totalSupplied.usd}</div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="text-white text-sm font-medium">{formatAPY(supplyAPY)}</div>
      </td>
      <td className="px-4 py-3 text-right">
        {totalBorrowed.amount !== "-" ? (
          <>
            <div className="text-white text-sm font-medium">{totalBorrowed.amount}</div>
            <div className="text-gray-400 text-xs">{totalBorrowed.usd}</div>
          </>
        ) : (
          <span className="text-gray-500 text-sm">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {totalBorrowed.amount !== "-" ? (
          <div className="flex items-center justify-end gap-1">
            <span className="text-white text-sm font-medium">{formatAPY(borrowAPY)}</span>
            <Info className="w-3 h-3 text-gray-400 cursor-help" />
          </div>
        ) : (
          <span className="text-gray-500 text-sm">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <Link
          href={`/market/${asset.symbol}`}
          className="inline-block px-3 py-1.5 bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 hover:from-yellow-400/30 hover:via-green-400/30 hover:to-cyan-400/30 text-green-300 rounded text-xs font-medium transition-all duration-300 border border-green-400/30 hover:border-green-400/50 hover-glow"
        >
          Details
        </Link>
      </td>
    </tr>
  );
}

