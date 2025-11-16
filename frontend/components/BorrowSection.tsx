"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { parseEther } from "viem";

export default function BorrowSection() {
  const [borrowAsset, setBorrowAsset] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [collateralAsset, setCollateralAsset] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const { writeContract, isPending } = useWriteContract();

  const handleBorrow = async () => {
    if (!borrowAsset || !borrowAmount || !collateralAsset || !collateralAmount) return;
    
    // TODO: Replace with actual contract address and ABI
    try {
      await writeContract({
        address: "0x...", // Contract address
        abi: [], // Contract ABI
        functionName: "borrow",
        args: [
          borrowAsset,
          parseEther(borrowAmount),
          collateralAsset,
          parseEther(collateralAmount),
        ],
      });
    } catch (error) {
      console.error("Borrow failed:", error);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6">Borrow Assets</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">What to Borrow</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Asset</label>
              <select
                value={borrowAsset}
                onChange={(e) => setBorrowAsset(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select asset</option>
                <option value="zbtc">zBTC</option>
                <option value="ztc">ZTC</option>
                <option value="usdc">USDC</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Amount</label>
              <input
                type="number"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Collateral</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Collateral Asset</label>
              <select
                value={collateralAsset}
                onChange={(e) => setCollateralAsset(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select asset</option>
                <option value="zbtc">zBTC</option>
                <option value="ztc">ZTC</option>
                <option value="usdc">USDC</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Collateral Amount</label>
              <input
                type="number"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum: 150% collateralization ratio required
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleBorrow}
          disabled={isPending || !borrowAsset || !borrowAmount || !collateralAsset || !collateralAmount}
          className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Processing..." : "Borrow"}
        </button>
      </div>
    </div>
  );
}
