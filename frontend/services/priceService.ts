/**
 * Price Service
 * Service for fetching asset prices from DEX pairs
 */

import { ethers } from "ethers";
import { ConfigService } from "./configService";
import { contractService } from "./contractService";

// DEX Pair ABI
const PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
];

const ERC20_ABI = [
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
];

// Price cache (30 seconds)
const PRICE_CACHE_DURATION = 30 * 1000; // 30 seconds
const priceCache: Map<string, { price: number; timestamp: number }> = new Map();

/**
 * Price Service
 * Fetches prices from DEX pairs or Oracle
 */
export class PriceService {
  private provider: ethers.Provider | null = null;

  /**
   * Initialize with provider
   */
  async initialize(provider: ethers.Provider) {
    this.provider = provider;
    // Also initialize contract service if needed
    await contractService.initialize(provider);
  }

  /**
   * Get price from cache or fetch new
   */
  private getCachedPrice(key: string): number | null {
    const cached = priceCache.get(key);
    if (cached && Date.now() - cached.timestamp < PRICE_CACHE_DURATION) {
      return cached.price;
    }
    return null;
  }

  /**
   * Set price in cache
   */
  private setCachedPrice(key: string, price: number) {
    priceCache.set(key, { price, timestamp: Date.now() });
  }

  /**
   * Get price from Oracle (preferred method)
   */
  async getPriceFromOracle(assetSymbol: string): Promise<number | null> {
    try {
      const assetConfig = ConfigService.getAssetConfig(assetSymbol);
      if (!assetConfig) {
        return null;
      }

      const oracle = contractService.getOracleContract();
      const price = await oracle.getPrice(assetConfig.address);
      // Price is in USD scaled to 1e18
      return Number(price) / 1e18;
    } catch (error) {
      console.error(`Error getting price from Oracle for ${assetSymbol}:`, error);
      return null;
    }
  }

  /**
   * Get price from DEX pair
   */
  async getPriceFromDEX(assetSymbol: string): Promise<number | null> {
    if (!this.provider) {
      return null;
    }

    try {
      // Check cache first
      const cacheKey = `dex_${assetSymbol}`;
      const cached = this.getCachedPrice(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const assetConfig = ConfigService.getAssetConfig(assetSymbol);
      if (!assetConfig) {
        return null;
      }

      // Get routing path to USDC
      const routingPath = ConfigService.getRoutingPathToUSDC(assetSymbol);
      if (routingPath.length === 0) {
        return null; // USDC itself
      }

      // Direct USDC pair
      if (routingPath.length === 2 && routingPath[1] === "USDC") {
        const pairConfig = ConfigService.getUSDCPair(assetSymbol);
        if (!pairConfig) {
          return null;
        }

        const price = await this.fetchDirectPairPrice(pairConfig.address, assetSymbol, "USDC");
        if (price !== null) {
          this.setCachedPrice(cacheKey, price);
        }
        return price;
      }

      // Intermediate routing (e.g., ZFI → ZTC → USDC)
      if (routingPath.length === 3) {
        const [tokenA, tokenB, tokenC] = routingPath;
        
        // Get price of tokenA in tokenB
        const pairAB = ConfigService.getPairConfig(tokenA, tokenB);
        if (!pairAB) {
          return null;
        }
        const priceAB = await this.fetchDirectPairPrice(pairAB.address, tokenA, tokenB);
        if (priceAB === null) {
          return null;
        }

        // Get price of tokenB in USDC
        const priceBC = await this.getPriceFromDEX(tokenB);
        if (priceBC === null) {
          return null;
        }

        // Calculate final price: tokenA in USDC = (tokenA in tokenB) × (tokenB in USDC)
        const finalPrice = priceAB * priceBC;
        this.setCachedPrice(cacheKey, finalPrice);
        return finalPrice;
      }

      return null;
    } catch (error) {
      console.error(`Error getting price from DEX for ${assetSymbol}:`, error);
      return null;
    }
  }

  /**
   * Fetch price from a direct DEX pair
   */
  private async fetchDirectPairPrice(
    pairAddress: string,
    tokenA: string,
    tokenB: string
  ): Promise<number | null> {
    if (!this.provider) {
      return null;
    }

    try {
      const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, this.provider);
      const [reserve0, reserve1] = await pairContract.getReserves();
      
      // Get token addresses and decimals
      const token0Address = await pairContract.token0();
      const token1Address = await pairContract.token1();
      
      const token0Contract = new ethers.Contract(token0Address, ERC20_ABI, this.provider);
      const token1Contract = new ethers.Contract(token1Address, ERC20_ABI, this.provider);
      
      const decimals0 = await token0Contract.decimals();
      const decimals1 = await token1Contract.decimals();
      
      // Determine which token is which
      const assetConfigA = ConfigService.getAssetConfig(tokenA);
      const assetConfigB = ConfigService.getAssetConfig(tokenB);
      
      if (!assetConfigA || !assetConfigB) {
        return null;
      }

      // Calculate price
      // If tokenA is token0 and tokenB is token1:
      // Price of A in B = (reserve1 / 10^decimals1) / (reserve0 / 10^decimals0)
      let price: number;
      
      if (token0Address.toLowerCase() === assetConfigA.address.toLowerCase()) {
        // TokenA is token0, TokenB is token1
        const reserve0Adjusted = Number(reserve0) / Math.pow(10, Number(decimals0));
        const reserve1Adjusted = Number(reserve1) / Math.pow(10, Number(decimals1));
        price = reserve1Adjusted / reserve0Adjusted;
      } else {
        // TokenA is token1, TokenB is token0
        const reserve0Adjusted = Number(reserve0) / Math.pow(10, Number(decimals0));
        const reserve1Adjusted = Number(reserve1) / Math.pow(10, Number(decimals1));
        price = reserve0Adjusted / reserve1Adjusted;
      }

      // If tokenB is USDC, price is already in USD
      if (tokenB === "USDC") {
        return price;
      }

      // Otherwise, convert to USD via USDC
      const usdcPrice = await this.getPriceFromDEX(tokenB);
      if (usdcPrice === null) {
        return null;
      }

      return price * usdcPrice;
    } catch (error) {
      console.error(`Error fetching pair price:`, error);
      return null;
    }
  }

  /**
   * Get asset price (tries Oracle first, then DEX)
   */
  async getPrice(assetSymbol: string): Promise<number | null> {
    // Try Oracle first
    const oraclePrice = await this.getPriceFromOracle(assetSymbol);
    if (oraclePrice !== null && oraclePrice > 0) {
      return oraclePrice;
    }

    // Fallback to DEX
    return await this.getPriceFromDEX(assetSymbol);
  }

  /**
   * Get USD value of an amount
   */
  async getUSDValue(assetSymbol: string, amount: bigint): Promise<number> {
    const assetConfig = ConfigService.getAssetConfig(assetSymbol);
    if (!assetConfig) {
      return 0;
    }

    const price = await this.getPrice(assetSymbol);
    if (price === null || price === 0) {
      return 0;
    }

    const amountNumber = Number(amount) / Math.pow(10, assetConfig.decimals);
    return amountNumber * price;
  }

  /**
   * Clear price cache
   */
  clearCache() {
    priceCache.clear();
  }
}

// Export singleton instance
export const priceService = new PriceService();

