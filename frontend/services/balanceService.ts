/**
 * Balance Service
 * Service for fetching wallet and contract balances
 */

import { ethers } from "ethers";
import { ConfigService } from "./configService";
import { contractService } from "./contractService";

/**
 * Balance Service
 * Handles balance fetching for wallet and contract balances
 */
export class BalanceService {
  private provider: ethers.Provider | null = null;

  /**
   * Initialize with provider
   */
  async initialize(provider: ethers.Provider) {
    this.provider = provider;
    await contractService.initialize(provider);
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(
    userAddress: string,
    assetSymbol: string
  ): Promise<bigint> {
    if (!this.provider) {
      return 0n;
    }

    try {
      const assetConfig = ConfigService.getAssetConfig(assetSymbol);
      if (!assetConfig) {
        return 0n;
      }

      // Handle native token (ZTC)
      if (assetSymbol === "ZTC") {
        const balance = await this.provider.getBalance(userAddress);
        return BigInt(balance.toString());
      }

      // Get ERC20 balance
      const token = contractService.getERC20Contract(assetConfig.address);
      const balance = await token.balanceOf(userAddress);
      return BigInt(balance.toString());
    } catch (error) {
      console.error(`Error getting token balance for ${assetSymbol}:`, error);
      return 0n;
    }
  }

  /**
   * Get wallet balances for all assets
   */
  async getWalletBalances(userAddress: string): Promise<Record<string, bigint>> {
    const balances: Record<string, bigint> = {};
    const assets = ConfigService.getAllAssets();

    for (const asset of assets) {
      balances[asset.symbol] = await this.getTokenBalance(userAddress, asset.symbol);
    }

    return balances;
  }

  /**
   * Get supply balances for all assets
   */
  async getSupplyBalances(userAddress: string): Promise<Record<string, bigint>> {
    const balances: Record<string, bigint> = {};
    const assets = ConfigService.getAllAssets();

    for (const asset of assets) {
      balances[asset.symbol] = await contractService.getSupplyBalance(
        userAddress,
        asset.symbol
      );
    }

    return balances;
  }

  /**
   * Get borrow balances for all assets
   */
  async getBorrowBalances(userAddress: string): Promise<Record<string, bigint>> {
    const balances: Record<string, bigint> = {};
    const assets = ConfigService.getAllAssets();

    for (const asset of assets) {
      balances[asset.symbol] = await contractService.getBorrowBalance(
        userAddress,
        asset.symbol
      );
    }

    return balances;
  }

  /**
   * Get token allowance
   */
  async getAllowance(
    userAddress: string,
    assetSymbol: string,
    spenderAddress: string
  ): Promise<bigint> {
    if (!this.provider) {
      return 0n;
    }

    try {
      const assetConfig = ConfigService.getAssetConfig(assetSymbol);
      if (!assetConfig) {
        return 0n;
      }

      const token = contractService.getERC20Contract(assetConfig.address);
      const allowance = await token.allowance(userAddress, spenderAddress);
      return BigInt(allowance.toString());
    } catch (error) {
      console.error(`Error getting allowance for ${assetSymbol}:`, error);
      return 0n;
    }
  }

  /**
   * Format balance with decimals
   */
  formatBalance(balance: bigint, assetSymbol: string, decimals: number = 2): string {
    const assetConfig = ConfigService.getAssetConfig(assetSymbol);
    if (!assetConfig) {
      return "0";
    }

    const balanceNumber = Number(balance) / Math.pow(10, assetConfig.decimals);
    
    if (balanceNumber === 0) {
      return "0";
    }

    // Format to 2 decimal places
    return balanceNumber.toFixed(decimals);
  }

  /**
   * Optimize large numbers (K, M, etc.)
   */
  optimizeNumber(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  }
}

// Export singleton instance
export const balanceService = new BalanceService();

