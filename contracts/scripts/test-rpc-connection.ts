/**
 * Test RPC Connection Script
 * Tests connectivity to ZenChain testnet RPC endpoints
 */

import { ethers } from "ethers";

const RPC_ENDPOINTS = [
  "https://zenchain-testnet.api.onfinality.io/public",
  "https://rpc.zenchain.io",
  "https://zenchain-testnet-rpc.publicnode.com",
  // Add more endpoints as you find them
];

async function testRPCConnection(url: string): Promise<boolean> {
  try {
    console.log(`Testing: ${url}...`);
    const provider = new ethers.JsonRpcProvider(url);
    
    // Test 1: Get chain ID
    const network = await provider.getNetwork();
    console.log(`  ✓ Chain ID: ${network.chainId}`);
    
    // Test 2: Get latest block
    const blockNumber = await provider.getBlockNumber();
    console.log(`  ✓ Latest block: ${blockNumber}`);
    
    // Test 3: Get balance (test if read operations work)
    const testAddress = "0x0000000000000000000000000000000000000000";
    const balance = await provider.getBalance(testAddress);
    console.log(`  ✓ Balance query works`);
    
    console.log(`  ✅ Connection successful!\n`);
    return true;
  } catch (error: any) {
    console.log(`  ❌ Connection failed: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log("==========================================");
  console.log("Testing ZenChain Testnet RPC Endpoints");
  console.log("==========================================\n");
  
  let workingEndpoint: string | null = null;
  
  for (const endpoint of RPC_ENDPOINTS) {
    const isWorking = await testRPCConnection(endpoint);
    if (isWorking && !workingEndpoint) {
      workingEndpoint = endpoint;
    }
  }
  
  console.log("==========================================");
  if (workingEndpoint) {
    console.log(`✅ Working endpoint found: ${workingEndpoint}`);
    console.log("\nUpdate your .env file with:");
    console.log(`ZENCHAIN_RPC_URL=${workingEndpoint}`);
  } else {
    console.log("❌ No working endpoints found");
    console.log("\nPossible solutions:");
    console.log("1. Check your internet connection");
    console.log("2. Check ZenChain documentation for updated RPC endpoints");
    console.log("3. Try again later (endpoint might be temporarily down)");
    console.log("4. Contact ZenChain support for RPC endpoint information");
  }
  console.log("==========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

