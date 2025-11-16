// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AssetRegistry
 * @dev Registry for managing supported assets and their configurations
 */
contract AssetRegistry is Ownable {
    struct AssetConfig {
        bool isSupported; // Whether the asset is supported
        uint256 ltv; // Loan-to-Value ratio (scaled to 1e18, e.g., 0.75e18 = 75%)
        uint256 liquidationThreshold; // Liquidation threshold (scaled to 1e18, e.g., 0.80e18 = 80%)
        uint256 reserveFactor; // Reserve factor (scaled to 1e18, e.g., 0.10e18 = 10%)
        bool canBeCollateral; // Whether the asset can be used as collateral
        address aTokenAddress; // Address of the aToken for this asset
    }

    // Asset configurations
    mapping(address => AssetConfig) public assets;
    address[] public supportedAssets; // List of supported asset addresses

    // Events
    event AssetAdded(address indexed asset, uint256 ltv, uint256 liquidationThreshold, uint256 reserveFactor);
    event AssetRemoved(address indexed asset);
    event AssetConfigUpdated(address indexed asset, uint256 ltv, uint256 liquidationThreshold, uint256 reserveFactor);

    constructor(address _owner) Ownable(_owner) {
        // Default configuration values
        // These will be set when adding assets
    }

    /**
     * @dev Add a supported asset
     * @param asset Address of the asset
     * @param ltv Loan-to-Value ratio (scaled to 1e18)
     * @param liquidationThreshold Liquidation threshold (scaled to 1e18)
     * @param reserveFactor Reserve factor (scaled to 1e18)
     * @param canBeCollateral Whether the asset can be used as collateral
     * @param aTokenAddress Address of the aToken
     */
    function addAsset(
        address asset,
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 reserveFactor,
        bool canBeCollateral,
        address aTokenAddress
    ) external onlyOwner {
        require(asset != address(0), "Invalid asset address");
        require(!assets[asset].isSupported, "Asset already supported");
        require(ltv <= 1e18, "LTV must be <= 100%");
        require(liquidationThreshold <= 1e18, "Liquidation threshold must be <= 100%");
        require(reserveFactor <= 1e18, "Reserve factor must be <= 100%");
        require(ltv <= liquidationThreshold, "LTV must be <= liquidation threshold");
        
        assets[asset] = AssetConfig({
            isSupported: true,
            ltv: ltv,
            liquidationThreshold: liquidationThreshold,
            reserveFactor: reserveFactor,
            canBeCollateral: canBeCollateral,
            aTokenAddress: aTokenAddress
        });
        
        supportedAssets.push(asset);
        
        emit AssetAdded(asset, ltv, liquidationThreshold, reserveFactor);
    }

    /**
     * @dev Remove a supported asset
     * @param asset Address of the asset
     */
    function removeAsset(address asset) external onlyOwner {
        require(assets[asset].isSupported, "Asset not supported");
        
        assets[asset].isSupported = false;
        
        // Remove from supported assets array
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            if (supportedAssets[i] == asset) {
                supportedAssets[i] = supportedAssets[supportedAssets.length - 1];
                supportedAssets.pop();
                break;
            }
        }
        
        emit AssetRemoved(asset);
    }

    /**
     * @dev Update asset configuration
     * @param asset Address of the asset
     * @param ltv Loan-to-Value ratio (scaled to 1e18)
     * @param liquidationThreshold Liquidation threshold (scaled to 1e18)
     * @param reserveFactor Reserve factor (scaled to 1e18)
     */
    function updateAssetConfig(
        address asset,
        uint256 ltv,
        uint256 liquidationThreshold,
        uint256 reserveFactor
    ) external onlyOwner {
        require(assets[asset].isSupported, "Asset not supported");
        require(ltv <= 1e18, "LTV must be <= 100%");
        require(liquidationThreshold <= 1e18, "Liquidation threshold must be <= 100%");
        require(reserveFactor <= 1e18, "Reserve factor must be <= 100%");
        require(ltv <= liquidationThreshold, "LTV must be <= liquidation threshold");
        
        assets[asset].ltv = ltv;
        assets[asset].liquidationThreshold = liquidationThreshold;
        assets[asset].reserveFactor = reserveFactor;
        
        emit AssetConfigUpdated(asset, ltv, liquidationThreshold, reserveFactor);
    }

    /**
     * @dev Update aToken address for an asset
     * @param asset Address of the asset
     * @param aTokenAddress Address of the aToken
     */
    function updateATokenAddress(address asset, address aTokenAddress) external onlyOwner {
        require(assets[asset].isSupported, "Asset not supported");
        assets[asset].aTokenAddress = aTokenAddress;
    }

    /**
     * @dev Check if an asset is supported
     * @param asset Address of the asset
     * @return isSupported Whether the asset is supported
     */
    function isAssetSupported(address asset) external view returns (bool) {
        return assets[asset].isSupported;
    }

    /**
     * @dev Get asset configuration
     * @param asset Address of the asset
     * @return config Asset configuration
     */
    function getAssetConfig(address asset) external view returns (AssetConfig memory) {
        return assets[asset];
    }

    /**
     * @dev Get all supported assets
     * @return assets Array of supported asset addresses
     */
    function getSupportedAssets() external view returns (address[] memory) {
        return supportedAssets;
    }

    /**
     * @dev Get number of supported assets
     * @return count Number of supported assets
     */
    function getSupportedAssetsCount() external view returns (uint256) {
        return supportedAssets.length;
    }
}

