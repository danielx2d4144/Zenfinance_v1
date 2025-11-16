// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IAToken
 * @dev Interface for interest-bearing tokens (aTokens)
 */
interface IAToken is IERC20 {
    /**
     * @dev Mint aTokens to a user
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external;

    /**
     * @dev Burn aTokens from a user
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external;

    /**
     * @dev Get the underlying asset address
     * @return underlyingAsset Address of the underlying asset
     */
    function underlyingAsset() external view returns (address underlyingAsset);

    /**
     * @dev Get the exchange rate (scaled to 1e18)
     * @return exchangeRate Exchange rate (1e18 = 1:1)
     */
    function getExchangeRate() external view returns (uint256 exchangeRate);

    /**
     * @dev Get the total underlying asset balance
     * @return totalUnderlying Total underlying asset balance
     */
    function getTotalUnderlying() external view returns (uint256 totalUnderlying);

    /**
     * @dev Update exchange rate based on interest accrued
     * @param interestAccrued Interest accrued since last update
     */
    function updateExchangeRate(uint256 interestAccrued) external;
}

