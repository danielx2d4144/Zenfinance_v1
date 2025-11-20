// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IZenFinancePool.sol";
import "../interfaces/IAToken.sol";
import "../interfaces/IOracle.sol";
import "../interfaces/IInterestRateModel.sol";
import "../registry/AssetRegistry.sol";

/**
 * @title ZenFinancePool
 * @dev Main lending pool contract for ZenFinance
 */
contract ZenFinancePool is IZenFinancePool, ReentrancyGuard, Ownable, Pausable {
    // Constants
    uint256 public constant BASIS_POINTS = 10000; // 100% in basis points
    uint256 public constant LIQUIDATION_BONUS = 500; // 5% liquidation bonus (in basis points)
    uint256 public constant MIN_HEALTH_FACTOR = 1e18; // Health factor below this triggers liquidation
    
    // Native token address (ZTC on ZenChain)
    address public constant NATIVE_TOKEN = 0x0000000000000000000000000000000000000804;
    
    // Contracts
    IOracle public oracle;
    IInterestRateModel public interestRateModel;
    AssetRegistry public assetRegistry;
    
    // User balances: user => asset => balance
    mapping(address => mapping(address => uint256)) public supplyBalances; // Supplied balances
    mapping(address => mapping(address => uint256)) public borrowBalances; // Borrowed balances
    mapping(address => mapping(address => uint256)) public borrowInterestIndex; // Interest index for borrows
    
    // Market data: asset => data
    mapping(address => uint256) public totalSupplied; // Total supplied for each asset
    mapping(address => uint256) public totalBorrowed; // Total borrowed for each asset
    mapping(address => uint256) public reserveAccumulated; // Reserves accumulated for each asset
    mapping(address => uint256) public lastInterestUpdate; // Last interest update timestamp
    
    // User statistics: asset => user => isActive
    mapping(address => mapping(address => bool)) private isSupplier; // Track if user has active supply
    mapping(address => mapping(address => bool)) private isBorrower; // Track if user has active borrow
    
    // Count statistics: asset => count
    mapping(address => uint256) public activeSuppliers; // Count of active suppliers per asset
    mapping(address => uint256) public activeBorrowers; // Count of active borrowers per asset
    
    // Additional events (not in interface)
    event InterestAccrued(address indexed asset, uint256 supplyInterest, uint256 borrowInterest, uint256 timestamp);

    constructor(
        address _oracle,
        address _interestRateModel,
        address _assetRegistry,
        address _owner
    ) Ownable(_owner) {
        oracle = IOracle(_oracle);
        interestRateModel = IInterestRateModel(_interestRateModel);
        assetRegistry = AssetRegistry(_assetRegistry);
    }

    /**
     * @dev Supply assets to the pool
     * @param asset Address of the asset to supply
     * @param amount Amount to supply
     * @return aTokenAmount Amount of aTokens minted
     */
    function supply(address asset, uint256 amount) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        returns (uint256 aTokenAmount) 
    {
        require(amount > 0, "Amount must be greater than 0");
        
        // Check if asset is supported
        require(assetRegistry.isAssetSupported(asset), "Asset not supported");
        
        // Accrue interest
        _accrueInterest(asset);
        
        // Transfer asset from user
        IERC20 token = IERC20(asset);
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Get aToken address
        AssetRegistry.AssetConfig memory config = assetRegistry.getAssetConfig(asset);
        IAToken aToken = IAToken(config.aTokenAddress);
        
        // Mint aTokens
        aToken.mint(msg.sender, amount);
        
        // Calculate aToken amount based on exchange rate
        uint256 exchangeRate = aToken.getExchangeRate();
        aTokenAmount = (amount * 1e18) / exchangeRate;
        
        // Update balances
        supplyBalances[msg.sender][asset] += amount;
        totalSupplied[asset] += amount;
        
        // Update supplier count
        _updateSupplierCount(msg.sender, asset, supplyBalances[msg.sender][asset]);
        
        emit Supply(msg.sender, asset, amount, aTokenAmount, block.timestamp);
        
        return aTokenAmount;
    }

    /**
     * @dev Withdraw assets from the pool
     * @param asset Address of the asset to withdraw
     * @param amount Amount to withdraw (0 = withdraw all)
     * @return withdrawnAmount Amount withdrawn
     */
    function withdraw(address asset, uint256 amount) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        returns (uint256 withdrawnAmount) 
    {
        // Check if this is native token
        if (asset == NATIVE_TOKEN) {
            return withdrawNative(amount);
        }
        
        // Accrue interest
        _accrueInterest(asset);
        
        // Get user's supplied balance
        uint256 userSupply = supplyBalances[msg.sender][asset];
        require(userSupply > 0, "No supply balance");
        
        // Calculate withdrawal amount
        if (amount == 0) {
            withdrawnAmount = userSupply;
        } else {
            require(amount <= userSupply, "Insufficient balance");
            withdrawnAmount = amount;
        }
        
        // Check health factor after withdrawal
        uint256 newHealthFactor = _calculateHealthFactorAfterWithdraw(msg.sender, asset, withdrawnAmount);
        require(newHealthFactor >= MIN_HEALTH_FACTOR || _getTotalBorrowedValue(msg.sender) == 0, "Health factor too low");
        
        // Get aToken address
        AssetRegistry.AssetConfig memory config = assetRegistry.getAssetConfig(asset);
        IAToken aToken = IAToken(config.aTokenAddress);
        
        // Burn aTokens
        aToken.burn(msg.sender, withdrawnAmount);
        
        // Update balances
        supplyBalances[msg.sender][asset] -= withdrawnAmount;
        totalSupplied[asset] -= withdrawnAmount;
        
        // Update supplier count
        _updateSupplierCount(msg.sender, asset, supplyBalances[msg.sender][asset]);
        
        // Transfer asset to user
        IERC20 token = IERC20(asset);
        require(token.transfer(msg.sender, withdrawnAmount), "Transfer failed");
        
        emit Withdraw(msg.sender, asset, withdrawnAmount, block.timestamp);
        
        return withdrawnAmount;
    }
    
    /**
     * @dev Supply native token (ZTC) to the pool
     * @return aTokenAmount Amount of aTokens minted
     */
    function supplyNative() 
        external 
        payable 
        override 
        nonReentrant 
        whenNotPaused 
        returns (uint256 aTokenAmount) 
    {
        uint256 amount = msg.value;
        require(amount > 0, "Amount must be greater than 0");
        
        address asset = NATIVE_TOKEN;
        
        // Check if asset is supported
        require(assetRegistry.isAssetSupported(asset), "Asset not supported");
        
        // Accrue interest
        _accrueInterest(asset);
        
        // Native token is already received via msg.value, no transfer needed
        
        // Get aToken address
        AssetRegistry.AssetConfig memory config = assetRegistry.getAssetConfig(asset);
        IAToken aToken = IAToken(config.aTokenAddress);
        
        // Mint aTokens
        aToken.mint(msg.sender, amount);
        
        // Calculate aToken amount based on exchange rate
        uint256 exchangeRate = aToken.getExchangeRate();
        aTokenAmount = (amount * 1e18) / exchangeRate;
        
        // Update balances
        supplyBalances[msg.sender][asset] += amount;
        totalSupplied[asset] += amount;
        
        // Update supplier count
        _updateSupplierCount(msg.sender, asset, supplyBalances[msg.sender][asset]);
        
        emit Supply(msg.sender, asset, amount, aTokenAmount, block.timestamp);
        
        return aTokenAmount;
    }
    
    /**
     * @dev Withdraw native token (ZTC) from the pool
     * @param amount Amount to withdraw (0 = withdraw all)
     * @return withdrawnAmount Amount withdrawn
     */
    function withdrawNative(uint256 amount) 
        public 
        override 
        nonReentrant 
        whenNotPaused 
        returns (uint256 withdrawnAmount) 
    {
        address asset = NATIVE_TOKEN;
        
        // Accrue interest
        _accrueInterest(asset);
        
        // Get user's supplied balance
        uint256 userSupply = supplyBalances[msg.sender][asset];
        require(userSupply > 0, "No supply balance");
        
        // Calculate withdrawal amount
        if (amount == 0) {
            withdrawnAmount = userSupply;
        } else {
            require(amount <= userSupply, "Insufficient balance");
            withdrawnAmount = amount;
        }
        
        // Check health factor after withdrawal
        uint256 newHealthFactor = _calculateHealthFactorAfterWithdraw(msg.sender, asset, withdrawnAmount);
        require(newHealthFactor >= MIN_HEALTH_FACTOR || _getTotalBorrowedValue(msg.sender) == 0, "Health factor too low");
        
        // Get aToken address
        AssetRegistry.AssetConfig memory config = assetRegistry.getAssetConfig(asset);
        IAToken aToken = IAToken(config.aTokenAddress);
        
        // Burn aTokens
        aToken.burn(msg.sender, withdrawnAmount);
        
        // Update balances
        supplyBalances[msg.sender][asset] -= withdrawnAmount;
        totalSupplied[asset] -= withdrawnAmount;
        
        // Update supplier count
        _updateSupplierCount(msg.sender, asset, supplyBalances[msg.sender][asset]);
        
        // Transfer native token to user
        (bool success, ) = payable(msg.sender).call{value: withdrawnAmount}("");
        require(success, "Transfer failed");
        
        emit Withdraw(msg.sender, asset, withdrawnAmount, block.timestamp);
        
        return withdrawnAmount;
    }

    /**
     * @dev Borrow assets from the pool
     * @param asset Address of the asset to borrow
     * @param amount Amount to borrow
     * @return loanId Loan ID (always 0 for this implementation)
     */
    function borrow(address asset, uint256 amount) 
        external 
        override 
        nonReentrant 
        whenNotPaused 
        returns (uint256 loanId) 
    {
        require(amount > 0, "Amount must be greater than 0");
        
        // Check if asset is supported
        require(assetRegistry.isAssetSupported(asset), "Asset not supported");
        
        // Accrue interest
        _accrueInterest(asset);
        
        // Check available liquidity
        require(amount <= _getAvailableLiquidity(asset), "Insufficient liquidity");
        
        // Calculate health factor after borrow
        uint256 newHealthFactor = _calculateHealthFactorAfterBorrow(msg.sender, asset, amount);
        require(newHealthFactor >= MIN_HEALTH_FACTOR, "Health factor too low");
        
        // Update balances
        borrowBalances[msg.sender][asset] += amount;
        totalBorrowed[asset] += amount;
        
        // Update borrower count
        _updateBorrowerCount(msg.sender, asset, borrowBalances[msg.sender][asset]);
        
        // Transfer asset to user
        if (asset == NATIVE_TOKEN) {
            // Transfer native token
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            // Transfer ERC20 token
            IERC20 token = IERC20(asset);
            require(token.transfer(msg.sender, amount), "Transfer failed");
        }
        
        emit Borrow(msg.sender, asset, amount, 0, block.timestamp);
        
        return 0; // Simple implementation - no loan IDs
    }

    /**
     * @dev Repay borrowed assets
     * @param asset Address of the asset to repay
     * @param amount Amount to repay (0 = repay all)
     * @return repaidAmount Amount repaid
     */
    function repay(address asset, uint256 amount) 
        external 
        payable 
        override 
        nonReentrant 
        whenNotPaused 
        returns (uint256 repaidAmount) 
    {
        // Accrue interest first
        _accrueInterest(asset);
        
        // Get user's actual borrowed balance including accrued interest
        uint256 userBorrow = this.getBorrowBalance(msg.sender, asset);
        require(userBorrow > 0, "No borrow balance");
        
        // Determine repayment amount
        if (amount == 0) {
            // Repay full balance including interest
            repaidAmount = userBorrow;
        } else {
            require(amount <= userBorrow, "Amount exceeds debt");
            repaidAmount = amount;
        }
        
        // Transfer asset from user
        if (asset == NATIVE_TOKEN) {
            // For native token, use msg.value
            require(msg.value >= repaidAmount, "Insufficient payment");
            // Refund excess if any
            if (msg.value > repaidAmount) {
                (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - repaidAmount}("");
                require(refundSuccess, "Refund failed");
            }
        } else {
            // Transfer ERC20 token
            require(msg.value == 0, "Native token not accepted for ERC20 repay");
            IERC20 token = IERC20(asset);
            require(token.transferFrom(msg.sender, address(this), repaidAmount), "Transfer failed");
        }
        
        // Calculate principal and interest portions
        uint256 principal = borrowBalances[msg.sender][asset];
        uint256 interest = userBorrow - principal;
        
        // Determine how much of repayment goes to principal vs interest
        uint256 interestPaid;
        uint256 principalPaid;
        
        if (repaidAmount >= interest) {
            // Repay all interest first, then principal
            interestPaid = interest;
            principalPaid = repaidAmount - interest;
        } else {
            // Partial repayment only covers some interest
            interestPaid = repaidAmount;
            principalPaid = 0;
        }
        
        // Update balances
        borrowBalances[msg.sender][asset] -= principalPaid;
        totalBorrowed[asset] -= repaidAmount;
        
        // Update borrower count
        _updateBorrowerCount(msg.sender, asset, borrowBalances[msg.sender][asset]);
        
        emit Repay(msg.sender, asset, repaidAmount, block.timestamp);
        
        return repaidAmount;
    }

    /**
     * @dev Get user's supplied balance
     * @param user Address of the user
     * @param asset Address of the asset
     * @return balance Supplied balance
     */
    function getSupplyBalance(address user, address asset) 
        external 
        view 
        override 
        returns (uint256 balance) 
    {
        return supplyBalances[user][asset];
    }

    /**
     * @dev Get user's borrowed balance
     * @param user Address of the user
     * @param asset Address of the asset
     * @return balance Borrowed balance (including accrued interest)
     */
    function getBorrowBalance(address user, address asset) 
        external 
        view 
        override 
        returns (uint256 balance) 
    {
        uint256 baseBalance = borrowBalances[user][asset];
        if (baseBalance == 0) {
            return 0;
        }
        
        // Calculate accrued interest
        uint256 utilization = _calculateUtilization(asset);
        uint256 borrowRate = interestRateModel.getBorrowRate(utilization);
        uint256 timeElapsed = block.timestamp - lastInterestUpdate[asset];
        uint256 interestAccrued = (baseBalance * borrowRate * timeElapsed) / (365 days * 1e18);
        
        return baseBalance + interestAccrued;
    }

    /**
     * @dev Get user's health factor
     * @param user Address of the user
     * @return healthFactor Health factor (scaled to 1e18)
     */
    function getHealthFactor(address user) 
        external 
        view 
        override 
        returns (uint256 healthFactor) 
    {
        return _calculateHealthFactor(user);
    }

    /**
     * @dev Get available borrowing power
     * @param user Address of the user
     * @param asset Address of the asset
     * @return available Available borrowing power
     */
    function getAvailableBorrow(address user, address asset) 
        external 
        view 
        override 
        returns (uint256 available) 
    {
        // Calculate total collateral value
        uint256 totalCollateralValue = _calculateTotalCollateralValue(user);
        
        // Get asset LTV
        AssetRegistry.AssetConfig memory config = assetRegistry.getAssetConfig(asset);
        uint256 maxBorrowValue = (totalCollateralValue * config.ltv) / 1e18;
        
        // Calculate current borrowed value
        uint256 currentBorrowedValue = _calculateTotalBorrowedValue(user);
        
        // Calculate available borrow value
        if (maxBorrowValue <= currentBorrowedValue) {
            return 0;
        }
        
        uint256 availableBorrowValue = maxBorrowValue - currentBorrowedValue;
        
        // Get asset price
        uint256 assetPrice = oracle.getPrice(asset);
        if (assetPrice == 0) {
            return 0;
        }
        
        // Convert to asset amount
        available = (availableBorrowValue * 1e18) / assetPrice;
        
        // Cap by available liquidity
        uint256 availableLiquidity = _getAvailableLiquidity(asset);
        if (available > availableLiquidity) {
            available = availableLiquidity;
        }
        
        return available;
    }

    /**
     * @dev Get number of active suppliers for an asset
     * @param asset Address of the asset
     * @return count Number of active suppliers
     */
    function getActiveSuppliers(address asset) 
        external 
        view 
        returns (uint256 count) 
    {
        return activeSuppliers[asset];
    }

    /**
     * @dev Get number of active borrowers for an asset
     * @param asset Address of the asset
     * @return count Number of active borrowers
     */
    function getActiveBorrowers(address asset) 
        external 
        view 
        returns (uint256 count) 
    {
        return activeBorrowers[asset];
    }

    /**
     * @dev Liquidate a user's position
     * @param user Address of the user to liquidate
     * @param asset Address of the asset to liquidate
     * @param amount Amount to liquidate
     */
    function liquidate(address user, address asset, uint256 amount) 
        external 
        payable
        nonReentrant 
        whenNotPaused 
    {
        require(amount > 0, "Amount must be greater than 0");
        
        // Check health factor
        uint256 healthFactor = _calculateHealthFactor(user);
        require(healthFactor < MIN_HEALTH_FACTOR, "Health factor too high");
        
        // Accrue interest
        _accrueInterest(asset);
        
        // Get user's borrowed balance
        uint256 userBorrow = borrowBalances[user][asset];
        require(amount <= userBorrow, "Amount exceeds debt");
        
        // Calculate liquidation bonus
        uint256 liquidationBonus = (amount * LIQUIDATION_BONUS) / BASIS_POINTS;
        uint256 totalToRepay = amount + liquidationBonus;
        
        // Transfer repayment from liquidator
        if (asset == NATIVE_TOKEN) {
            // For native token, use msg.value
            require(msg.value >= amount, "Insufficient payment");
            // Refund excess if any
            if (msg.value > amount) {
                (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - amount}("");
                require(refundSuccess, "Refund failed");
            }
        } else {
            // Transfer ERC20 token
            require(msg.value == 0, "Native token not accepted for ERC20 liquidation");
            IERC20 token = IERC20(asset);
            require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        }
        
        // Update balances
        borrowBalances[user][asset] -= amount;
        totalBorrowed[asset] -= amount;
        
        // Transfer collateral to liquidator (simplified - in production, calculate collateral asset)
        // For now, we'll just emit the event
        emit Liquidation(msg.sender, user, asset, amount, block.timestamp);
    }

    /**
     * @dev Update supplier count when balance changes
     * @param user Address of the user
     * @param asset Address of the asset
     * @param newBalance New supply balance
     */
    function _updateSupplierCount(address user, address asset, uint256 newBalance) internal {
        bool wasSupplier = isSupplier[asset][user];
        bool isNowSupplier = newBalance > 0;
        
        if (wasSupplier && !isNowSupplier) {
            // User stopped being a supplier
            isSupplier[asset][user] = false;
            activeSuppliers[asset]--;
        } else if (!wasSupplier && isNowSupplier) {
            // User became a supplier
            isSupplier[asset][user] = true;
            activeSuppliers[asset]++;
        }
    }
    
    /**
     * @dev Update borrower count when balance changes
     * @param user Address of the user
     * @param asset Address of the asset
     * @param newBalance New borrow balance
     */
    function _updateBorrowerCount(address user, address asset, uint256 newBalance) internal {
        bool wasBorrower = isBorrower[asset][user];
        bool isNowBorrower = newBalance > 0;
        
        if (wasBorrower && !isNowBorrower) {
            // User stopped being a borrower
            isBorrower[asset][user] = false;
            activeBorrowers[asset]--;
        } else if (!wasBorrower && isNowBorrower) {
            // User became a borrower
            isBorrower[asset][user] = true;
            activeBorrowers[asset]++;
        }
    }

    /**
     * @dev Accrue interest for an asset
     * @param asset Address of the asset
     */
    function _accrueInterest(address asset) internal {
        if (totalSupplied[asset] == 0) {
            lastInterestUpdate[asset] = block.timestamp;
            return;
        }
        
        uint256 timeElapsed = block.timestamp - lastInterestUpdate[asset];
        if (timeElapsed == 0) {
            return;
        }
        
        // Calculate utilization
        uint256 utilization = _calculateUtilization(asset);
        
        // Calculate borrow rate
        uint256 borrowRate = interestRateModel.getBorrowRate(utilization);
        
        // Calculate interest accrued
        uint256 borrowInterest = (totalBorrowed[asset] * borrowRate * timeElapsed) / (365 days * 1e18);
        
        // Calculate reserve (10% of borrow interest)
        AssetRegistry.AssetConfig memory config = assetRegistry.getAssetConfig(asset);
        uint256 reserve = (borrowInterest * config.reserveFactor) / 1e18;
        uint256 supplyInterest = borrowInterest - reserve;
        
        // Update reserves
        reserveAccumulated[asset] += reserve;
        
        // Update total supplied (interest accrues to suppliers)
        totalSupplied[asset] += supplyInterest;
        
        // Update total borrowed
        totalBorrowed[asset] += borrowInterest;
        
        // Update aToken exchange rate
        if (config.aTokenAddress != address(0)) {
            IAToken aToken = IAToken(config.aTokenAddress);
            aToken.updateExchangeRate(supplyInterest);
        }
        
        lastInterestUpdate[asset] = block.timestamp;
        
        emit InterestAccrued(asset, supplyInterest, borrowInterest, block.timestamp);
    }

    /**
     * @dev Calculate utilization rate for an asset
     * @param asset Address of the asset
     * @return utilization Utilization rate (scaled to 1e18)
     */
    function _calculateUtilization(address asset) internal view returns (uint256 utilization) {
        if (totalSupplied[asset] == 0) {
            return 0;
        }
        return (totalBorrowed[asset] * 1e18) / totalSupplied[asset];
    }

    /**
     * @dev Calculate total collateral value for a user
     * @param user Address of the user
     * @return totalValue Total collateral value in USD (scaled to 1e18)
     */
    function _calculateTotalCollateralValue(address user) internal view returns (uint256 totalValue) {
        address[] memory supportedAssets = assetRegistry.getSupportedAssets();
        
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            address asset = supportedAssets[i];
            AssetRegistry.AssetConfig memory config = assetRegistry.getAssetConfig(asset);
            
            if (config.canBeCollateral && supplyBalances[user][asset] > 0) {
                uint256 assetPrice = oracle.getPrice(asset);
                if (assetPrice > 0) {
                    uint256 assetValue = (supplyBalances[user][asset] * assetPrice) / 1e18;
                    totalValue += assetValue;
                }
            }
        }
        
        return totalValue;
    }

    /**
     * @dev Calculate total borrowed value for a user
     * @param user Address of the user
     * @return totalValue Total borrowed value in USD (scaled to 1e18)
     */
    function _calculateTotalBorrowedValue(address user) internal view returns (uint256 totalValue) {
        address[] memory supportedAssets = assetRegistry.getSupportedAssets();
        
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            address asset = supportedAssets[i];
            uint256 borrowBalance = this.getBorrowBalance(user, asset);
            
            if (borrowBalance > 0) {
                uint256 assetPrice = oracle.getPrice(asset);
                if (assetPrice > 0) {
                    uint256 decimals = _getAssetDecimals(asset);
                    // Convert to USD value: (balance * price) / (10^decimals)
                    // Price is in 1e18 scale, result should be in 1e18 (USD) scale
                    uint256 assetValue = (borrowBalance * assetPrice) / (10 ** decimals);
                    totalValue += assetValue;
                }
            }
        }
        
        return totalValue;
    }

    /**
     * @dev Calculate health factor for a user
     * @param user Address of the user
     * @return healthFactor Health factor (scaled to 1e18)
     */
    function _calculateHealthFactor(address user) internal view returns (uint256 healthFactor) {
        uint256 totalBorrowedValue = _calculateTotalBorrowedValue(user);
        
        if (totalBorrowedValue == 0) {
            return type(uint256).max; // Infinite health factor if no borrows
        }
        
        // Calculate total collateral value with liquidation thresholds
        address[] memory supportedAssets = assetRegistry.getSupportedAssets();
        uint256 totalCollateralValue = 0;
        
        for (uint256 i = 0; i < supportedAssets.length; i++) {
            address asset = supportedAssets[i];
            AssetRegistry.AssetConfig memory config = assetRegistry.getAssetConfig(asset);
            
            if (config.canBeCollateral && supplyBalances[user][asset] > 0) {
                uint256 assetPrice = oracle.getPrice(asset);
                if (assetPrice > 0) {
                    uint256 decimals = _getAssetDecimals(asset);
                    // Convert to USD value: (balance * price) / (10^decimals)
                    // Price is in 1e18 scale, result should be in 1e18 (USD) scale
                    uint256 assetValue = (supplyBalances[user][asset] * assetPrice) / (10 ** decimals);
                    uint256 collateralValue = (assetValue * config.liquidationThreshold) / 1e18;
                    totalCollateralValue += collateralValue;
                }
            }
        }
        
        // Health Factor = Total Collateral Value / Total Borrowed Value
        return (totalCollateralValue * 1e18) / totalBorrowedValue;
    }

    /**
     * @dev Calculate health factor after withdraw
     */
    function _calculateHealthFactorAfterWithdraw(address user, address asset, uint256 amount) 
        internal 
        view 
        returns (uint256 healthFactor) 
    {
        uint256 totalCollateralValue = 0;
        uint256 totalBorrowedValue = 0;
        
        // Get all supported assets
        address[] memory assets = assetRegistry.getSupportedAssets();
        
        for (uint256 i = 0; i < assets.length; i++) {
            address currentAsset = assets[i];
            AssetRegistry.AssetConfig memory config = assetRegistry.getAssetConfig(currentAsset);
            uint256 price = oracle.getPrice(currentAsset);
            
            // Get proper decimals for the asset
            uint256 decimals = _getAssetDecimals(currentAsset);
            
            // Calculate supplied value (subtract withdrawal amount if it's the same asset)
            uint256 suppliedBalance = supplyBalances[user][currentAsset];
            if (currentAsset == asset) {
                // Reduce by withdrawal amount
                if (suppliedBalance >= amount) {
                    suppliedBalance -= amount;
                } else {
                    suppliedBalance = 0;
                }
            }
            
            if (suppliedBalance > 0) {
                // Convert to USD value: (balance * price) / (10^decimals)
                // Price is in 1e18 scale, result should be in 1e18 (USD) scale
                uint256 suppliedValue = (suppliedBalance * price) / (10 ** decimals);
                uint256 collateralValue = (suppliedValue * config.liquidationThreshold) / 1e18; // Use liquidation threshold for health factor
                totalCollateralValue += collateralValue;
            }
            
            // Calculate borrowed value (unchanged by withdrawal)
            uint256 borrowedBalance = borrowBalances[user][currentAsset];
            if (borrowedBalance > 0) {
                // Convert to USD value: (balance * price) / (10^decimals)
                // Price is in 1e18 scale, result should be in 1e18 (USD) scale
                uint256 borrowedValue = (borrowedBalance * price) / (10 ** decimals);
                totalBorrowedValue += borrowedValue;
            }
        }
        
        // If no borrowed value, return max health factor
        if (totalBorrowedValue == 0) {
            return type(uint256).max;
        }
        
        // Health Factor = Total Collateral Value / Total Borrowed Value
        return (totalCollateralValue * 1e18) / totalBorrowedValue;
    }

    /**
     * @dev Calculate health factor after borrow
     */
    function _calculateHealthFactorAfterBorrow(address user, address asset, uint256 amount) 
        internal 
        view 
        returns (uint256 healthFactor) 
    {
        uint256 totalCollateralValue = 0;
        uint256 totalBorrowedValue = 0;
        
        // Get all supported assets
        address[] memory assets = assetRegistry.getSupportedAssets();
        
        for (uint256 i = 0; i < assets.length; i++) {
            address currentAsset = assets[i];
            AssetRegistry.AssetConfig memory config = assetRegistry.getAssetConfig(currentAsset);
            uint256 price = oracle.getPrice(currentAsset);
            
            // Get proper decimals for the asset
            uint256 decimals = _getAssetDecimals(currentAsset);
            
            // Calculate supplied value (unchanged by borrowing)
            uint256 suppliedBalance = supplyBalances[user][currentAsset];
            if (suppliedBalance > 0) {
                // Convert to USD value: (balance * price) / (10^decimals)
                // Price is in 1e18 scale, result should be in 1e18 (USD) scale
                uint256 suppliedValue = (suppliedBalance * price) / (10 ** decimals);
                uint256 collateralValue = (suppliedValue * config.liquidationThreshold) / 1e18; // Use liquidation threshold for health factor
                totalCollateralValue += collateralValue;
            }
            
            // Calculate borrowed value (add borrow amount if it's the same asset)
            uint256 borrowedBalance = borrowBalances[user][currentAsset];
            if (currentAsset == asset) {
                borrowedBalance += amount;
            }
            
            if (borrowedBalance > 0) {
                // Convert to USD value: (balance * price) / (10^decimals)
                // Price is in 1e18 scale, result should be in 1e18 (USD) scale
                uint256 borrowedValue = (borrowedBalance * price) / (10 ** decimals);
                totalBorrowedValue += borrowedValue;
            }
        }
        
        // If no borrowed value, return max health factor
        if (totalBorrowedValue == 0) {
            return type(uint256).max;
        }
        
        // Health Factor = Total Collateral Value / Total Borrowed Value
        return (totalCollateralValue * 1e18) / totalBorrowedValue;
    }

    /**
     * @dev Get available liquidity for an asset
     * @param asset Address of the asset
     * @return available Available liquidity
     */
    function _getAvailableLiquidity(address asset) internal view returns (uint256 available) {
        uint256 supplied = totalSupplied[asset];
        uint256 borrowed = totalBorrowed[asset];
        
        if (supplied <= borrowed) {
            return 0;
        }
        
        return supplied - borrowed;
    }

    /**
     * @dev Get total borrowed value for a user across all assets
     * @param user Address of the user
     * @return totalValue Total borrowed value in USD (scaled to 1e18)
     */
    function _getTotalBorrowedValue(address user) internal view returns (uint256 totalValue) {
        address[] memory assets = assetRegistry.getSupportedAssets();
        
        for (uint256 i = 0; i < assets.length; i++) {
            address currentAsset = assets[i];
            uint256 borrowedBalance = borrowBalances[user][currentAsset];
            
            if (borrowedBalance > 0) {
                uint256 price = oracle.getPrice(currentAsset);
                uint256 decimals = _getAssetDecimals(currentAsset);
                // Convert to USD value: (balance * price) / (10^decimals)
                // Price is in 1e18 scale, result should be in 1e18 (USD) scale
                uint256 borrowedValue = (borrowedBalance * price) / (10 ** decimals);
                totalValue += borrowedValue;
            }
        }
        
        return totalValue;
    }

    /**
     * @dev Pause the contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get decimals for an asset
     * @param asset Address of the asset
     * @return decimals Number of decimals
     */
    function _getAssetDecimals(address asset) internal pure returns (uint256 decimals) {
        // Native token (ZTC) has 18 decimals
        if (asset == NATIVE_TOKEN) {
            return 18;
        }
        
        // Handle known token decimals
        // USDC and USDT have 6 decimals
        if (asset == 0x44D25859F79787fF937ec1305Dbf0866d6064E21 || // USDC
            asset == 0x2A0B66dEb779EF7DF45b064eF5cee2B1bF6E5DD5) { // USDT
            return 6;
        }
        
        // All other tokens default to 18 decimals
        // (WBTC, ZFI, ZY, DUM1, DUM2, etc.)
        return 18;
    }
    
    /**
     * @dev Receive function to accept native tokens
     */
    receive() external payable {
        // Allow receiving native tokens for supplyNative
    }
    
    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("Function not found");
    }
}

