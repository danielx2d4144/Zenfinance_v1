/**
 * React hooks for contract interactions using Wagmi
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getContractAddress, getATokenAddress } from "@/config/contracts";
import { ConfigService } from "@/services/configService";
import { parseUnits, formatUnits, Address } from "viem";
import { useQueryClient } from "@tanstack/react-query";

// Re-export hooks from other files for convenience
export { usePriceFromOracle } from "./usePrice";
export { useTokenBalance } from "./useBalance";

// Contract ABIs
const POOL_ABI = [
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "supply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "supplyNative",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "withdrawNative",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "borrow",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "repay",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "asset", type: "address" },
    ],
    name: "getSupplyBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "asset", type: "address" },
    ],
    name: "getBorrowBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getHealthFactor",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "asset", type: "address" },
    ],
    name: "getAvailableBorrow",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "totalSupplied",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "totalBorrowed",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getActiveSuppliers",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getActiveBorrowers",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const ORACLE_ABI = [
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getPrice",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Hook to get pool contract address
 */
export function usePoolAddress(): Address | undefined {
  const address = getContractAddress("pool");
  if (!address || address === "") {
    return undefined;
  }
  return address as Address;
}

/**
 * Hook to get asset address
 */
export function useAssetAddress(symbol: string): Address | undefined {
  const assetConfig = ConfigService.getAssetConfig(symbol);
  return assetConfig?.address as Address | undefined;
}

/**
 * Hook to get allowance
 */
export function useAllowance(symbol: string, enabled: boolean = true) {
  const { address } = useAccount();
  const assetAddress = useAssetAddress(symbol);
  const poolAddress = usePoolAddress();

  return useReadContract({
    address: assetAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && poolAddress ? [address, poolAddress] : undefined,
    query: {
      enabled: enabled && !!address && !!assetAddress && !!poolAddress,
    },
  });
}

/**
 * Hook to get user's supply balance
 */
export function useSupplyBalance(symbol: string, enabled: boolean = true) {
  const { address } = useAccount();
  const assetAddress = useAssetAddress(symbol);
  const poolAddress = usePoolAddress();

  return useReadContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: "getSupplyBalance",
    args: assetAddress && address ? [address, assetAddress] : undefined,
    query: {
      enabled: enabled && !!address && !!assetAddress && !!poolAddress,
    },
  });
}

/**
 * Hook to get user's borrow balance
 */
export function useBorrowBalance(symbol: string, enabled: boolean = true) {
  const { address } = useAccount();
  const assetAddress = useAssetAddress(symbol);
  const poolAddress = usePoolAddress();

  return useReadContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: "getBorrowBalance",
    args: assetAddress && address ? [address, assetAddress] : undefined,
    query: {
      enabled: enabled && !!address && !!assetAddress && !!poolAddress,
    },
  });
}

/**
 * Hook to get user's health factor
 */
export function useHealthFactor(enabled: boolean = true) {
  const { address } = useAccount();
  const poolAddress = usePoolAddress();

  return useReadContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: "getHealthFactor",
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && !!address && !!poolAddress,
    },
  });
}

/**
 * Hook to get available borrow
 */
export function useAvailableBorrow(symbol: string, enabled: boolean = true) {
  const { address } = useAccount();
  const assetAddress = useAssetAddress(symbol);
  const poolAddress = usePoolAddress();

  return useReadContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: "getAvailableBorrow",
    args: assetAddress && address ? [address, assetAddress] : undefined,
    query: {
      enabled: enabled && !!address && !!assetAddress && !!poolAddress,
    },
  });
}

/**
 * Hook to get total supplied for an asset
 */
export function useTotalSupplied(symbol: string, enabled: boolean = true) {
  const assetAddress = useAssetAddress(symbol);
  const poolAddress = usePoolAddress();

  return useReadContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: "totalSupplied",
    args: assetAddress ? [assetAddress] : undefined,
    query: {
      enabled: enabled && !!assetAddress && !!poolAddress,
    },
  });
}

/**
 * Hook to get total borrowed for an asset
 */
export function useTotalBorrowed(symbol: string, enabled: boolean = true) {
  const assetAddress = useAssetAddress(symbol);
  const poolAddress = usePoolAddress();

  return useReadContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: "totalBorrowed",
    args: assetAddress ? [assetAddress] : undefined,
    query: {
      enabled: enabled && !!assetAddress && !!poolAddress,
    },
  });
}

/**
 * Hook to get number of active suppliers for an asset
 */
export function useActiveSuppliers(symbol: string, enabled: boolean = true) {
  const assetAddress = useAssetAddress(symbol);
  const poolAddress = usePoolAddress();

  return useReadContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: "getActiveSuppliers",
    args: assetAddress ? [assetAddress] : undefined,
    query: {
      enabled: enabled && !!assetAddress && !!poolAddress,
    },
  });
}

/**
 * Hook to get number of active borrowers for an asset
 */
export function useActiveBorrowers(symbol: string, enabled: boolean = true) {
  const assetAddress = useAssetAddress(symbol);
  const poolAddress = usePoolAddress();

  return useReadContract({
    address: poolAddress,
    abi: POOL_ABI,
    functionName: "getActiveBorrowers",
    args: assetAddress ? [assetAddress] : undefined,
    query: {
      enabled: enabled && !!assetAddress && !!poolAddress,
    },
  });
}

// useTokenBalance is now imported from useBalance.ts
// Removed duplicate definition

/**
 * Hook to get price from Oracle
 */
export function usePrice(symbol: string, enabled: boolean = true) {
  const assetAddress = useAssetAddress(symbol);
  const oracleAddress = getContractAddress("oracle") as Address;

  return useReadContract({
    address: oracleAddress,
    abi: ORACLE_ABI,
    functionName: "getPrice",
    args: assetAddress ? [assetAddress] : undefined,
    query: {
      enabled: enabled && !!assetAddress,
    },
  });
}

/**
 * Hook to supply assets
 */
export function useSupply() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1, // Wait for 1 block confirmation
  });

  // Handle success with useEffect instead of deprecated onSuccess
  useEffect(() => {
    if (isSuccess) {
      // Invalidate all queries to refetch balances after successful transaction
      queryClient.invalidateQueries({ queryKey: [] });
      // Also refetch immediately
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [] });
      }, 1000);
    }
  }, [isSuccess, queryClient]);

  const supply = async (symbol: string, amount: string) => {
    const assetConfig = ConfigService.getAssetConfig(symbol);
    if (!assetConfig) {
      throw new Error(`Asset ${symbol} not found`);
    }

    const poolAddress = getContractAddress("pool") as Address;
    const amountParsed = parseUnits(amount, assetConfig.decimals);

    // Check if this is ZTC (native token)
    const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000804";
    if (assetConfig.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      // Use supplyNative for native token (ZTC)
      await writeContract({
        address: poolAddress,
        abi: [
          {
            inputs: [],
            name: "supplyNative",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "payable",
            type: "function",
          },
        ] as const,
        functionName: "supplyNative",
        value: amountParsed,
      });
    } else {
      // For ERC20 tokens, approve first, then supply
      const assetAddress = assetConfig.address as Address;

      // First approve
      await writeContract({
        address: assetAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [poolAddress, amountParsed],
      });

      // Then supply
      await writeContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: "supply",
        args: [assetAddress, amountParsed],
      });
    }
  };

  return {
    supply,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to withdraw assets
 */
export function useWithdraw() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: [] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [] });
      }, 1000);
    }
  }, [isSuccess, queryClient]);

  const withdraw = async (symbol: string, amount: string) => {
    const assetConfig = ConfigService.getAssetConfig(symbol);
    if (!assetConfig) {
      throw new Error(`Asset ${symbol} not found`);
    }

    const poolAddress = getContractAddress("pool") as Address;
    const amountParsed = parseUnits(amount, assetConfig.decimals);

    // Check if this is ZTC (native token)
    const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000804";
    if (assetConfig.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      // Use withdrawNative for native token (ZTC)
      await writeContract({
        address: poolAddress,
        abi: [
          {
            inputs: [{ name: "amount", type: "uint256" }],
            name: "withdrawNative",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ] as const,
        functionName: "withdrawNative",
        args: [amountParsed],
      });
    } else {
      // For ERC20 tokens, use regular withdraw
      const assetAddress = assetConfig.address as Address;
      await writeContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: "withdraw",
        args: [assetAddress, amountParsed],
      });
    }
  };

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to borrow assets
 */
export function useBorrow() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: [] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [] });
      }, 1000);
    }
  }, [isSuccess, queryClient]);

  const borrow = async (symbol: string, amount: string) => {
    const assetConfig = ConfigService.getAssetConfig(symbol);
    if (!assetConfig) {
      throw new Error(`Asset ${symbol} not found`);
    }

    const assetAddress = assetConfig.address as Address;
    const poolAddress = getContractAddress("pool") as Address;
    const amountParsed = parseUnits(amount, assetConfig.decimals);

    await writeContract({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: "borrow",
      args: [assetAddress, amountParsed],
    });
  };

  return {
    borrow,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to approve ERC20 tokens for repayment
 */
export function useApproveForRepay() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  const approve = async (symbol: string, amount: string) => {
    const assetConfig = ConfigService.getAssetConfig(symbol);
    if (!assetConfig) {
      throw new Error(`Asset ${symbol} not found`);
    }

    // Check if this is ZTC (native token) - no approval needed
    const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000804";
    if (assetConfig.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      throw new Error("Native token doesn't need approval");
    }

    const assetAddress = assetConfig.address as Address;
    const poolAddress = getContractAddress("pool") as Address;
    const amountParsed = parseUnits(amount, assetConfig.decimals);

    await writeContract({
      address: assetAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [poolAddress, amountParsed],
    });
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to repay assets
 */
export function useRepay() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: [] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [] });
      }, 1000);
    }
  }, [isSuccess, queryClient]);

  const repay = async (symbol: string, amount: string) => {
    const assetConfig = ConfigService.getAssetConfig(symbol);
    if (!assetConfig) {
      throw new Error(`Asset ${symbol} not found`);
    }

    const poolAddress = getContractAddress("pool") as Address;
    // If amount is "0", pass 0 to repay full debt (contract handles this case)
    const amountParsed = amount === "0" ? 0n : parseUnits(amount, assetConfig.decimals);

    // Check if this is ZTC (native token)
    const NATIVE_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000804";
    if (assetConfig.address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      // For native token, use payable repay function
      await writeContract({
        address: poolAddress,
        abi: [
          {
            inputs: [
              { name: "asset", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            name: "repay",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "payable",
            type: "function",
          },
        ] as const,
        functionName: "repay",
        args: [assetConfig.address as Address, amountParsed],
        value: amountParsed,
      });
    } else {
      // For ERC20 tokens, just repay (approval should be done separately)
      const assetAddress = assetConfig.address as Address;

      await writeContract({
        address: poolAddress,
        abi: POOL_ABI,
        functionName: "repay",
        args: [assetAddress, amountParsed],
        value: 0n, // Explicitly set to 0 for ERC20
      });
    }
  };

  return {
    repay,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

