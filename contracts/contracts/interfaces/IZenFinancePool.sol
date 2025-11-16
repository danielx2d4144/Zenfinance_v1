// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IZenFinancePool
 * @dev Interface for ZenFinance lending pool
 */
interface IZenFinancePool {
    /**
     * @dev Supply assets to the pool
     * @param asset Address of the asset to supply
     * @param amount Amount to supply
     * @return aTokenAmount Amount of aTokens minted
     */
    function supply(address asset, uint256 amount) external returns (uint256 aTokenAmount);

    /**
     * @dev Withdraw assets from the pool
     * @param asset Address of the asset to withdraw
     * @param amount Amount to withdraw (0 = withdraw all)
     * @return withdrawnAmount Amount withdrawn
     */
    function withdraw(address asset, uint256 amount) external returns (uint256 withdrawnAmount);

    /**
     * @dev Borrow assets from the pool
     * @param asset Address of the asset to borrow
     * @param amount Amount to borrow
     * @return loanId Loan ID
     */
    function borrow(address asset, uint256 amount) external returns (uint256 loanId);

    /**
     * @dev Repay borrowed assets
     * @param asset Address of the asset to repay
     * @param amount Amount to repay (0 = repay all)
     * @return repaidAmount Amount repaid
     */
    function repay(address asset, uint256 amount) external payable returns (uint256 repaidAmount);

    /**
     * @dev Get user's supplied balance
     * @param user Address of the user
     * @param asset Address of the asset
     * @return balance Supplied balance
     */
    function getSupplyBalance(address user, address asset) external view returns (uint256 balance);

    /**
     * @dev Get user's borrowed balance
     * @param user Address of the user
     * @param asset Address of the asset
     * @return balance Borrowed balance
     */
    function getBorrowBalance(address user, address asset) external view returns (uint256 balance);

    /**
     * @dev Get user's health factor
     * @param user Address of the user
     * @return healthFactor Health factor (scaled to 1e18)
     */
    function getHealthFactor(address user) external view returns (uint256 healthFactor);

    /**
     * @dev Get available borrowing power
     * @param user Address of the user
     * @param asset Address of the asset
     * @return available Available borrowing power
     */
    function getAvailableBorrow(address user, address asset) external view returns (uint256 available);

    /**
     * @dev Supply native token (ZTC) to the pool
     * @return aTokenAmount Amount of aTokens minted
     */
    function supplyNative() external payable returns (uint256 aTokenAmount);

    /**
     * @dev Withdraw native token (ZTC) from the pool
     * @param amount Amount to withdraw (0 = withdraw all)
     * @return withdrawnAmount Amount withdrawn
     */
    function withdrawNative(uint256 amount) external returns (uint256 withdrawnAmount);

    /**
     * @dev Events
     */
    event Supply(address indexed user, address indexed asset, uint256 amount, uint256 aTokenAmount, uint256 timestamp);
    event Withdraw(address indexed user, address indexed asset, uint256 amount, uint256 timestamp);
    event Borrow(address indexed user, address indexed asset, uint256 amount, uint256 loanId, uint256 timestamp);
    event Repay(address indexed user, address indexed asset, uint256 amount, uint256 timestamp);
    event Liquidation(address indexed liquidator, address indexed user, address indexed asset, uint256 amount, uint256 timestamp);
}

