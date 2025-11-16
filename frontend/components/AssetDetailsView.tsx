"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Info, Copy, ExternalLink, Fuel, Check } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";
import SupplyModal from "./SupplyModal";
import WithdrawModal from "./WithdrawModal";
import BorrowModal from "./BorrowModal";
import RepayModal from "./RepayModal";
import APYChart from "./APYChart";
import BorrowAPYChart from "./BorrowAPYChart";
import { useAssetDetails } from "@/hooks/useAssetDetails";
import { useHealthFactor, useTokenBalance, useSupplyBalance, useAvailableBorrow, useBorrowBalance, usePriceFromOracle, useBorrow, useSupply, useWithdraw, useRepay, useApproveForRepay, useAllowance } from "@/hooks/useContract";
import { ConfigService } from "@/services/configService";
import { formatUSD, formatBalance } from "@/utils/format";
import { formatUnits } from "viem";
import { getContractAddress } from "@/config/contracts";
import { useTokenDecimals } from "@/hooks/useBalance";

interface AssetDetailsViewProps {
  assetSymbol: string;
}

export default function AssetDetailsView({ assetSymbol }: AssetDetailsViewProps) {
  const { isConnected } = useAccount();
  
  // Check if asset exists in config first
  const assetConfig = ConfigService.getAssetConfig(assetSymbol);
  if (!assetConfig) {
    return (
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-white text-lg">Asset {assetSymbol} not found</p>
          <Link href="/markets" className="text-green-400 hover:text-green-300 mt-4 inline-block">
            Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  const assetDetails = useAssetDetails(assetSymbol);

  // Fallback if asset details are not available (e.g., contract addresses not configured)
  if (!assetDetails) {
    return (
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-white text-lg mb-2">Contract addresses not configured</p>
          <p className="text-gray-400 text-sm mb-4">
            Please set contract addresses in your .env.local file or deploy contracts first.
          </p>
          <Link href="/markets" className="text-green-400 hover:text-green-300 mt-4 inline-block">
            Back to Markets
          </Link>
        </div>
      </div>
    );
  }

  const asset = assetDetails.asset;
  const [activeTab, setActiveTab] = useState<"supply" | "withdraw" | "borrow" | "repay">("supply");
  const [timeRange, setTimeRange] = useState<"30D" | "6M" | "1Y">("30D");
  const [showInfo, setShowInfo] = useState<"supply" | "borrow" | null>(null);

  // Form state for each action
  const [supplyAmount, setSupplyAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  
  // Repay approval state
  const [repayNeedsApproval, setRepayNeedsApproval] = useState(false);

  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  // Get real-time user data
  const { data: healthFactorData } = useHealthFactor(isConnected);
  const { data: walletBalanceRaw } = useTokenBalance(assetSymbol, isConnected);
  const { data: supplyBalanceRaw } = useSupplyBalance(assetSymbol, isConnected);
  const { data: availableBorrowRaw } = useAvailableBorrow(assetSymbol, isConnected);
  const { data: borrowBalanceRaw } = useBorrowBalance(assetSymbol, isConnected);
  const { price } = usePriceFromOracle(assetSymbol, isConnected);
  const { data: tokenDecimals } = useTokenDecimals(assetSymbol, isConnected);

  // Use contract decimals if available, otherwise fall back to config
  const decimals = tokenDecimals !== undefined ? tokenDecimals : asset.decimals;

  // Add transaction hooks
  const { borrow, isPending: isBorrowPending, isConfirming: isBorrowConfirming, isSuccess: isBorrowSuccess, error: borrowError } = useBorrow();
  const { supply, isPending: isSupplyPending, isConfirming: isSupplyConfirming, isSuccess: isSupplySuccess, error: supplyError } = useSupply();
  const { withdraw, isPending: isWithdrawPending, isConfirming: isWithdrawConfirming, isSuccess: isWithdrawSuccess, error: withdrawError } = useWithdraw();
  const { repay, isPending: isRepayPending, isConfirming: isRepayConfirming, isSuccess: isRepaySuccess, error: repayError } = useRepay();
  const { approve: approveForRepay, isPending: isRepayApproving, isConfirming: isRepayApprovingConfirming, isSuccess: isRepayApprovalSuccess, error: repayApprovalError } = useApproveForRepay();
  
  // Get allowance for repay (only for ERC20 tokens)
  const { data: allowanceRaw } = useAllowance(assetSymbol, isConnected);

  // Format balances
  const walletBalance = walletBalanceRaw ? formatBalance(formatUnits(walletBalanceRaw, decimals)) : "0.00";
  const supplyBalance = supplyBalanceRaw ? formatBalance(formatUnits(supplyBalanceRaw, decimals)) : "0.00";
  const availableBorrow = availableBorrowRaw ? formatBalance(formatUnits(availableBorrowRaw, decimals)) : "0.00";
  const borrowBalance = borrowBalanceRaw ? formatBalance(formatUnits(borrowBalanceRaw, decimals)) : "0.00";

  // Calculate health factor
  const healthFactor = useMemo(() => {
    if (!healthFactorData) return "∞";
    const hf = Number(healthFactorData);
    if (hf === Number.MAX_SAFE_INTEGER || hf > 1e18) return "∞";
    return (hf / 1e18).toFixed(2);
  }, [healthFactorData]);

  const assetAddress = asset.address;
  const explorerUrl = `https://zentrace.io/address/${assetAddress}`;
  
  // Check if approval is needed for repay (for ERC20 tokens, not ZTC)
  useEffect(() => {
    const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000804";
    setRepayNeedsApproval(asset.address.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase());
  }, [asset.address]);

  // Check if current allowance is sufficient for repay
  const currentAllowance = allowanceRaw && asset 
    ? Number(formatUnits(allowanceRaw, decimals))
    : 0;
  
  const requiredRepayAmount = parseFloat(repayAmount || "0");
  const hasValidRepayApproval = !repayNeedsApproval || currentAllowance >= requiredRepayAmount;
  
  // Calculate USD values
  const supplyAmountUSD = useMemo(() => {
    if (!supplyAmount || !price) return "$0.00";
    return formatUSD(parseFloat(supplyAmount) * price);
  }, [supplyAmount, price]);

  const withdrawAmountUSD = useMemo(() => {
    if (!withdrawAmount || !price) return "$0.00";
    return formatUSD(parseFloat(withdrawAmount) * price);
  }, [withdrawAmount, price]);

  const borrowAmountUSD = useMemo(() => {
    if (!borrowAmount || !price) return "$0.00";
    return formatUSD(parseFloat(borrowAmount) * price);
  }, [borrowAmount, price]);

  const repayAmountUSD = useMemo(() => {
    if (!repayAmount || !price) return "$0.00";
    return formatUSD(parseFloat(repayAmount) * price);
  }, [repayAmount, price]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(assetAddress);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  // Handler functions for direct action execution (without modals)
  const handleSupply = async () => {
    if (!supplyAmount || parseFloat(supplyAmount) <= 0 || parseFloat(supplyAmount) > parseFloat(walletBalance)) {
      return;
    }
    
    try {
      await supply(assetSymbol, supplyAmount);
      // Form will be reset in useEffect when success occurs
    } catch (err) {
      console.error("Supply error:", err);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(supplyBalance)) {
      return;
    }
    
    try {
      await withdraw(assetSymbol, withdrawAmount);
      // Form will be reset in useEffect when success occurs
    } catch (err) {
      console.error("Withdraw error:", err);
    }
  };

  const handleBorrow = async () => {
    if (!borrowAmount || parseFloat(borrowAmount) <= 0 || parseFloat(borrowAmount) > parseFloat(availableBorrow)) {
      return;
    }
    
    try {
      await borrow(assetSymbol, borrowAmount);
      // Reset form after successful transaction
      setBorrowAmount("");
    } catch (err) {
      console.error("Borrow error:", err);
    }
  };

  const handleBorrowMax = () => {
    setBorrowAmount(availableBorrow);
  };

  // Handle success - reset form after success message is shown
  useEffect(() => {
    if (isBorrowSuccess) {
      const timer = setTimeout(() => {
        setBorrowAmount("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isBorrowSuccess]);

  useEffect(() => {
    if (isSupplySuccess) {
      const timer = setTimeout(() => {
        setSupplyAmount("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSupplySuccess]);

  useEffect(() => {
    if (isWithdrawSuccess) {
      const timer = setTimeout(() => {
        setWithdrawAmount("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isWithdrawSuccess]);

  useEffect(() => {
    if (isRepaySuccess) {
      const timer = setTimeout(() => {
        setRepayAmount("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isRepaySuccess]);

  const handleRepayApprove = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0 || !asset) return;
    
    try {
      await approveForRepay(assetSymbol, repayAmount);
    } catch (err) {
      console.error("Approval error:", err);
    }
  };

  const handleRepay = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0 || parseFloat(repayAmount) > parseFloat(borrowBalance)) {
      return;
    }
    
    try {
      await repay(assetSymbol, repayAmount);
      // Form will be reset in useEffect when success occurs
    } catch (err) {
      console.error("Repay error:", err);
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-6 text-sm animate-fade-in">
        <Link
          href="/markets"
          className="text-gray-400 hover:text-gradient-zen transition-colors duration-300"
        >
          Markets
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-white">{asset.symbol}</span>
      </div>

      {/* Asset Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link
            href="/markets"
            className="p-2 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:via-green-400/10 hover:to-cyan-400/10 rounded-lg transition-all duration-300 text-gray-400 hover:text-green-400 border border-transparent hover:border-green-400/30"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 flex items-center justify-center text-2xl border-2 border-green-400/50 shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-110">
            {asset.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              <span className="text-white">{asset.name}</span>{" "}
              <span className="text-gradient-zen">(ZenChain Testnet Market)</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 text-green-300 text-[10px] font-medium rounded-full border border-green-400/30 animate-pulse-glow">
                TESTNET
              </span>
              <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 text-cyan-300 text-[10px] font-medium rounded-full border border-cyan-400/30">
                V3
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAddress}
              className="p-2 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:via-green-400/10 hover:to-cyan-400/10 rounded-lg transition-all duration-300 text-gray-400 hover:text-green-400 border border-transparent hover:border-green-400/30"
              title={showCopied ? "Copied!" : "Copy address"}
            >
              {showCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gradient-to-r hover:from-yellow-400/10 hover:via-green-400/10 hover:to-cyan-400/10 rounded-lg transition-all duration-300 text-gray-400 hover:text-green-400 border border-transparent hover:border-green-400/30"
              title="View on explorer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in">
          <p className="text-gray-400 text-[11px] mb-1">Supply</p>
          <p className="text-sm font-medium text-white">{assetDetails.supply.usd}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <p className="text-gray-400 text-[11px] mb-1">Liquidity</p>
          <p className="text-sm font-medium text-white">{assetDetails.liquidity.usd}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-1 mb-1">
            <p className="text-gray-400 text-[11px]">Max LTV</p>
            <button
              className="text-gray-400 hover:text-green-400 transition-colors duration-300 cursor-help"
              title="Maximum Loan-to-Value ratio"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm font-medium text-white">{assetDetails.maxLTV}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p className="text-gray-400 text-[11px] mb-1">Utilization rate</p>
          <p className="text-sm font-medium text-white">{assetDetails.utilizationRate}</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-gray-400 text-[11px] mb-1">Price</p>
          <p className="text-sm font-medium text-white">{assetDetails.price}</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-yellow-400/10 via-green-400/10 to-cyan-400/10 border border-green-400/30 rounded-xl p-4 mb-6 animate-fade-in hover:border-green-400/50 transition-all duration-300">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300 flex-1">
            Supplying {asset.symbol} to the ZenChain Testnet Market pool will enable you to borrow tokens from this pool exclusively.{" "}
            <button className="text-gradient-zen hover:opacity-80 transition-all duration-300 underline">
              Show all markets
            </button>
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Info Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supply Info */}
          <div
            className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-green-400/30 cursor-pointer transition-all duration-300 hover-glow animate-fade-in"
            onClick={() => setShowInfo(showInfo === "supply" ? null : "supply")}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                <span className="text-white">Supply</span>{" "}
                <span className="text-gradient-zen">info</span>
              </h3>
            </div>

            {/* APY Chart */}
            <div className="mb-6">
              <APYChart assetAddress={asset.address} assetSymbol={asset.symbol} />
            </div>

            {showInfo === "supply" && (
              <div className="space-y-6">
                {/* Circular Progress */}
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="44"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-white/10"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="44"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(parseFloat(assetDetails.utilizationRate.replace("%", "")) * 2 * Math.PI * 44) / 100} ${2 * Math.PI * 44}`}
                        className="text-blue-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{assetDetails.utilizationRate}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total supplied</p>
                    <p className="text-white text-lg font-semibold">
                      {assetDetails.totalSupplied.usd}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {assetDetails.totalSupplied.amount} {asset.symbol}
                    </p>
                  </div>
                </div>

                {/* APY Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Supply APY</p>
                    <p className="text-white text-lg font-semibold">{assetDetails.supplyAPY}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Current APY</p>
                    <p className="text-white text-lg font-semibold">{assetDetails.supplyAPY}</p>
                  </div>
                </div>

                {/* Placeholder for Graph */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 h-48 flex items-center justify-center">
                  <p className="text-gray-500 text-sm">Supply APY Chart ({timeRange})</p>
                </div>
              </div>
            )}
          </div>

          {/* Borrow Info */}
          <div
            className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-green-400/30 cursor-pointer transition-all duration-300 hover-glow animate-fade-in"
            onClick={() => setShowInfo(showInfo === "borrow" ? null : "borrow")}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                <span className="text-white">Borrow</span>{" "}
                <span className="text-gradient-zen">info</span>
              </h3>
            </div>

            {/* Borrow APY Chart */}
            <div className="mb-6">
              <BorrowAPYChart assetAddress={asset.address} assetSymbol={asset.symbol} />
            </div>

            {showInfo === "borrow" && (
              <div className="space-y-6">
                {/* Circular Progress */}
                {assetDetails.totalBorrowed.amount !== "-" && (
                  <>
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="44"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-white/10"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="44"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${(parseFloat(assetDetails.utilizationRate.replace("%", "")) * 2 * Math.PI * 44) / 100} ${2 * Math.PI * 44}`}
                            className="text-red-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">{assetDetails.utilizationRate}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Total borrowed</p>
                        <p className="text-white text-lg font-semibold">
                          {assetDetails.totalBorrowed.usd} / {assetDetails.totalSupplied.usd}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {assetDetails.totalBorrowed.amount} / {assetDetails.totalSupplied.amount} {asset.symbol}
                        </p>
                      </div>
                    </div>

                    {/* Borrow Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Borrow APY</p>
                        <p className="text-white text-lg font-semibold">
                          {assetDetails.borrowAPY}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Current APY</p>
                        <p className="text-white text-lg font-semibold">{assetDetails.borrowAPY}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Liquidation Threshold</p>
                        <p className="text-white text-lg font-semibold">{assetDetails.liquidationThreshold}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Reserve Factor</p>
                        <p className="text-white text-lg font-semibold">{assetDetails.reserveFactor}</p>
                      </div>
                    </div>

                    {/* Placeholder for Graph */}
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10 h-48 flex items-center justify-center">
                      <p className="text-gray-500 text-sm">Borrow APY Chart ({timeRange})</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Interest Rate Model */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4">
              <span className="text-white">Interest Rate</span>{" "}
              <span className="text-gradient-zen">Model</span>
            </h3>
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-400">Utilization rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-400">Borrow APY</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-400">Supply APY</span>
                </div>
              </div>

              {/* Placeholder for Graph */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 h-64 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2">Interest Rate Model Chart</p>
                  <p className="text-gray-600 text-xs">Current ({assetDetails.utilizationRate})</p>
                </div>
              </div>
            </div>
          </div>

          {/* Market Info */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4">
              <span className="text-white">Market</span>{" "}
              <span className="text-gradient-zen">info</span>
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-gray-400 text-sm"># of suppliers</p>
                <p className="text-white text-sm font-medium">{assetDetails.marketInfo.suppliers}</p>
              </li>
              <li className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-gray-400 text-sm"># of borrowers</p>
                <p className="text-white text-sm font-medium">{assetDetails.marketInfo.borrowers}</p>
              </li>
              <li className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-gray-400 text-sm">Daily supplying interests</p>
                <p className="text-white text-sm font-medium">{assetDetails.marketInfo.dailySupplyInterest}</p>
              </li>
              <li className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-gray-400 text-sm">Daily borrowing interests</p>
                <p className="text-white text-sm font-medium">{assetDetails.marketInfo.dailyBorrowInterest}</p>
              </li>
              <li className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-gray-400 text-sm">Reserve factor</p>
                <p className="text-white text-sm font-medium">{assetDetails.reserveFactor}</p>
              </li>
              <li className="flex items-center justify-between py-2">
                <p className="text-gray-400 text-sm">Exchange rate</p>
                <p className="text-white text-sm font-medium">{assetDetails.marketInfo.exchangeRate}</p>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column - Action Panel */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-green-400/30 transition-all duration-300 hover-glow animate-fade-in">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-white/10">
            {[
              { id: "supply" as const, label: "Supply" },
              { id: "withdraw" as const, label: "Withdraw" },
              { id: "borrow" as const, label: "Borrow" },
              { id: "repay" as const, label: "Repay" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-all duration-300 border-b-2 ${
                  activeTab === tab.id
                    ? "text-white border-green-400"
                    : "text-gray-400 border-transparent hover:text-green-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* E-Mode Banner (optional) */}
          {activeTab === "borrow" && (
            <div className="bg-gradient-to-r from-yellow-400/10 via-green-400/10 to-cyan-400/10 border border-green-400/30 rounded-xl p-4 mb-6 flex items-center justify-between hover:border-green-400/50 transition-all duration-300 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 flex items-center justify-center border border-green-400/30">
                  <span className="text-lg">📊</span>
                </div>
                <p className="text-sm text-gray-300">Boost your borrowing power with E-Mode</p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-yellow-400/20 via-green-400/20 to-cyan-400/20 hover:from-yellow-400/30 hover:via-green-400/30 hover:to-cyan-400/30 text-green-300 text-xs font-medium rounded transition-all duration-300 border border-green-400/30 hover:border-green-400/50 hover-glow">
                Explore
              </button>
            </div>
          )}

          {/* Action Forms */}
          <div className="space-y-4">
            {activeTab === "supply" && (
              <div className="space-y-4">
                <div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <input
                      type="text"
                      value={supplyAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setSupplyAmount(value);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl font-semibold text-white placeholder-gray-500 outline-none mb-2"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        {supplyAmountUSD}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 flex items-center justify-center text-sm border border-green-400/30 shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-110">
                          {asset.icon}
                        </div>
                        <span className="text-sm font-medium text-white">{asset.symbol}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-400">Wallet balance {walletBalance}</p>
                    <button
                      onClick={() => setSupplyAmount(walletBalance)}
                      disabled={!isConnected}
                      className={`px-2 py-1 text-xs font-medium transition-all duration-300 ${
                        isConnected 
                          ? "text-gradient-zen hover:opacity-80 cursor-pointer" 
                          : "text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Supply APY</p>
                    <p className="text-sm font-medium text-white">{assetDetails.supplyAPY}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Collateralization</p>
                    <p className="text-sm font-medium text-green-400">Enabled</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Health factor</p>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{healthFactor}</p>
                      <p className="text-xs text-gray-500">Liquidation at &lt;1.0</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-400">Gas estimation</p>
                    </div>
                    <p className="text-sm font-medium text-gray-500">-</p>
                  </div>
                </div>

                <button
                  onClick={handleSupply}
                  disabled={
                    !isConnected ||
                    !supplyAmount || 
                    parseFloat(supplyAmount) <= 0 || 
                    parseFloat(supplyAmount) > parseFloat(walletBalance) ||
                    isSupplyPending ||
                    isSupplyConfirming
                  }
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                    isConnected && 
                    supplyAmount && 
                    parseFloat(supplyAmount) > 0 && 
                    parseFloat(supplyAmount) <= parseFloat(walletBalance) &&
                    !isSupplyPending &&
                    !isSupplyConfirming
                      ? "bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white cursor-pointer hover-glow"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {!isConnected
                    ? "Connect Wallet"
                    : isSupplyPending || isSupplyConfirming
                    ? isSupplyConfirming
                      ? "Confirming..."
                      : "Processing..."
                    : isSupplySuccess
                    ? "Success!"
                    : !supplyAmount || parseFloat(supplyAmount) <= 0
                    ? "Enter an amount"
                    : parseFloat(supplyAmount) > parseFloat(walletBalance)
                    ? "Insufficient balance"
                    : "Supply"}
                </button>

                {/* Error Message */}
                {supplyError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">
                      {supplyError.message || "Transaction failed. Please try again."}
                    </p>
                  </div>
                )}
                
                {/* Success Message */}
                {isSupplySuccess && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-400">
                      Successfully supplied {supplyAmount} {asset.symbol}!
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "withdraw" && (
              <div className="space-y-4">
                <div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <input
                      type="text"
                      value={withdrawAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setWithdrawAmount(value);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl font-semibold text-white placeholder-gray-500 outline-none mb-2"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        {withdrawAmountUSD}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 flex items-center justify-center text-sm border border-green-400/30 shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-110">
                          {asset.icon}
                        </div>
                        <span className="text-sm font-medium text-white">{asset.symbol}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-400">Supply balance {supplyBalance}</p>
                    <button
                      onClick={() => setWithdrawAmount(supplyBalance)}
                      disabled={!isConnected}
                      className={`px-2 py-1 text-xs font-medium transition-all duration-300 ${
                        isConnected 
                          ? "text-gradient-zen hover:opacity-80 cursor-pointer" 
                          : "text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Supply APY</p>
                    <p className="text-sm font-medium text-white">{assetDetails.supplyAPY}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Collateralization</p>
                    <p className="text-sm font-medium text-green-400">Enabled</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Health factor</p>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{healthFactor}</p>
                      <p className="text-xs text-gray-500">Liquidation at &lt;1.0</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-400">Gas estimation</p>
                    </div>
                    <p className="text-sm font-medium text-gray-500">-</p>
                  </div>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={
                    !isConnected ||
                    !withdrawAmount || 
                    parseFloat(withdrawAmount) <= 0 || 
                    parseFloat(withdrawAmount) > parseFloat(supplyBalance) ||
                    isWithdrawPending ||
                    isWithdrawConfirming
                  }
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                    isConnected && 
                    withdrawAmount && 
                    parseFloat(withdrawAmount) > 0 && 
                    parseFloat(withdrawAmount) <= parseFloat(supplyBalance) &&
                    !isWithdrawPending &&
                    !isWithdrawConfirming
                      ? "bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white cursor-pointer hover-glow"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {!isConnected
                    ? "Connect Wallet"
                    : isWithdrawPending || isWithdrawConfirming
                    ? isWithdrawConfirming
                      ? "Confirming..."
                      : "Processing..."
                    : isWithdrawSuccess
                    ? "Success!"
                    : !withdrawAmount || parseFloat(withdrawAmount) <= 0
                    ? "Enter an amount"
                    : parseFloat(withdrawAmount) > parseFloat(supplyBalance)
                    ? "Amount exceeds supply balance"
                    : "Withdraw"}
                </button>

                {/* Error Message */}
                {withdrawError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">
                      {withdrawError.message || "Transaction failed. Please try again."}
                    </p>
                  </div>
                )}
                
                {/* Success Message */}
                {isWithdrawSuccess && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-400">
                      Successfully withdrew {withdrawAmount} {asset.symbol}!
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "borrow" && (
              <div className="space-y-4">
                <div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <input
                      type="text"
                      value={borrowAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setBorrowAmount(value);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl font-semibold text-white placeholder-gray-500 outline-none mb-2"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        {borrowAmountUSD}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 flex items-center justify-center text-sm border border-green-400/30 shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-110">
                          {asset.icon}
                        </div>
                        <span className="text-sm font-medium text-white">{asset.symbol}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-400">Available {availableBorrow}</p>
                    <button
                      onClick={handleBorrowMax}
                      disabled={!isConnected}
                      className={`px-2 py-1 text-xs font-medium transition-all duration-300 ${
                        isConnected 
                          ? "text-gradient-zen hover:opacity-80 cursor-pointer" 
                          : "text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      SAFE MAX
                    </button>
                  </div>
                </div>

                {/* Show error message if user has insufficient collateral */}
                {availableBorrow === "0.00" && isConnected && (
                  <p className="text-sm text-red-400">
                    You need to supply tokens and enable them as collateral before you can borrow {asset.symbol} from this pool.
                  </p>
                )}

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-300">Transaction overview</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-400">Borrow APY</p>
                      <Info className="w-3 h-3 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-white">{assetDetails.borrowAPY !== "-" ? assetDetails.borrowAPY : "0.00%"}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Health factor</p>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-400">{healthFactor}</p>
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

                {/* Attention Banner */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-300">
                      Attention: Parameter changes via governance can alter your account health factor and risk of liquidation.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleBorrow}
                  disabled={
                    !isConnected ||
                    !borrowAmount || 
                    parseFloat(borrowAmount) <= 0 || 
                    parseFloat(borrowAmount) > parseFloat(availableBorrow) ||
                    isBorrowPending ||
                    isBorrowConfirming
                  }
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                    isConnected && 
                    borrowAmount && 
                    parseFloat(borrowAmount) > 0 && 
                    parseFloat(borrowAmount) <= parseFloat(availableBorrow) &&
                    !isBorrowPending &&
                    !isBorrowConfirming
                      ? "bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white cursor-pointer hover-glow"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {!isConnected
                    ? "Connect Wallet"
                    : isBorrowPending || isBorrowConfirming
                    ? isBorrowConfirming
                      ? "Confirming..."
                      : "Processing..."
                    : isBorrowSuccess
                    ? "Success!"
                    : !borrowAmount || parseFloat(borrowAmount) <= 0
                    ? "Enter an amount"
                    : parseFloat(borrowAmount) > parseFloat(availableBorrow)
                    ? "Amount exceeds available"
                    : "Borrow"}
                </button>

                {/* Error Message */}
                {borrowError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">
                      {borrowError.message || "Transaction failed. Please try again."}
                    </p>
                  </div>
                )}
                
                {/* Success Message */}
                {isBorrowSuccess && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-400">
                      Successfully borrowed {borrowAmount} {asset.symbol}!
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "repay" && (
              <div className="space-y-4">
                <div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <input
                      type="text"
                      value={repayAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setRepayAmount(value);
                        }
                      }}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl font-semibold text-white placeholder-gray-500 outline-none mb-2"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-400">
                        {repayAmountUSD}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400/20 via-green-400/20 to-cyan-400/20 flex items-center justify-center text-sm border border-green-400/30 shadow-lg shadow-green-500/20 transition-all duration-300 hover:scale-110">
                          {asset.icon}
                        </div>
                        <span className="text-sm font-medium text-white">{asset.symbol}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-400">Borrow balance {borrowBalance}</p>
                    <button
                      onClick={() => setRepayAmount(borrowBalance)}
                      disabled={!isConnected}
                      className={`px-2 py-1 text-xs font-medium transition-all duration-300 ${
                        isConnected 
                          ? "text-gradient-zen hover:opacity-80 cursor-pointer" 
                          : "text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Borrow APY</p>
                    <p className="text-sm font-medium text-white">{assetDetails.borrowAPY !== "-" ? assetDetails.borrowAPY : "0.00%"}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">Health factor</p>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{healthFactor}</p>
                      <p className="text-xs text-gray-500">Liquidation at &lt;1.0</p>
                    </div>
                  </div>
                </div>

                {/* Two-step process for ERC20 tokens */}
                {repayNeedsApproval && !hasValidRepayApproval ? (
                  <button
                    onClick={handleRepayApprove}
                    disabled={
                      !isConnected ||
                      !repayAmount || 
                      parseFloat(repayAmount) <= 0 || 
                      isRepayApproving || 
                      isRepayApprovingConfirming
                    }
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      isConnected && 
                      repayAmount && 
                      parseFloat(repayAmount) > 0 &&
                      !isRepayApproving &&
                      !isRepayApprovingConfirming
                        ? "bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-white cursor-pointer hover-glow"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {!isConnected
                      ? "Connect Wallet"
                      : isRepayApproving || isRepayApprovingConfirming
                      ? isRepayApprovingConfirming
                        ? "Confirming Approval..."
                        : "Approving..."
                      : !repayAmount || parseFloat(repayAmount) <= 0
                      ? "Enter an amount"
                      : `Approve ${asset.symbol}`}
                  </button>
                ) : (
                  <button
                    onClick={handleRepay}
                    disabled={
                      !isConnected ||
                      !repayAmount || 
                      parseFloat(repayAmount) <= 0 || 
                      parseFloat(repayAmount) > parseFloat(borrowBalance) ||
                      isRepayPending ||
                      isRepayConfirming ||
                      (repayNeedsApproval && !hasValidRepayApproval)
                    }
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                      isConnected && 
                      repayAmount && 
                      parseFloat(repayAmount) > 0 && 
                      parseFloat(repayAmount) <= parseFloat(borrowBalance) &&
                      !isRepayPending &&
                      !isRepayConfirming &&
                      (!repayNeedsApproval || hasValidRepayApproval)
                        ? "bg-gradient-to-r from-yellow-400 via-green-400 to-cyan-400 hover:from-yellow-500 hover:via-green-500 hover:to-cyan-500 text-white cursor-pointer hover-glow"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {!isConnected
                      ? "Connect Wallet"
                      : isRepayPending || isRepayConfirming
                      ? isRepayConfirming
                        ? "Confirming..."
                        : "Processing..."
                      : isRepaySuccess
                      ? "Success!"
                      : !repayAmount || parseFloat(repayAmount) <= 0
                      ? "Enter an amount"
                      : parseFloat(repayAmount) > parseFloat(borrowBalance)
                      ? "Amount exceeds borrow balance"
                      : repayNeedsApproval && !hasValidRepayApproval
                      ? "Approve first"
                      : "Repay"}
                  </button>
                )}

                {/* Approval Success Message */}
                {((isRepayApprovalSuccess && repayNeedsApproval) || hasValidRepayApproval) && repayNeedsApproval && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-400">
                      ✓ Approval sufficient! You can now repay your loan.
                      {currentAllowance > 0 && (
                        <span className="block text-xs text-gray-400 mt-1">
                          Approved: {formatBalance(currentAllowance.toString())} {asset.symbol}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Error Messages */}
                {repayApprovalError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">
                      Approval failed: {repayApprovalError.message || "Please try again."}
                    </p>
                  </div>
                )}
                {repayError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">
                      Repay failed: {repayError.message || "Please try again."}
                    </p>
                  </div>
                )}
                
                {/* Success Message */}
                {isRepaySuccess && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-400">
                      Successfully repaid {repayAmount} {asset.symbol}!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <SupplyModal
        isOpen={supplyModalOpen}
        onClose={() => setSupplyModalOpen(false)}
        asset={{
          symbol: asset.symbol,
          name: asset.name,
          icon: (asset.icon as string) || "💰",
          balance: walletBalance,
          balanceUSD: price ? formatUSD(Number(walletBalance) * price) : "$0.00",
          apy: assetDetails.supplyAPY,
          healthFactor: healthFactor,
        }}
      />
      <WithdrawModal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        asset={{
          symbol: asset.symbol,
          name: asset.name,
          icon: (asset.icon as string) || "💰",
          balance: supplyBalance,
          balanceUSD: price ? formatUSD(Number(supplyBalance) * price) : "$0.00",
          apy: assetDetails.supplyAPY,
          healthFactor: healthFactor,
        }}
      />
      {borrowModalOpen && (
        <BorrowModal
          isOpen={borrowModalOpen}
          onClose={() => setBorrowModalOpen(false)}
          asset={{
            symbol: asset.symbol,
            name: asset.name,
            icon: (asset.icon as string) || "💰",
            borrowAPY: assetDetails.borrowAPY !== "-" ? assetDetails.borrowAPY : "0.00%",
            healthFactor: healthFactor,
          }}
        />
      )}
      {repayModalOpen && (
        <RepayModal
          isOpen={repayModalOpen}
          onClose={() => setRepayModalOpen(false)}
          asset={{
            symbol: asset.symbol,
            name: asset.name,
            icon: (asset.icon as string) || "💰",
            borrowAPY: assetDetails.borrowAPY !== "-" ? assetDetails.borrowAPY : "0.00%",
            healthFactor: healthFactor,
          }}
        />
      )}
    </div>
  );
}

