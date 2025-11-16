import { ethers } from "hardhat";

/**
 * Test script to verify ZenFinance contracts work correctly
 * Tests: Supply, Borrow, Withdraw, Repay, Health Factor
 */

// Deployment addresses from localhost deployment
const CONTRACTS = {
  pool: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
  oracle: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  assetRegistry: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  aUSDC: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
};

// Test asset addresses (using mock addresses for local testing)
// In real testnet, these would be the actual token addresses
const TEST_ASSETS = {
  USDC: "0x44D25859F79787fF937ec1305Dbf0866d6064E21",
};

async function main() {
  console.log("==========================================");
  console.log("Testing ZenFinance Contracts");
  console.log("==========================================\n");

  const [deployer, user1] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Test User:", user1.address);
  console.log("");

  // Get contract instances
  const pool = await ethers.getContractAt("ZenFinancePool", CONTRACTS.pool);
  const oracle = await ethers.getContractAt("Oracle", CONTRACTS.oracle);
  const assetRegistry = await ethers.getContractAt("AssetRegistry", CONTRACTS.assetRegistry);
  const aUSDC = await ethers.getContractAt("AToken", CONTRACTS.aUSDC);

  console.log("✓ Contracts loaded");
  console.log("");

  // Test 1: Check Oracle
  console.log("Test 1: Checking Oracle...");
  try {
    // Set a test price for USDC (should be $1)
    const usdcPrice = ethers.parseEther("1"); // $1 = 1e18
    await oracle.updatePrice(TEST_ASSETS.USDC, usdcPrice);
    const price = await oracle.getPrice(TEST_ASSETS.USDC);
    console.log(`  ✓ USDC Price set: ${ethers.formatEther(price)} USD`);
    console.log("");
  } catch (error: any) {
    console.log(`  ✗ Oracle test failed: ${error.message}`);
    console.log("");
  }

  // Test 2: Check Asset Registry
  console.log("Test 2: Checking Asset Registry...");
  try {
    const isSupported = await assetRegistry.isAssetSupported(TEST_ASSETS.USDC);
    console.log(`  ✓ USDC is supported: ${isSupported}`);
    
    if (isSupported) {
      const config = await assetRegistry.getAssetConfig(TEST_ASSETS.USDC);
      console.log(`  ✓ LTV: ${ethers.formatEther(config.ltv) * 100}%`);
      console.log(`  ✓ Liquidation Threshold: ${ethers.formatEther(config.liquidationThreshold) * 100}%`);
      console.log(`  ✓ Reserve Factor: ${ethers.formatEther(config.reserveFactor) * 100}%`);
    }
    console.log("");
  } catch (error: any) {
    console.log(`  ✗ Asset Registry test failed: ${error.message}`);
    console.log("");
  }

  // Test 3: Check Pool State
  console.log("Test 3: Checking Pool State...");
  try {
    const totalSupplied = await pool.totalSupplied(TEST_ASSETS.USDC);
    const totalBorrowed = await pool.totalBorrowed(TEST_ASSETS.USDC);
    console.log(`  ✓ Total Supplied: ${ethers.formatUnits(totalSupplied, 6)} USDC`);
    console.log(`  ✓ Total Borrowed: ${ethers.formatUnits(totalBorrowed, 6)} USDC`);
    console.log("");
  } catch (error: any) {
    console.log(`  ✗ Pool state check failed: ${error.message}`);
    console.log("");
  }

  // Test 4: Check User Health Factor
  console.log("Test 4: Checking User Health Factor...");
  try {
    const healthFactor = await pool.getHealthFactor(user1.address);
    if (healthFactor === ethers.MaxUint256) {
      console.log(`  ✓ Health Factor: ∞ (no borrows)`);
    } else {
      console.log(`  ✓ Health Factor: ${ethers.formatEther(healthFactor)}`);
    }
    console.log("");
  } catch (error: any) {
    console.log(`  ✗ Health factor check failed: ${error.message}`);
    console.log("");
  }

  // Test 5: Check Available Borrow
  console.log("Test 5: Checking Available Borrow...");
  try {
    const availableBorrow = await pool.getAvailableBorrow(user1.address, TEST_ASSETS.USDC);
    console.log(`  ✓ Available Borrow: ${ethers.formatUnits(availableBorrow, 6)} USDC`);
    console.log("");
  } catch (error: any) {
    console.log(`  ✗ Available borrow check failed: ${error.message}`);
    console.log("");
  }

  // Note: For full testing with supply/borrow, we would need:
  // 1. Mock ERC20 tokens with actual balances
  // 2. Approve tokens to the pool
  // 3. Test supply, borrow, withdraw, repay flows

  console.log("==========================================");
  console.log("Basic Contract Tests Completed");
  console.log("==========================================");
  console.log("\nNote: Full integration tests require:");
  console.log("1. Mock ERC20 tokens with balances");
  console.log("2. Token approvals");
  console.log("3. Actual supply/borrow transactions");
  console.log("\nTo run full tests, use: npm test");
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

