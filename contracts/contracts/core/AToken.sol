// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IAToken.sol";

/**
 * @title AToken
 * @dev Interest-bearing token for ZenFinance
 * Represents a user's supplied assets and accrues interest over time
 */
contract AToken is IAToken, ERC20, Ownable {
    address private immutable _underlyingAsset; // Address of the underlying asset
    address public pool; // Address of the lending pool
    
    uint256 private _totalUnderlying; // Total underlying asset balance
    uint256 private _exchangeRate; // Exchange rate (scaled to 1e18, where 1e18 = 1:1 initially)
    
    uint256 public constant INITIAL_EXCHANGE_RATE = 1e18; // Initial exchange rate (1:1)
    
    modifier onlyPool() {
        require(msg.sender == pool, "Only pool can call");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address underlyingAsset_,
        address _owner
    ) ERC20(name, symbol) Ownable(_owner) {
        _underlyingAsset = underlyingAsset_;
        _exchangeRate = INITIAL_EXCHANGE_RATE;
    }

    /**
     * @dev Set the pool address (only owner, can only be set once)
     */
    function setPool(address _pool) external onlyOwner {
        require(pool == address(0), "Pool already set");
        pool = _pool;
    }

    /**
     * @dev Mint aTokens to a user
     * @param to Address to mint to
     * @param amount Amount of underlying asset deposited
     */
    function mint(address to, uint256 amount) external override onlyPool {
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate aToken amount based on exchange rate
        uint256 aTokenAmount = (amount * 1e18) / _exchangeRate;
        
        // Update total underlying
        _totalUnderlying += amount;
        
        // Mint aTokens
        _mint(to, aTokenAmount);
    }

    /**
     * @dev Burn aTokens from a user
     * @param from Address to burn from
     * @param amount Amount of underlying asset to withdraw
     */
    function burn(address from, uint256 amount) external override onlyPool {
        require(amount > 0, "Amount must be greater than 0");
        
        // Calculate aToken amount to burn based on exchange rate
        uint256 aTokenAmount = (amount * 1e18) / _exchangeRate;
        
        // Update total underlying
        require(_totalUnderlying >= amount, "Insufficient underlying");
        _totalUnderlying -= amount;
        
        // Burn aTokens
        _burn(from, aTokenAmount);
    }

    /**
     * @dev Get the underlying asset address
     * @return Address of the underlying asset
     */
    function underlyingAsset() external view override returns (address) {
        return _underlyingAsset;
    }

    /**
     * @dev Get the exchange rate
     * @return exchangeRate Exchange rate (scaled to 1e18)
     */
    function getExchangeRate() external view override returns (uint256) {
        return _exchangeRate;
    }

    /**
     * @dev Get the total underlying asset balance
     * @return totalUnderlying Total underlying asset balance
     */
    function getTotalUnderlying() external view override returns (uint256) {
        return _totalUnderlying;
    }

    /**
     * @dev Update exchange rate based on interest accrued
     * This is called by the pool when interest accrues
     * @param interestAccrued Interest accrued since last update
     */
    function updateExchangeRate(uint256 interestAccrued) external onlyPool {
        if (_totalUnderlying == 0 || totalSupply() == 0) {
            return;
        }
        
        // Update total underlying with accrued interest
        _totalUnderlying += interestAccrued;
        
        // Update exchange rate: (Total Underlying / Total aTokens) * 1e18
        _exchangeRate = (_totalUnderlying * 1e18) / totalSupply();
    }

    /**
     * @dev Convert aToken amount to underlying amount
     * @param aTokenAmount Amount of aTokens
     * @return underlyingAmount Amount of underlying assets
     */
    function toUnderlyingAmount(uint256 aTokenAmount) external view returns (uint256 underlyingAmount) {
        return (aTokenAmount * _exchangeRate) / 1e18;
    }

    /**
     * @dev Convert underlying amount to aToken amount
     * @param underlyingAmount Amount of underlying assets
     * @return aTokenAmount Amount of aTokens
     */
    function toATokenAmount(uint256 underlyingAmount) external view returns (uint256 aTokenAmount) {
        return (underlyingAmount * 1e18) / _exchangeRate;
    }
}

