"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";

export default function LendSection() {
  const [asset, setAsset] = useState("");
  const [amount, setAmount] = useState("");
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleDeposit = async () => {
    if (!asset || !amount) return;
    
    // TODO: Replace with actual contract address and ABI
    try {
      await writeContract({
        address: "0x...", // Contract address
        abi: [], // Contract ABI
        functionName: "deposit",
        args: [asset, parseEther(amount)],
      });
    } catch (error) {
      console.error("Deposit failed:", error);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6">Lend Assets</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-2">Select Asset</label>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select an asset</option>
            <option value="zbtc">zBTC</option>
            <option value="ztc">ZTC</option>
            <option value="usdc">USDC</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          onClick={handleDeposit}
          disabled={isPending || isConfirming || !asset || !amount}
          className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? "Processing..." : "Deposit"}
        </button>

        {isSuccess && (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded-lg">
            <p className="text-green-400">Transaction confirmed!</p>
            <a
              href={`https://explorer.zenchain.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 underline text-sm"
            >
              View on explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
