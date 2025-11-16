// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IOracle.sol";
import "../interfaces/IERC20.sol";

/**
 * @title Oracle
 * @dev Price oracle for ZenFinance
 * Fetches prices from DEX pairs and caches them
 */
contract Oracle is IOracle, Ownable {
    uint256 public constant PRICE_DECIMALS = 18; // Prices are scaled to 1e18
    uint256 public constant CACHE_DURATION = 5 minutes; // Cache prices for 5 minutes
    
    // Price storage: token => price (scaled to 1e18, where 1e18 = 1 USD)
    mapping(address => uint256) public prices;
    mapping(address => uint256) public priceTimestamps;
    
    // DEX pair addresses for price fetching
    mapping(address => address) public pairContracts; // token => pair contract address
    mapping(address => bool) public isPairToken0; // token => is token0 in pair
    
    // USDC address (base for USD prices)
    address public immutable usdcAddress;
    
    // Fallback prices (in case DEX price fetch fails)
    mapping(address => uint256) public fallbackPrices;
    
    constructor(address _usdcAddress, address _owner) Ownable(_owner) {
        usdcAddress = _usdcAddress;
        // USDC price is always 1 USD (1e18)
        prices[_usdcAddress] = 1e18;
        priceTimestamps[_usdcAddress] = block.timestamp;
    }

    /**
     * @dev Get the price of a token in USD
     * @param token Address of the token
     * @return price Price of the token in USD (1e18 = 1 USD)
     */
    function getPrice(address token) external view override returns (uint256 price) {
        // Check if price is cached and still valid
        if (priceTimestamps[token] != 0 && block.timestamp <= priceTimestamps[token] + CACHE_DURATION) {
            return prices[token];
        }
        
        // Try to fetch from DEX pair
        if (pairContracts[token] != address(0)) {
            uint256 pairPrice = _fetchPairPrice(token);
            if (pairPrice > 0) {
                return pairPrice;
            }
        }
        
        // Use fallback price if available
        if (fallbackPrices[token] > 0) {
            return fallbackPrices[token];
        }
        
        // Return cached price even if expired (better than 0)
        return prices[token];
    }

    /**
     * @dev Get the price of a token pair
     * @param tokenA Address of token A
     * @param tokenB Address of token B
     * @return price Price of token A in terms of token B
     */
    function getPairPrice(address tokenA, address tokenB) external view override returns (uint256 price) {
        uint256 priceA = this.getPrice(tokenA);
        uint256 priceB = this.getPrice(tokenB);
        
        if (priceB == 0) {
            return 0;
        }
        
        // Price A in terms of B = (Price A in USD) / (Price B in USD)
        return (priceA * 1e18) / priceB;
    }

    /**
     * @dev Update price for a token (only owner can call)
     * @param token Address of the token
     * @param price New price in USD (scaled to 1e18)
     */
    function updatePrice(address token, uint256 price) external override onlyOwner {
        require(price > 0, "Price must be greater than 0");
        uint256 oldPrice = prices[token];
        prices[token] = price;
        priceTimestamps[token] = block.timestamp;
        emit PriceUpdated(token, oldPrice, price, block.timestamp);
    }

    /**
     * @dev Set pair contract for a token
     * @param token Address of the token
     * @param pairContract Address of the pair contract
     * @param isToken0 Whether the token is token0 in the pair
     */
    function setPairContract(address token, address pairContract, bool isToken0) external onlyOwner {
        pairContracts[token] = pairContract;
        isPairToken0[token] = isToken0;
    }

    /**
     * @dev Set fallback price for a token
     * @param token Address of the token
     * @param price Fallback price in USD (scaled to 1e18)
     */
    function setFallbackPrice(address token, uint256 price) external onlyOwner {
        fallbackPrices[token] = price;
    }

    /**
     * @dev Fetch price from DEX pair
     * @param token Address of the token
     * @return price Price in USD (scaled to 1e18)
     */
    function _fetchPairPrice(address token) internal view returns (uint256 price) {
        address pairContract = pairContracts[token];
        if (pairContract == address(0)) {
            return 0;
        }
        
        // Get reserves from pair contract
        // Note: This is a simplified version. In production, you would call getReserves() on the pair contract
        // For now, we'll return 0 and rely on owner-set prices or fallback prices
        // This will be implemented fully when we integrate with the actual DEX pairs
        
        return 0; // Placeholder - will be implemented with actual DEX pair interaction
    }

    /**
     * @dev Batch update prices (only owner)
     * @param tokens Array of token addresses
     * @param newPrices Array of new prices
     */
    function batchUpdatePrices(address[] calldata tokens, uint256[] calldata newPrices) external onlyOwner {
        require(tokens.length == newPrices.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < tokens.length; i++) {
            require(newPrices[i] > 0, "Price must be greater than 0");
            uint256 oldPrice = prices[tokens[i]];
            prices[tokens[i]] = newPrices[i];
            priceTimestamps[tokens[i]] = block.timestamp;
            emit PriceUpdated(tokens[i], oldPrice, newPrices[i], block.timestamp);
        }
    }
}

