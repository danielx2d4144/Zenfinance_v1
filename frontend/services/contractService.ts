/**
 * Contract Service
 * Service for interacting with ZenFinance smart contracts
 */

import { ethers } from "ethers";
import { getContractAddress, getATokenAddress } from "@/config/contracts";
import { ConfigService } from "./configService";
import { getAddress } from "viem";

// Contract ABIs (simplified - in production, import from typechain or artifacts)
const POOL_ABI = [
  "function supply(address asset, uint256 amount) external returns (uint256)",
  "function withdraw(address asset, uint256 amount) external returns (uint256)",
  "function borrow(address asset, uint256 amount) external returns (uint256)",
  "function repay(address asset, uint256 amount) external returns (uint256)",
  "function getSupplyBalance(address user, address asset) external view returns (uint256)",
  "function getBorrowBalance(address user, address asset) external view returns (uint256)",
  "function getHealthFactor(address user) external view returns (uint256)",
  "function getAvailableBorrow(address user, address asset) external view returns (uint256)",
  "function totalSupplied(address asset) external view returns (uint256)",
  "function totalBorrowed(address asset) external view returns (uint256)",
  "event Supply(address indexed user, address indexed asset, uint256 amount, uint256 aTokenAmount, uint256 timestamp)",
  "event Withdraw(address indexed user, address indexed asset, uint256 amount, uint256 timestamp)",
  "event Borrow(address indexed user, address indexed asset, uint256 amount, uint256 timestamp)",
  "event Repay(address indexed user, address indexed asset, uint256 amount, uint256 timestamp)",
];

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function totalSupply() external view returns (uint256)",
];

const ORACLE_ABI = [
  "function getPrice(address token) external view returns (uint256)",
  "function getPairPrice(address tokenA, address tokenB) external view returns (uint256)",
];

const ASSET_REGISTRY_ABI = [
  "function isAssetSupported(address asset) external view returns (bool)",
  "function getAssetConfig(address asset) external view returns (tuple(bool isSupported, uint256 ltv, uint256 liquidationThreshold, uint256 reserveFactor, bool canBeCollateral, address aTokenAddress))",
  "function getSupportedAssets() external view returns (address[])",
];

const ATOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function getExchangeRate() external view returns (uint256)",
  "function getTotalUnderlying() external view returns (uint256)",
  "function underlyingAsset() external view returns (address)",
];

/**
 * Contract Service
 * Handles all smart contract interactions
 */
export class ContractService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize with provider and signer
   */
  async initialize(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer || null;
  }

  /**
   * Get contract instance
   */
  private getContract(address: string, abi: string[], signer?: boolean) {
    if (!this.provider) {
      throw new Error("Provider not initialized");
    }

    const signerOrProvider = signer && this.signer ? this.signer : this.provider;
    return new ethers.Contract(address, abi, signerOrProvider);
  }

  /**
   * Get pool contract instance
   */
  getPoolContract(signer: boolean = false) {
    const poolAddress = getContractAddress("pool");
    return this.getContract(poolAddress, POOL_ABI, signer);
  }

  /**
   * Get ERC20 token contract instance
   */
  getERC20Contract(tokenAddress: string, signer: boolean = false) {
    return this.getContract(tokenAddress, ERC20_ABI, signer);
  }

  /**
   * Get Oracle contract instance
   */
  getOracleContract() {
    const oracleAddress = getContractAddress("oracle");
    return this.getContract(oracleAddress, ORACLE_ABI, false);
  }

  /**
   * Get Asset Registry contract instance
   */
  getAssetRegistryContract() {
    const registryAddress = getContractAddress("assetRegistry");
    return this.getContract(registryAddress, ASSET_REGISTRY_ABI, false);
  }

  /**
   * Get aToken contract instance
   */
  getATokenContract(symbol: string, signer: boolean = false) {
    const aTokenAddress = getATokenAddress(symbol);
    return this.getContract(aTokenAddress, ATOKEN_ABI, signer);
  }

  /**
   * Get user's supply balance for an asset
   */
  async getSupplyBalance(userAddress: string, assetSymbol: string): Promise<bigint> {
    try {
      const pool = this.getPoolContract();
      const assetConfig = ConfigService.getAssetConfig(assetSymbol);
      if (!assetConfig) {
        return 0n;
      }

      const balance = await pool.getSupplyBalance(userAddress, assetConfig.address);
      return BigInt(balance.toString());
    } catch (error) {
      console.error(`Error getting supply balance for ${assetSymbol}:`, error);
      return 0n;
    }
  }

  /**
   * Get user's borrow balance for an asset
   */
  async getBorrowBalance(userAddress: string, assetSymbol: string): Promise<bigint> {
    try {
      const pool = this.getPoolContract();
      const assetConfig = ConfigService.getAssetConfig(assetSymbol);
      if (!assetConfig) {
        return 0n;
      }

      const balance = await pool.getBorrowBalance(userAddress, assetConfig.address);
      return BigInt(balance.toString());
    } catch (error) {
      console.error(`Error getting borrow balance for ${assetSymbol}:`, error);
      return 0n;
    }
  }

  /**
   * Get user's health factor
   */
  async getHealthFactor(userAddress: string): Promise<number> {
    try {
      const pool = this.getPoolContract();
      const healthFactor = await pool.getHealthFactor(userAddress);
      const hf = Number(healthFactor);
      // If health factor is max uint256, return Infinity
      if (hf === Number.MAX_SAFE_INTEGER || hf > 1e18) {
        return Infinity;
      }
      return hf / 1e18; // Convert from 1e18 scale
    } catch (error) {
      console.error("Error getting health factor:", error);
      return Infinity;
    }
  }

  /**
   * Get available borrow for user and asset
   */
  async getAvailableBorrow(userAddress: string, assetSymbol: string): Promise<bigint> {
    try {
      const pool = this.getPoolContract();
      const assetConfig = ConfigService.getAssetConfig(assetSymbol);
      if (!assetConfig) {
        return 0n;
      }

      const available = await pool.getAvailableBorrow(userAddress, assetConfig.address);
      return BigInt(available.toString());
    } catch (error) {
      console.error(`Error getting available borrow for ${assetSymbol}:`, error);
      return 0n;
    }
  }

  /**
   * Get total supplied for an asset
   */
  async getTotalSupplied(assetSymbol: string): Promise<bigint> {
    try {
      const pool = this.getPoolContract();
      const assetConfig = ConfigService.getAssetConfig(assetSymbol);
      if (!assetConfig) {
        return 0n;
      }

      const total = await pool.totalSupplied(assetConfig.address);
      return BigInt(total.toString());
    } catch (error) {
      console.error(`Error getting total supplied for ${assetSymbol}:`, error);
      return 0n;
    }
  }

  /**
   * Get total borrowed for an asset
   */
  async getTotalBorrowed(assetSymbol: string): Promise<bigint> {
    try {
      const pool = this.getPoolContract();
      const assetConfig = ConfigService.getAssetConfig(assetSymbol);
      if (!assetConfig) {
        return 0n;
      }

      const total = await pool.totalBorrowed(assetConfig.address);
      return BigInt(total.toString());
    } catch (error) {
      console.error(`Error getting total borrowed for ${assetSymbol}:`, error);
      return 0n;
    }
  }

  /**
   * Supply assets to the pool
   */
  async supply(assetSymbol: string, amount: bigint): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer not available");
    }

    const pool = this.getPoolContract(true);
    const assetConfig = ConfigService.getAssetConfig(assetSymbol);
    if (!assetConfig) {
      throw new Error(`Asset ${assetSymbol} not found`);
    }

    // Approve token spending
    const token = this.getERC20Contract(assetConfig.address, true);
    const approveTx = await token.approve(getContractAddress("pool"), amount);
    await approveTx.wait();

    // Supply assets
    const tx = await pool.supply(assetConfig.address, amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Withdraw assets from the pool
   */
  async withdraw(assetSymbol: string, amount: bigint): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer not available");
    }

    const pool = this.getPoolContract(true);
    const assetConfig = ConfigService.getAssetConfig(assetSymbol);
    if (!assetConfig) {
      throw new Error(`Asset ${assetSymbol} not found`);
    }

    const tx = await pool.withdraw(assetConfig.address, amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Borrow assets from the pool
   */
  async borrow(assetSymbol: string, amount: bigint): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer not available");
    }

    const pool = this.getPoolContract(true);
    const assetConfig = ConfigService.getAssetConfig(assetSymbol);
    if (!assetConfig) {
      throw new Error(`Asset ${assetSymbol} not found`);
    }

    const tx = await pool.borrow(assetConfig.address, amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Repay borrowed assets
   */
  async repay(assetSymbol: string, amount: bigint): Promise<string> {
    if (!this.signer) {
      throw new Error("Signer not available");
    }

    const pool = this.getPoolContract(true);
    const assetConfig = ConfigService.getAssetConfig(assetSymbol);
    if (!assetConfig) {
      throw new Error(`Asset ${assetSymbol} not found`);
    }

    // Approve token spending for repayment
    const token = this.getERC20Contract(assetConfig.address, true);
    const approveTx = await token.approve(getContractAddress("pool"), amount);
    await approveTx.wait();

    const tx = await pool.repay(assetConfig.address, amount);
    const receipt = await tx.wait();
    return receipt.hash;
  }
}

// Export singleton instance
export const contractService = new ContractService();

