"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown } from "lucide-react";
import { ConfigService } from "@/services/configService";
import { formatUSD } from "@/utils/format";
import MarketRow from "./MarketRow";
import MarketStatsRow from "./MarketStatsRow";

export default function MarketsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const allAssets = ConfigService.getAllAssets();

  // Filter assets based on search and category
  const filteredAssets = useMemo(() => {
    let filtered = allAssets.filter((asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Category filter
    if (selectedCategory === "Stablecoins") {
      filtered = filtered.filter((asset) => 
        ["USDC", "USDT"].includes(asset.symbol)
      );
    } else if (selectedCategory === "Cryptocurrencies") {
      filtered = filtered.filter((asset) => 
        !["USDC", "USDT"].includes(asset.symbol)
      );
    }

    return filtered;
  }, [allAssets, searchQuery, selectedCategory]);

  // Calculate market stats
  const statsRef = useRef<Map<string, { supplied: number; borrowed: number }>>(new Map());
  const [marketStats, setMarketStats] = useState({
    totalMarketSize: "$0.00",
    totalAvailable: "$0.00",
    totalBorrows: "$0.00",
  });

  const handleAssetData = useCallback((symbol: string, data: { supplied: number; borrowed: number }) => {
    statsRef.current.set(symbol, data);
    
    // Recalculate stats
    let totalMarketSize = 0;
    let totalBorrows = 0;
    statsRef.current.forEach((d) => {
      totalMarketSize += d.supplied;
      totalBorrows += d.borrowed;
    });

    const totalAvailable = totalMarketSize - totalBorrows;
    setMarketStats({
      totalMarketSize: formatUSD(totalMarketSize, false),
      totalAvailable: formatUSD(totalAvailable, false),
      totalBorrows: formatUSD(totalBorrows, false),
    });
  }, []);

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
            V3
          </span>
        </div>
      </div>

      {/* Hidden components to fetch market stats */}
      {allAssets.map((asset) => (
        <MarketStatsRow
          key={asset.symbol}
          asset={asset}
          onData={(data) => handleAssetData(asset.symbol, data)}
        />
      ))}

      {/* Market Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in">
          <p className="text-gray-400 text-[11px] mb-1">Total market size</p>
          <p className="text-sm font-medium text-white">{marketStats.totalMarketSize}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <p className="text-gray-400 text-[11px] mb-1">Total available</p>
          <p className="text-sm font-medium text-white">{marketStats.totalAvailable}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <p className="text-gray-400 text-[11px] mb-1">Total borrows</p>
          <p className="text-sm font-medium text-white">{marketStats.totalBorrows}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search asset name, symbol, or address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/30 transition-all duration-300"
            />
          </div>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white pr-8 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/30 transition-all duration-300 w-full sm:w-auto"
            >
              <option value="All Categories">All Categories</option>
              <option value="Stablecoins">Stablecoins</option>
              <option value="Cryptocurrencies">Cryptocurrencies</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">Asset</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300">Total supplied</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300">Supply APY</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300">Total borrowed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300">Borrow APY, variable</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset, index) => (
                <MarketRow key={asset.symbol} asset={asset} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
