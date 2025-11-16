"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, formatUnits, getAddress } from "viem";
import { ConfigService } from "@/services/configService";
import { getContractAddress } from "@/config/contracts";
import { formatUSD } from "@/utils/format";

const ORACLE_ABI = [
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface Transaction {
  id: string;
  type: "supply" | "withdraw" | "borrow" | "repay";
  asset: string;
  amount: string;
  amountUSD: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  hash: string;
  blockNumber?: bigint;
  gasUsed?: string;
  gasPrice?: string;
}

// Pool contract events we want to track (matching actual ZenFinancePool contract events)
const POOL_EVENTS = {
  Supply: parseAbiItem("event Supply(address indexed user, address indexed asset, uint256 amount, uint256 aTokenAmount, uint256 timestamp)"),
  Withdraw: parseAbiItem("event Withdraw(address indexed user, address indexed asset, uint256 amount, uint256 timestamp)"),
  Borrow: parseAbiItem("event Borrow(address indexed user, address indexed asset, uint256 amount, uint256 loanId, uint256 timestamp)"),
  Repay: parseAbiItem("event Repay(address indexed user, address indexed asset, uint256 amount, uint256 timestamp)")
};

export function useTransactionHistory() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const getAssetSymbol = (assetAddress: string): string => {
    const assets = ConfigService.getAllAssets();
    const asset = assets.find(a => a.address.toLowerCase() === assetAddress.toLowerCase());
    return asset?.symbol || "UNKNOWN";
  };

  const fetchAssetPrice = async (assetSymbol: string): Promise<number> => {
    try {
      const oracleAddress = getContractAddress("oracle");
      if (!oracleAddress || !publicClient) return 0;

      const assetConfig = ConfigService.getAssetConfig(assetSymbol);
      if (!assetConfig) return 0;

      const price = await publicClient.readContract({
        address: oracleAddress as `0x${string}`,
        abi: ORACLE_ABI,
        functionName: "getPrice",
        args: [assetConfig.address as `0x${string}`],
      }) as bigint;

      return Number(formatUnits(price, 18));
    } catch (error) {
      console.warn(`Failed to fetch price for ${assetSymbol}:`, error);
      return 0;
    }
  };

  const fetchTransactionHistory = async () => {
    if (!address || !publicClient || !isConnected) {
      setTransactions([]);
      setHasInitialized(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const poolAddress = getContractAddress("pool");
      if (!poolAddress) {
        setError("Pool contract address not configured. Please check your environment configuration.");
        return;
      }

      // Get the current block number
      const currentBlock = await publicClient.getBlockNumber();
      
      // Look back 1,000 blocks (approximately 2-3 hours) to avoid timeout
      const fromBlock = currentBlock - 1000n > 0n ? currentBlock - 1000n : 1n;

      const userAddress = getAddress(address);

      // Fetch all relevant events for this user with timeout
      const fetchWithTimeout = (promise: Promise<any>, timeout = 8000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Query timeout - try connecting to a faster RPC endpoint')), timeout)
          )
        ]);
      };

      const [supplyLogs, withdrawLogs, borrowLogs, repayLogs] = await Promise.all([
        fetchWithTimeout(publicClient.getLogs({
          address: poolAddress as `0x${string}`,
          event: POOL_EVENTS.Supply,
          fromBlock,
          toBlock: 'latest',
          args: {
            user: userAddress
          }
        })),
        fetchWithTimeout(publicClient.getLogs({
          address: poolAddress as `0x${string}`,
          event: POOL_EVENTS.Withdraw,
          fromBlock,
          toBlock: 'latest',
          args: {
            user: userAddress
          }
        })),
        fetchWithTimeout(publicClient.getLogs({
          address: poolAddress as `0x${string}`,
          event: POOL_EVENTS.Borrow,
          fromBlock,
          toBlock: 'latest',
          args: {
            user: userAddress
          }
        })),
        fetchWithTimeout(publicClient.getLogs({
          address: poolAddress as `0x${string}`,
          event: POOL_EVENTS.Repay,
          fromBlock,
          toBlock: 'latest',
          args: {
            user: userAddress
          }
        }))
      ]);

      // Process all logs into transactions
      const allTransactions: Transaction[] = [];

      // Process Supply events
      for (const log of supplyLogs) {
        const assetSymbol = getAssetSymbol(log.args.asset!);
        const assetConfig = ConfigService.getAssetConfig(assetSymbol);
        const amount = assetConfig 
          ? formatUnits(log.args.amount!, assetConfig.decimals)
          : log.args.amount!.toString();

        allTransactions.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          type: "supply",
          asset: assetSymbol,
          amount,
          amountUSD: "$0.00", // TODO: Calculate USD value using price oracle
          timestamp: log.args.timestamp ? Number(log.args.timestamp) * 1000 : 0,
          status: "confirmed",
          hash: log.transactionHash!,
          blockNumber: log.blockNumber
        });
      }

      // Process Withdraw events
      for (const log of withdrawLogs) {
        const assetSymbol = getAssetSymbol(log.args.asset!);
        const assetConfig = ConfigService.getAssetConfig(assetSymbol);
        const amount = assetConfig 
          ? formatUnits(log.args.amount!, assetConfig.decimals)
          : log.args.amount!.toString();

        allTransactions.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          type: "withdraw",
          asset: assetSymbol,
          amount,
          amountUSD: "$0.00",
          timestamp: log.args.timestamp ? Number(log.args.timestamp) * 1000 : 0,
          status: "confirmed",
          hash: log.transactionHash!,
          blockNumber: log.blockNumber
        });
      }

      // Process Borrow events
      for (const log of borrowLogs) {
        const assetSymbol = getAssetSymbol(log.args.asset!);
        const assetConfig = ConfigService.getAssetConfig(assetSymbol);
        const amount = assetConfig 
          ? formatUnits(log.args.amount!, assetConfig.decimals)
          : log.args.amount!.toString();

        allTransactions.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          type: "borrow",
          asset: assetSymbol,
          amount,
          amountUSD: "$0.00",
          timestamp: log.args.timestamp ? Number(log.args.timestamp) * 1000 : 0,
          status: "confirmed",
          hash: log.transactionHash!,
          blockNumber: log.blockNumber
        });
      }

      // Process Repay events
      for (const log of repayLogs) {
        const assetSymbol = getAssetSymbol(log.args.asset!);
        const assetConfig = ConfigService.getAssetConfig(assetSymbol);
        const amount = assetConfig 
          ? formatUnits(log.args.amount!, assetConfig.decimals)
          : log.args.amount!.toString();

        allTransactions.push({
          id: `${log.transactionHash}-${log.logIndex}`,
          type: "repay",
          asset: assetSymbol,
          amount,
          amountUSD: "$0.00",
          timestamp: log.args.timestamp ? Number(log.args.timestamp) * 1000 : 0,
          status: "confirmed",
          hash: log.transactionHash!,
          blockNumber: log.blockNumber
        });
      }

      // Get block timestamps for all transactions
      const blockNumbers = [...new Set(allTransactions.map(tx => tx.blockNumber!))];
      const blockTimestamps: Record<string, number> = {};

      await Promise.all(
        blockNumbers.map(async (blockNumber) => {
          try {
            const block = await publicClient.getBlock({ blockNumber });
            blockTimestamps[blockNumber.toString()] = Number(block.timestamp) * 1000;
          } catch (err) {
            console.warn(`Failed to get block ${blockNumber}:`, err);
            blockTimestamps[blockNumber.toString()] = Date.now();
          }
        })
      );

      // Fetch prices for all unique assets
      const uniqueAssets = [...new Set(allTransactions.map(tx => tx.asset))];
      const assetPrices: Record<string, number> = {};

      await Promise.all(
        uniqueAssets.map(async (assetSymbol) => {
          const price = await fetchAssetPrice(assetSymbol);
          assetPrices[assetSymbol] = price;
        })
      );

      // Update transactions with timestamps and USD values
      const transactionsWithTimestamps = allTransactions.map(tx => {
        const amountNum = parseFloat(tx.amount);
        const price = assetPrices[tx.asset] || 0;
        const usdValue = amountNum * price;

        return {
          ...tx,
          timestamp: blockTimestamps[tx.blockNumber!.toString()] || Date.now(),
          amountUSD: formatUSD(usdValue)
        };
      });

      // Sort by timestamp (newest first)
      transactionsWithTimestamps.sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(transactionsWithTimestamps);
      setHasInitialized(true);
    } catch (err) {
      console.error("Failed to fetch transaction history:", err);
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          setError("Query timeout. The blockchain network might be slow. Please try again or connect to a faster RPC endpoint.");
        } else if (err.message.includes('getLogs')) {
          setError("Failed to fetch transaction logs. Please check your network connection and try again.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to fetch transactions. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setHasInitialized(true);
    }
  };

  useEffect(() => {
    // Only fetch once when connection state changes
    if (isConnected && address && publicClient && !hasInitialized) {
      fetchTransactionHistory();
    } else if (!isConnected) {
      setTransactions([]);
      setError(null);
      setHasInitialized(false);
    }
  }, [address, isConnected, publicClient, hasInitialized]);

  const refetch = () => {
    setHasInitialized(false);
    fetchTransactionHistory();
  };

  return {
    transactions,
    isLoading,
    error,
    refetch
  };
}