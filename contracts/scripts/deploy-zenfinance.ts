import { ethers } from "hardhat";
import { config } from "dotenv";

config();

/**
 * Deployment script for ZenFinance contracts
 * Deploys in the correct order with proper initialization
 */

// Asset addresses (from frontend config)
const ASSETS = {
  WBTC: "0xE267b9cC76a614b8E178b4552e9983d1F19CEB05",
  USDC: "0x44D25859F79787fF937ec1305Dbf0866d6064E21",
  USDT: "0x2A0B66dEb779EF7DF45b064eF5cee2B1bF6E5DD5",
  ZTC: "0x0000000000000000000000000000000000000804",
  ZFI: "0x867bb07d47A3BF3d1f6835a71A2Ba639bf445DA9",
  ZY: "0x7f7752745A56e5B09Bd8d9fE6d6C3b3477E441FF",
  DUM1: "0xfEf87C98507A92ee3968c40D2ebEbBE3638D7D29",
  DUM2: "0xFd029224030f6227B0Eee44003B464063707b1e9",
};

// Configuration constants (from frontend config)
const LTV = ethers.parseEther("0.75"); // 75%
const LIQUIDATION_THRESHOLD = ethers.parseEther("0.80"); // 80%
const RESERVE_FACTOR = ethers.parseEther("0.10"); // 10%

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("==========================================");
  console.log("Deploying ZenFinance Contracts");
  console.log("==========================================");
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ZTC");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("==========================================\n");

  // Step 1: Deploy Interest Rate Model
  console.log("Step 1: Deploying InterestRateModel...");
  const InterestRateModel = await ethers.getContractFactory("InterestRateModel");
  
  // Use manual gas parameters for Substrate compatibility
  const deployOptions = {
    gasLimit: 5000000, // 5M gas limit
    gasPrice: ethers.parseUnits("1", "gwei"), // 1 gwei
  };
  
  const interestRateModel = await InterestRateModel.deploy(deployOptions);
  await interestRateModel.waitForDeployment();
  const interestRateModelAddress = await interestRateModel.getAddress();
  console.log("✓ InterestRateModel deployed to:", interestRateModelAddress);
  console.log("");

  // Step 2: Deploy Oracle
  console.log("Step 2: Deploying Oracle...");
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = await Oracle.deploy(ASSETS.USDC, deployer.address, deployOptions);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("✓ Oracle deployed to:", oracleAddress);
  console.log("");

  // Step 3: Deploy Asset Registry
  console.log("Step 3: Deploying AssetRegistry...");
  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const assetRegistry = await AssetRegistry.deploy(deployer.address, deployOptions);
  await assetRegistry.waitForDeployment();
  const assetRegistryAddress = await assetRegistry.getAddress();
  console.log("✓ AssetRegistry deployed to:", assetRegistryAddress);
  console.log("");

  // Step 4: Deploy AToken contracts for each asset
  console.log("Step 4: Deploying AToken contracts...");
  const aTokenAddresses: Record<string, string> = {};
  const assetNames: Record<string, string> = {
    WBTC: "Zipped BTC",
    USDC: "USD Coin",
    USDT: "Tether",
    ZTC: "ZenChain Token",
    ZFI: "ZenFinance Token",
    ZY: "Zynft Token",
    DUM1: "DUMMY1 Token",
    DUM2: "DUMMY2 Token",
  };

  for (const [symbol, address] of Object.entries(ASSETS)) {
    console.log(`  Deploying aToken for ${symbol}...`);
    const AToken = await ethers.getContractFactory("AToken");
    const aToken = await AToken.deploy(
      `a${symbol}`,
      `a${symbol}`,
      address,
      deployer.address,
      deployOptions
    );
    await aToken.waitForDeployment();
    const aTokenAddress = await aToken.getAddress();
    aTokenAddresses[symbol] = aTokenAddress;
    console.log(`  ✓ a${symbol} deployed to:`, aTokenAddress);
  }
  console.log("");

  // Step 5: Deploy ZenFinance Pool
  console.log("Step 5: Deploying ZenFinancePool...");
  const ZenFinancePool = await ethers.getContractFactory("ZenFinancePool");
  const pool = await ZenFinancePool.deploy(
    oracleAddress,
    interestRateModelAddress,
    assetRegistryAddress,
    deployer.address,
    deployOptions
  );
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("✓ ZenFinancePool deployed to:", poolAddress);
  console.log("");

  // Step 6: Set pool address in all AToken contracts
  console.log("Step 6: Setting pool address in AToken contracts...");
  const txOptions = {
    gasLimit: 500000,
    gasPrice: ethers.parseUnits("1", "gwei"),
  };
  
  for (const [symbol, aTokenAddress] of Object.entries(aTokenAddresses)) {
    try {
      const aToken = await ethers.getContractAt("AToken", aTokenAddress);
      const tx = await aToken.setPool(poolAddress, txOptions);
      await tx.wait();
      console.log(`  ✓ Set pool address in a${symbol}`);
    } catch (error: any) {
      console.error(`  ❌ Failed to set pool in a${symbol}:`, error.message);
      // Continue with other contracts
    }
  }
  console.log("");

  // Step 7: Register assets in Asset Registry
  console.log("Step 7: Registering assets in AssetRegistry...");
  for (const [symbol, address] of Object.entries(ASSETS)) {
    try {
      const tx = await assetRegistry.addAsset(
        address,
        LTV,
        LIQUIDATION_THRESHOLD,
        RESERVE_FACTOR,
        true, // canBeCollateral
        aTokenAddresses[symbol],
        txOptions
      );
      await tx.wait();
      console.log(`  ✓ Registered ${symbol} (${assetNames[symbol]})`);
    } catch (error: any) {
      console.error(`  ❌ Failed to register ${symbol}:`, error.message);
      // Continue with other assets
    }
  }
  console.log("");

  // Step 8: Initialize Oracle with fallback prices (optional - can be updated later)
  console.log("Step 8: Setting initial prices in Oracle...");
  console.log("  Note: Prices should be updated via Oracle.updatePrice() or from DEX pairs");
  console.log("  For now, setting placeholder prices (should be updated with real prices)");
  // Example: Set initial prices (in USD, scaled to 1e18)
  // await oracle.updatePrice(ASSETS.WBTC, ethers.parseEther("60000")); // $60,000
  // await oracle.updatePrice(ASSETS.USDC, ethers.parseEther("1")); // $1 (already set)
  // await oracle.updatePrice(ASSETS.USDT, ethers.parseEther("1")); // $1
  // etc...
  console.log("  ⚠️  Skipping price initialization - update manually via Oracle");
  console.log("");

  // Summary
  console.log("==========================================");
  console.log("Deployment Summary");
  console.log("==========================================");
  console.log("InterestRateModel:", interestRateModelAddress);
  console.log("Oracle:", oracleAddress);
  console.log("AssetRegistry:", assetRegistryAddress);
  console.log("ZenFinancePool:", poolAddress);
  console.log("\nAToken Addresses:");
  for (const [symbol, address] of Object.entries(aTokenAddresses)) {
    console.log(`  a${symbol}:`, address);
  }
  console.log("==========================================");

  // Save deployment addresses to file
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentData = {
    network: "zenchain-testnet",
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      interestRateModel: interestRateModelAddress,
      oracle: oracleAddress,
      assetRegistry: assetRegistryAddress,
      pool: poolAddress,
      aTokens: aTokenAddresses,
    },
  };

  const deploymentFile = path.join(deploymentsDir, "zenchain-testnet.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
  console.log(`\n✓ Deployment addresses saved to: ${deploymentFile}`);

  // Generate frontend .env.local content
  console.log("\n==========================================");
  console.log("Frontend Environment Variables");
  console.log("==========================================");
  console.log("Copy these to frontend/.env.local:\n");
  console.log(`NEXT_PUBLIC_POOL_ADDRESS=${poolAddress}`);
  console.log(`NEXT_PUBLIC_ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS=${assetRegistryAddress}`);
  console.log(`NEXT_PUBLIC_INTEREST_RATE_MODEL_ADDRESS=${interestRateModelAddress}`);
  console.log("");
  for (const [symbol, address] of Object.entries(aTokenAddresses)) {
    console.log(`NEXT_PUBLIC_ATOKEN_${symbol}_ADDRESS=${address}`);
  }
  console.log("==========================================");

  console.log("\nNext Steps:");
  console.log("1. Copy the environment variables above to frontend/.env.local");
  console.log("2. Run: npm run update-oracle-prices (to set initial prices)");
  console.log("3. Verify contracts on block explorer (ZenTrace)");
  console.log("4. Test the contracts with supply/borrow operations");
  console.log("5. Test the frontend integration");
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

