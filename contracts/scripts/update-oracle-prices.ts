import { ethers } from "hardhat";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

config();

/**
 * Script to update Oracle prices after deployment
 * This sets initial prices for all assets
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

// Initial prices in USD (scaled to 1e18)
// Update these with real market prices
const INITIAL_PRICES: Record<string, string> = {
  WBTC: "100000", // $100,000 per WBTC
  USDC: "1", // $1 per USDC (already set in constructor)
  USDT: "1", // $1 per USDT
  ZTC: "1.45", // $1.45 per ZTC
  ZFI: "0.117", // $0.117 per ZFI
  ZY: "0.22", // $0.22 per ZY
  DUM1: "0.0108", // $0.0108 per DUM1
  DUM2: "0.04", // $0.04 per DUM2
};

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("==========================================");
  console.log("Updating Oracle Prices");
  console.log("==========================================");
  console.log("Deployer address:", deployer.address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  console.log("==========================================\n");

  // Load deployment addresses
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, "zenchain-testnet.json");
  
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found!");
    console.error(`   Expected: ${deploymentFile}`);
    console.error("   Please run deployment first: npm run deploy:zenfinance");
    process.exit(1);
  }

  const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  const oracleAddress = deploymentData.contracts.oracle;

  if (!oracleAddress) {
    console.error("❌ Oracle address not found in deployment file!");
    process.exit(1);
  }

  console.log("Oracle address:", oracleAddress);
  console.log("");

  // Get Oracle contract
  const Oracle = await ethers.getContractFactory("Oracle");
  const oracle = Oracle.attach(oracleAddress) as any;

  // Update prices for each asset
  console.log("Updating prices...\n");
  for (const [symbol, assetAddress] of Object.entries(ASSETS)) {
    const priceUSD = INITIAL_PRICES[symbol];
    
    if (!priceUSD) {
      console.log(`⚠️  Skipping ${symbol} - no price configured`);
      continue;
    }

    try {
      // Convert price to wei (1e18)
      const priceWei = ethers.parseEther(priceUSD);
      
      console.log(`Setting price for ${symbol}...`);
      console.log(`  Address: ${assetAddress}`);
      console.log(`  Price: $${priceUSD} (${priceWei.toString()})`);
      
      // Use manual gas parameters for Substrate compatibility
      const txOptions = {
        gasLimit: 500000,
        gasPrice: ethers.parseUnits("1", "gwei"),
      };
      
      const tx = await oracle.updatePrice(assetAddress, priceWei, txOptions);
      console.log(`  Transaction: ${tx.hash}`);
      
      await tx.wait();
      console.log(`  ✓ Price updated for ${symbol}\n`);
    } catch (error: any) {
      console.error(`  ❌ Failed to update price for ${symbol}:`, error.message);
      console.log("");
    }
  }

  // Verify prices
  console.log("==========================================");
  console.log("Verifying Prices");
  console.log("==========================================\n");
  for (const [symbol, assetAddress] of Object.entries(ASSETS)) {
    try {
      const price = await oracle.getPrice(assetAddress);
      const priceUSD = ethers.formatEther(price);
      console.log(`${symbol}: $${priceUSD}`);
    } catch (error: any) {
      console.error(`${symbol}: Error - ${error.message}`);
    }
  }

  console.log("\n==========================================");
  console.log("Price Update Complete!");
  console.log("==========================================");
  console.log("\nNote: Prices are cached for 5 minutes.");
  console.log("To update prices from DEX pairs, configure pair addresses in Oracle.");
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

