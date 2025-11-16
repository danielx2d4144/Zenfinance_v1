/**
 * Component to fetch market data for a single asset
 * Used to aggregate market stats
 */

import { useEffect, useRef } from "react";
import { useTotalSupplied, useTotalBorrowed, usePriceFromOracle } from "@/hooks/useContract";
import { useTokenDecimals } from "@/hooks/useBalance";
import { formatUnits } from "viem";

interface MarketStatsRowProps {
  asset: ReturnType<typeof import("@/services/configService").ConfigService.getAllAssets>[0];
  onData: (data: { supplied: number; borrowed: number }) => void;
}

export default function MarketStatsRow({ asset, onData }: MarketStatsRowProps) {
  const { data: totalSuppliedRaw } = useTotalSupplied(asset.symbol, true);
  const { data: totalBorrowedRaw } = useTotalBorrowed(asset.symbol, true);
  const { price } = usePriceFromOracle(asset.symbol, true);
  const { data: tokenDecimals } = useTokenDecimals(asset.symbol, true);

  // Use contract decimals if available, otherwise fall back to config
  const decimals = tokenDecimals !== undefined ? tokenDecimals : asset.decimals;
  
  // Track previous values to prevent unnecessary updates
  const prevDataRef = useRef<string>("");

  // Calculate and report data when it changes
  useEffect(() => {
    if (totalSuppliedRaw && price) {
      const suppliedAmount = Number(formatUnits(totalSuppliedRaw, decimals));
      const borrowedAmount = totalBorrowedRaw && totalBorrowedRaw > 0n
        ? Number(formatUnits(totalBorrowedRaw, decimals))
        : 0;

      const newData = {
        supplied: suppliedAmount * price,
        borrowed: borrowedAmount * price,
      };
      
      // Only call onData if the values actually changed
      const dataKey = `${newData.supplied}-${newData.borrowed}`;
      if (prevDataRef.current !== dataKey) {
        prevDataRef.current = dataKey;
        onData(newData);
      }
    } else {
      // Report zero if no data
      const dataKey = "0-0";
      if (prevDataRef.current !== dataKey) {
        prevDataRef.current = dataKey;
        onData({ supplied: 0, borrowed: 0 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSuppliedRaw, totalBorrowedRaw, price, decimals]);

  return null; // This component doesn't render anything
}


