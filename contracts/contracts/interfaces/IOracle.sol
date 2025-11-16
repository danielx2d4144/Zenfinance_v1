// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOracle
 * @dev Interface for price oracle
 */
interface IOracle {
    /**
     * @dev Get the price of a token in USD (scaled to 1e18)
     * @param token Address of the token
     * @return price Price of the token in USD (1e18 = 1 USD)
     */
    function getPrice(address token) external view returns (uint256 price);

    /**
     * @dev Get the price of a token pair
     * @param tokenA Address of token A
     * @param tokenB Address of token B
     * @return price Price of token A in terms of token B
     */
    function getPairPrice(address tokenA, address tokenB) external view returns (uint256 price);

    /**
     * @dev Update price for a token (only oracle can call)
     * @param token Address of the token
     * @param price New price in USD (scaled to 1e18)
     */
    function updatePrice(address token, uint256 price) external;

    /**
     * @dev Event emitted when price is updated
     */
    event PriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice, uint256 timestamp);
}

