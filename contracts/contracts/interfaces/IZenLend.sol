// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IERC20.sol";

interface IZenLend {
    // Core Lending Functions
    function deposit(address asset, uint256 amount) external returns (uint256);
    function borrow(address asset, uint256 amount, address collateralAsset, uint256 collateralAmount) external returns (uint256);
    function repay(uint256 loanId, uint256 amount) external returns (bool);
    function withdraw(address asset, uint256 amount) external returns (bool);
    
    // BTC-Redeemable Lending
    function createMortgage(address asset, uint256 amount, bytes calldata btcProof) external returns (uint256);
    function redeemBTC(uint256 mortgageId, bytes calldata redemptionProof) external returns (bool);
    
    // Vault Functions
    function createVault(address collateralAsset, uint256 collateralAmount) external returns (uint256);
    function stakeToVault(uint256 vaultId, uint256 stakeAmount) external returns (bool);
    function mintZBTC(uint256 vaultId, uint256 amount) external returns (bool);
    
    // Liquidation
    function liquidate(uint256 loanId) external returns (bool);
    function crossChainLiquidate(uint256 loanId, uint256 chainId) external returns (bool);
    
    // Yield & Debt Shares
    function depositToYieldAggregator(address asset, uint256 amount) external returns (uint256);
    function mintDebtShareToken(uint256 loanId, uint256 amount) external returns (uint256);
    
    // Events
    event Deposit(address indexed user, address indexed asset, uint256 amount, uint256 timestamp);
    event Borrow(address indexed user, address indexed asset, uint256 amount, uint256 loanId, uint256 timestamp);
    event Repay(address indexed user, uint256 indexed loanId, uint256 amount, uint256 timestamp);
    event Liquidation(address indexed liquidator, uint256 indexed loanId, uint256 collateralSeized, uint256 timestamp);
    event MortgageCreated(address indexed user, uint256 indexed mortgageId, address asset, uint256 amount, uint256 timestamp);
    event BTCRedeemed(uint256 indexed mortgageId, bytes btcAddress, uint256 timestamp);
}
