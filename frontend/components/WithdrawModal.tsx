"use client";

import { useState, useEffect } from "react";
import { X, Info, Fuel } from "lucide-react";
import { useAccount } from "wagmi";
import { useWithdraw, useSupplyBalance, usePriceFromOracle, useHealthFactor } from "@/hooks/useContract";
import { ConfigService } from "@/services/configService";
import { formatBalance, formatUSD } from "@/utils/format";
import { formatUnits } from "viem";
import { useTokenDecimals } from "@/hooks/useBalance";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    symbol: string;
    name: string;
    icon: string;
    balance: string;
    balanceUSD: string;
    apy: string;
    healthFactor: string;
  };
}

export default function WithdrawModal({
  isOpen,
  onClose,
  asset,
}: WithdrawModalProps) {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const { withdraw, isPending, isConfirming, isSuccess, error } = useWithdraw();
  
  // Get supply balance
  const { data: supplyBalanceRaw } = useSupplyBalance(asset.symbol, isConnected);
  const assetConfig = ConfigService.getAssetConfig(asset.symbol);
  const { data: tokenDecimals } = useTokenDecimals(asset.symbol, isConnected);
  
  // Use contract decimals if available, otherwise fall back to config
  const decimals = tokenDecimals !== undefined ? tokenDecimals : assetConfig?.decimals || 18;
  
  const supplyBalance = supplyBalanceRaw
    ? formatBalance(formatUnits(supplyBalanceRaw, decimals))
    : "0";

  // Get price for USD value
  const { price } = usePriceFromOracle(asset.symbol, isConnected);
  
  // Get health factor
  const { data: healthFactorData } = useHealthFactor(isConnected);
  const healthFactor = healthFactorData 
    ? (Number(healthFactorData) > 1e18 ? Infinity : Number(healthFactorData) / 1e18)
    : Infinity;

  // Calculate USD value
  const usdValue = price && amount 
    ? (parseFloat(amount) * price).toFixed(2)
    : "0";

  // Handle success - close modal and reset
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        onClose();
        setAmount("");
      }, 2000);
    }
  }, [isSuccess, onClose]);

  const handleMax = () => {
    setAmount(supplyBalance);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow numbers and one decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleWithdraw = async () => {
    if (!isValidAmount || !assetConfig) return;
    try {
      await withdraw(asset.symbol, amount);
    } catch (err) {
      console.error("Withdraw error:", err);
    }
  };

  const isValidAmount =
    amount &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= parseFloat(supplyBalance);
  
  const isLoading = isPending || isConfirming;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0f1422] rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Withdraw {asset.symbol}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Input */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm text-gray-400">Amount</label>
              <button
                className="text-gray-400 hover:text-white transition-colors cursor-help"
                title="Enter the amount you want to withdraw"
                aria-label="Amount info"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2 gap-2">
                <input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="bg-transparent text-2xl font-semibold text-white placeholder-gray-500 outline-none flex-1 min-w-0"
                />
                <div className="flex items-center flex-shrink-0">
                  <div className="text-right min-w-[60px]">
                    <p className="text-sm font-medium text-white whitespace-nowrap">{asset.symbol}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">${usdValue}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400">Supply balance {supplyBalance}</p>
                  <button
                    onClick={handleMax}
                    className="px-2 py-1 text-xs font-medium text-gradient-zen hover:opacity-80 transition-all duration-300"
                  >
                    MAX
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Overview */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Transaction overview</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400">Supply APY</p>
                  <button
                    className="text-gray-400 hover:text-white transition-colors cursor-help"
                    title="Annual Percentage Yield for supplying this asset"
                    aria-label="APY info"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-medium text-white">{asset.apy}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400">Collateralization</p>
                  <button
                    className="text-gray-400 hover:text-white transition-colors cursor-help"
                    title="Whether this asset is used as collateral"
                    aria-label="Collateralization info"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-medium text-green-400">Enabled</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400">Health factor</p>
                  <button
                    className="text-gray-400 hover:text-white transition-colors cursor-help"
                    title="Your account health factor after this transaction"
                    aria-label="Health factor info"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {healthFactor === Infinity ? "∞" : healthFactor.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Liquidation at &lt;1.0</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-400">Gas estimation</p>
                </div>
                <p className="text-sm font-medium text-gray-500">-</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleWithdraw}
            disabled={!isValidAmount || isLoading}
            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
              isValidAmount && !isLoading
                ? "bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white cursor-pointer hover-glow"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoading
              ? isConfirming
                ? "Confirming..."
                : "Processing..."
              : isSuccess
              ? "Success!"
              : isValidAmount
              ? "Withdraw"
              : "Enter an amount"}
          </button>
          
          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                {error.message || "Transaction failed. Please try again."}
              </p>
            </div>
          )}
          
          {/* Success Message */}
          {isSuccess && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400">
                Successfully withdrew {amount} {asset.symbol}!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

