import { ethers } from "hardhat";

async function main() {
    // Connect to deployed contracts
    const poolAddress = "0x7251d6585cBadA789389589F3A7EbF28DD54ECD4"; // From .env.local
    const pool = await ethers.getContractAt("ZenFinancePool", poolAddress);
    
    // Get asset registry and oracle addresses
    const assetRegistryAddress = await pool.assetRegistry();
    const oracleAddress = await pool.oracle();
    
    const assetRegistry = await ethers.getContractAt("AssetRegistry", assetRegistryAddress);
    const oracle = await ethers.getContractAt("Oracle", oracleAddress);
    
    console.log("==========================================");
    console.log("Debug Borrowing Power Issue");
    console.log("==========================================");
    
    // ZTC address (native token)
    const ZTC_ADDRESS = "0x0000000000000000000000000000000000000804";
    const USDT_ADDRESS = "0x2A0B66dEb779EF7DF45b064eF5cee2B1bF6E5DD5";
    const USDC_ADDRESS = "0x44D25859F79787fF937ec1305Dbf0866d6064E21";
    
    // Test user address (second account from your description)
    const testUserAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // This is account #1 from Hardhat
    
    console.log("Test User Address:", testUserAddress);
    console.log("");
    
    // Check ZTC supply balance
    const ztcSupplyBalance = await pool.getSupplyBalance(testUserAddress, ZTC_ADDRESS);
    console.log("ZTC Supply Balance:", ethers.formatEther(ztcSupplyBalance), "ZTC");
    
    // Check ZTC price from oracle
    const ztcPrice = await oracle.getPrice(ZTC_ADDRESS);
    console.log("ZTC Price:", ethers.formatEther(ztcPrice), "USD");
    
    // Check ZTC asset config
    const ztcConfig = await assetRegistry.getAssetConfig(ZTC_ADDRESS);
    console.log("ZTC LTV:", ethers.formatEther(ztcConfig.ltv));
    console.log("ZTC Liquidation Threshold:", ethers.formatEther(ztcConfig.liquidationThreshold));
    console.log("");
    
    // Calculate collateral value
    const ztcSupplyValue = (ztcSupplyBalance * ztcPrice) / (10n ** 18n);
    const ztcCollateralValue = (ztcSupplyValue * ztcConfig.ltv) / (10n ** 18n);
    console.log("ZTC Supply Value:", ethers.formatEther(ztcSupplyValue), "USD");
    console.log("ZTC Collateral Value (with LTV):", ethers.formatEther(ztcCollateralValue), "USD");
    console.log("");
    
    // Check borrowed balances
    const usdtBorrowBalance = await pool.getBorrowBalance(testUserAddress, USDT_ADDRESS);
    const usdcBorrowBalance = await pool.getBorrowBalance(testUserAddress, USDC_ADDRESS);
    
    console.log("USDT Borrow Balance:", ethers.formatUnits(usdtBorrowBalance, 6), "USDT");
    console.log("USDC Borrow Balance:", ethers.formatUnits(usdcBorrowBalance, 6), "USDC");
    
    // Get prices for borrowed assets
    const usdtPrice = await oracle.getPrice(USDT_ADDRESS);
    const usdcPrice = await oracle.getPrice(USDC_ADDRESS);
    
    console.log("USDT Price:", ethers.formatEther(usdtPrice), "USD");
    console.log("USDC Price:", ethers.formatEther(usdcPrice), "USD");
    
    // Calculate borrowed value
    const usdtBorrowValue = (usdtBorrowBalance * usdtPrice) / (10n ** 18n);
    const usdcBorrowValue = (usdcBorrowBalance * usdcPrice) / (10n ** 18n);
    const totalBorrowValue = usdtBorrowValue + usdcBorrowValue;
    
    console.log("USDT Borrow Value:", ethers.formatEther(usdtBorrowValue), "USD");
    console.log("USDC Borrow Value:", ethers.formatEther(usdcBorrowValue), "USD");
    console.log("Total Borrow Value:", ethers.formatEther(totalBorrowValue), "USD");
    console.log("");
    
    // Calculate health factor
    const healthFactor = await pool.calculateHealthFactor(testUserAddress);
    console.log("Current Health Factor:", ethers.formatEther(healthFactor));
    
    // Calculate expected health factor manually
    if (totalBorrowValue > 0n) {
        const expectedHealthFactor = (ztcCollateralValue * (10n ** 18n)) / totalBorrowValue;
        console.log("Expected Health Factor:", ethers.formatEther(expectedHealthFactor));
    }
    
    console.log("");
    console.log("Min Health Factor Required:", ethers.formatEther(await pool.MIN_HEALTH_FACTOR()));
    
    console.log("==========================================");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });