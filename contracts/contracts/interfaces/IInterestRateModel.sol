// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IInterestRateModel
 * @dev Interface for interest rate model
 */
interface IInterestRateModel {
    /**
     * @dev Calculate borrow rate based on utilization
     * @param utilization Utilization rate (0-1e18, where 1e18 = 100%)
     * @return borrowRate Borrow rate per year (scaled to 1e18)
     */
    function getBorrowRate(uint256 utilization) external view returns (uint256 borrowRate);

    /**
     * @dev Calculate supply rate based on utilization
     * @param utilization Utilization rate (0-1e18, where 1e18 = 100%)
     * @param reserveFactor Reserve factor (0-1e18, where 1e18 = 100%)
     * @return supplyRate Supply rate per year (scaled to 1e18)
     */
    function getSupplyRate(uint256 utilization, uint256 reserveFactor) external view returns (uint256 supplyRate);

    /**
     * @dev Get optimal utilization rate
     * @return optimalUtilization Optimal utilization rate (scaled to 1e18)
     */
    function getOptimalUtilization() external view returns (uint256 optimalUtilization);
}

