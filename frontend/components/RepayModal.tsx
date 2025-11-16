"use client";

import { useState, useEffect } from "react";
import { X, Info, Fuel } from "lucide-react";
import { useAccount } from "wagmi";
import { useRepay, useApproveForRepay, useBorrowBalance, useTokenBalance, usePriceFromOracle, useHealthFactor, useAllowance } from "@/hooks/useContract";
import { ConfigService } from "@/services/configService";
import { formatBalance, formatUSD, formatAPY } from "@/utils/format";
import { formatUnits } from "viem";
import { useTokenDecimals } from "@/hooks/useBalance";

interface RepayModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    symbol: string;
    name: string;
    icon: string;
    borrowAPY?: string;
    healthFactor: string;
    debt?: string;
    debtUSD?: string;
  };
}

export default function RepayModal({
  isOpen,
  onClose,
  asset,
}: RepayModalProps) {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [isMaxRepay, setIsMaxRepay] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const { repay, isPending, isConfirming, isSuccess, error } = useRepay();
  const { approve, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: isApprovalSuccess, error: approvalError } = useApproveForRepay();
  
  // Get borrow balance (debt)
  const { data: borrowBalanceRaw } = useBorrowBalance(asset.symbol, isConnected);
  
  // Get wallet balance
  const { data: walletBalanceRaw } = useTokenBalance(asset.symbol, isConnected);
  
  // Get allowance for ERC20 tokens
  const { data: allowanceRaw } = useAllowance(asset.symbol, isConnected && needsApproval);
  
  const assetConfig = ConfigService.getAssetConfig(asset.symbol);
  const { data: tokenDecimals } = useTokenDecimals(asset.symbol, isConnected);
  
  // Use contract decimals if available, otherwise fall back to config
  const decimals = tokenDecimals !== undefined ? tokenDecimals : assetConfig?.decimals || 18;
  
  const borrowBalance = borrowBalanceRaw
    ? formatBalance(formatUnits(borrowBalanceRaw, decimals))
    : asset.debt || "0";
  
  const walletBalance = walletBalanceRaw
    ? formatBalance(formatUnits(walletBalanceRaw, decimals))
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

  // Calculate remaining debt after repayment
  const calculateRemainingDebt = () => {
    if (!amount || !borrowBalanceRaw || !assetConfig) {
      const debtUSD = price && borrowBalanceRaw
        ? (Number(formatUnits(borrowBalanceRaw, decimals)) * price).toFixed(2)
        : "0";
      return { asset: borrowBalance, usd: `$${debtUSD}` };
    }
    
    const repayAmount = parseFloat(amount);
    const currentDebt = Number(formatUnits(borrowBalanceRaw, decimals));
    const remaining = Math.max(0, currentDebt - repayAmount);
    const remainingUSD = price ? (remaining * price).toFixed(2) : "0";
    
    return {
      asset: formatBalance(remaining.toString()),
      usd: `$${remainingUSD}`,
    };
  };

  const remainingDebt = calculateRemainingDebt();

  // Handle success - close modal and reset
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        onClose();
        setAmount("");
        setIsMaxRepay(false);
      }, 2000);
    }
  }, [isSuccess, onClose]);

  const handleMax = () => {
    // Set to full debt repayment mode
    setIsMaxRepay(true);
    // Use wallet balance or borrow balance, whichever is smaller
    const maxAmount = Math.min(
      parseFloat(walletBalance),
      borrowBalanceRaw && assetConfig 
        ? Number(formatUnits(borrowBalanceRaw, decimals))
        : parseFloat(borrowBalance)
    );
    setAmount(maxAmount.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setIsMaxRepay(false); // Reset max repay flag when user manually enters amount
    }
  };

  // Check if approval is needed (for ERC20 tokens, not ZTC)
  useEffect(() => {
    if (assetConfig) {
      const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000804";
      setNeedsApproval(assetConfig.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase());
    }
  }, [assetConfig]);

  // Check if current allowance is sufficient
  const currentAllowance = allowanceRaw && assetConfig 
    ? Number(formatUnits(allowanceRaw, decimals))
    : 0;
  
  const requiredAmount = parseFloat(amount || "0");
  // For max repay, we need slightly more approval to account for interest accrual
  // Add 0.1% buffer to the approval amount
  const approvalAmount = isMaxRepay ? requiredAmount * 1.001 : requiredAmount;
  const hasValidApproval = !needsApproval || currentAllowance >= approvalAmount;

  const handleApprove = async () => {
    if (!isValidAmount || !assetConfig) return;
    try {
      // Approve with buffer for max repay to account for interest accrual
      const amountToApprove = isMaxRepay ? (parseFloat(amount) * 1.001).toString() : amount;
      await approve(asset.symbol, amountToApprove);
    } catch (err) {
      console.error("Approval error:", err);
    }
  };

  const handleRepay = async () => {
    if (!isValidAmount || !assetConfig) return;
    try {
      // If user clicked MAX, use "0" to repay full debt including accrued interest
      await repay(asset.symbol, isMaxRepay ? "0" : amount);
    } catch (err) {
      console.error("Repay error:", err);
    }
  };

  const isValidAmount = amount && parseFloat(amount) > 0;
  const isLoading = isPending || isConfirming || isApproving || isApprovingConfirming;
  
  // Get borrow APY from config
  const borrowAPY = assetConfig ? formatAPY(assetConfig.borrowAPY) : asset.borrowAPY || "0.00%";
  
  // Calculate current debt USD
  const currentDebtUSD = price && borrowBalanceRaw && assetConfig
    ? formatUSD(Number(formatUnits(borrowBalanceRaw, decimals)) * price)
    : asset.debtUSD || "$0";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#0f1422] rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Repay {asset.symbol}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm text-gray-400">Amount</label>
              <button
                className="text-gray-400 hover:text-white transition-colors cursor-help"
                title="Enter the amount you want to repay"
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
                  <p className="text-sm text-gray-400">Wallet balance {walletBalance}</p>
                  <button
                    onClick={handleMax}
                    className="px-2 py-1 text-xs font-medium text-gradient-zen hover:opacity-80 transition-all duration-300"
                  >
                    MAX
                  </button>
                </div>
              </div>
              {isMaxRepay && (
                <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-xs text-green-400">
                    ✓ Full debt repayment mode - All accrued interest will be included
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Transaction overview</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-400 mb-1">Remaining debt</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white">
                    <span className={amount ? "text-gray-500" : ""}>{borrowBalance} {asset.symbol}</span>
                    {amount && <span className="text-white"> → {remainingDebt.asset} {asset.symbol}</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-gray-400">
                    <span className={amount ? "text-gray-500" : ""}>{currentDebtUSD}</span>
                    {amount && <span className="text-gray-400"> → {remainingDebt.usd}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400">Borrow APY</p>
                  <button
                    className="text-gray-400 hover:text-white transition-colors cursor-help"
                    title="Annual Percentage Yield for borrowing this asset"
                    aria-label="APY info"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm font-medium text-white">{borrowAPY}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">Health factor</p>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-400">
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
                <p className="text-sm font-medium text-gray-500">&lt; $0.01</p>
              </div>
            </div>
          </div>

          {/* Two-step process for ERC20 tokens */}
          {needsApproval && !hasValidApproval ? (
            <button
              onClick={handleApprove}
              disabled={!isValidAmount || isApproving || isApprovingConfirming}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                isValidAmount && !isApproving && !isApprovingConfirming
                  ? "bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-white cursor-pointer hover-glow"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isApproving || isApprovingConfirming
                ? isApprovingConfirming
                  ? "Confirming Approval..."
                  : "Approving..."
                : isValidAmount
                ? `Approve ${asset.symbol}`
                : "Enter an amount"}
            </button>
          ) : (
            <button
              onClick={handleRepay}
              disabled={!isValidAmount || isPending || isConfirming || (needsApproval && !hasValidApproval)}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                isValidAmount && !isPending && !isConfirming && (!needsApproval || hasValidApproval)
                  ? "bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white cursor-pointer hover-glow"
                  : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isPending || isConfirming
                ? isConfirming
                  ? "Confirming..."
                  : "Processing..."
                : isSuccess
                ? "Success!"
                : needsApproval && !hasValidApproval
                ? "Approve first"
                : isValidAmount
                ? isMaxRepay ? "Repay Full Debt" : "Repay"
                : "Enter an amount"}
            </button>
          )}
          
          {/* Success Messages */}
          {((isApprovalSuccess && needsApproval) || hasValidApproval) && needsApproval && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400">
                ✓ Approval sufficient! You can now repay your loan.
                {currentAllowance > 0 && (
                  <span className="block text-xs text-gray-400 mt-1">
                    Approved: {formatBalance(currentAllowance)} {asset.symbol}
                  </span>
                )}
              </p>
            </div>
          )}
          
          {/* Error Messages */}
          {approvalError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                Approval failed: {approvalError.message || "Please try again."}
              </p>
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                Repay failed: {error.message || "Please try again."}
              </p>
            </div>
          )}
          
          {/* Success Message */}
          {isSuccess && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400">
                Successfully repaid {amount} {asset.symbol}!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

