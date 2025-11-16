// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IInterestRateModel.sol";

/**
 * @title InterestRateModel
 * @dev Kinked interest rate model for ZenFinance
 * Implements a kinked interest rate model with optimal utilization
 */
contract InterestRateModel is IInterestRateModel {
    uint256 public constant BASE_RATE = 0.02e18; // 2% (scaled to 1e18)
    uint256 public constant SLOPE1 = 0.08e18; // 8% (scaled to 1e18)
    uint256 public constant SLOPE2 = 0.50e18; // 50% (scaled to 1e18)
    uint256 public constant OPTIMAL_UTILIZATION = 0.75e18; // 75% (scaled to 1e18)
    uint256 public constant MAX_UTILIZATION = 1e18; // 100% (scaled to 1e18)

    /**
     * @dev Calculate borrow rate based on utilization (kinked model)
     * @param utilization Utilization rate (0-1e18, where 1e18 = 100%)
     * @return borrowRate Borrow rate per year (scaled to 1e18)
     */
    function getBorrowRate(uint256 utilization) external pure override returns (uint256 borrowRate) {
        if (utilization <= OPTIMAL_UTILIZATION) {
            // Utilization below optimal: linear increase
            // Rate = Base Rate + (Utilization / Optimal Utilization) × Slope1
            borrowRate = BASE_RATE + (utilization * SLOPE1) / OPTIMAL_UTILIZATION;
        } else {
            // Utilization above optimal: kinked increase
            // Rate = Base Rate + Slope1 + ((Utilization - Optimal) / (Max - Optimal)) × Slope2
            uint256 excessUtilization = utilization - OPTIMAL_UTILIZATION;
            uint256 maxExcess = MAX_UTILIZATION - OPTIMAL_UTILIZATION; // 25% (0.25e18)
            borrowRate = BASE_RATE + SLOPE1 + (excessUtilization * SLOPE2) / maxExcess;
        }
    }

    /**
     * @dev Calculate supply rate based on utilization
     * Supply Rate = Borrow Rate × (1 - Reserve Factor) × Utilization
     * @param utilization Utilization rate (0-1e18, where 1e18 = 100%)
     * @param reserveFactor Reserve factor (0-1e18, where 1e18 = 100%)
     * @return supplyRate Supply rate per year (scaled to 1e18)
     */
    function getSupplyRate(uint256 utilization, uint256 reserveFactor) 
        external 
        pure 
        override 
        returns (uint256 supplyRate) 
    {
        if (utilization == 0) {
            return 0;
        }

        // Get borrow rate
        uint256 borrowRate;
        if (utilization <= OPTIMAL_UTILIZATION) {
            borrowRate = BASE_RATE + (utilization * SLOPE1) / OPTIMAL_UTILIZATION;
        } else {
            uint256 excessUtilization = utilization - OPTIMAL_UTILIZATION;
            uint256 maxExcess = MAX_UTILIZATION - OPTIMAL_UTILIZATION;
            borrowRate = BASE_RATE + SLOPE1 + (excessUtilization * SLOPE2) / maxExcess;
        }

        // Calculate supply rate: Borrow Rate × (1 - Reserve Factor) × Utilization
        supplyRate = (borrowRate * (1e18 - reserveFactor) * utilization) / 1e18 / 1e18;
    }

    /**
     * @dev Get optimal utilization rate
     * @return optimalUtilization Optimal utilization rate (scaled to 1e18)
     */
    function getOptimalUtilization() external pure override returns (uint256 optimalUtilization) {
        return OPTIMAL_UTILIZATION;
    }
}

