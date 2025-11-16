# Deployment Troubleshooting Guide

## Issue: RPC Endpoint Not Reachable

### Error Message
```
Error: getaddrinfo ENOTFOUND zenchain-testnet.api.onfinality.io
```

### What This Means
The DNS lookup for the RPC endpoint is failing. This could mean:
- The endpoint is temporarily down
- DNS resolution is failing
- The endpoint URL has changed
- Network connectivity issues

## Solutions

### Solution 1: Test RPC Connectivity

Run the RPC connection test script:
```bash
cd contracts
npm run test-rpc
```

This will test multiple RPC endpoints and tell you which one works.

### Solution 2: Check ZenChain Documentation

1. Visit ZenChain's official documentation or website
2. Look for "RPC Endpoints" or "Network Configuration"
3. Check for any updates or alternative endpoints
4. Check ZenChain Discord/Telegram for network status updates

### Solution 3: Try Alternative RPC Endpoints

Update your `contracts/.env` file with alternative endpoints:

```env
# Option 1: Try without /public
ZENCHAIN_RPC_URL=https://zenchain-testnet.api.onfinality.io

# Option 2: Try direct ZenChain RPC (if available)
ZENCHAIN_RPC_URL=https://rpc.zenchain.io

# Option 3: Try public RPC node (if available)
ZENCHAIN_RPC_URL=https://zenchain-testnet-rpc.publicnode.com

# Option 4: Check ZenChain docs for latest endpoint
```

### Solution 4: Use Existing Deployment (Temporary)

Since contracts are already deployed, you can:

1. **Use existing contracts** (without native token support):
   - Contracts are at addresses in `contracts/deployments/zenchain-testnet.json`
   - Update frontend `.env.local` with these addresses
   - Test basic functionality (ERC20 tokens will work)

2. **Wait for RPC to come back online**, then deploy new contracts with native token support

### Solution 5: Deploy Locally First

Test the deployment locally:
```bash
cd contracts

# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy locally
npm run deploy:zenfinance:local
```

This will let you test the native token functionality locally.

### Solution 6: Check Network Status

1. **Check ZenChain Status Page** (if available)
2. **Check ZenChain Discord/Telegram** for network announcements
3. **Check Block Explorer**: Visit https://zentrace.io to see if blocks are being produced
4. **Test with Wallet**: Try connecting MetaMask to ZenChain testnet to see if it works

## Current Deployment Status

**Already Deployed Contracts** (without native token support):
- Pool: `0xcE756d8002623A1F537dd214F388ab7061d58a53`
- Oracle: `0x17Cd75B2824EDd109fE6b12D165bE73999Bc2bD9`
- AssetRegistry: `0x1681C5614f7eF53D9cFc0E92aB1Ee1f4d4918E2D`

**Note**: These contracts don't have native token support. You'll need to deploy new contracts.

## Recommended Next Steps

1. **Run RPC Test**: `cd contracts && npm run test-rpc`
2. **Check ZenChain Docs**: Look for updated RPC endpoints
3. **Try Alternative Endpoints**: Update `.env` with different endpoints
4. **Deploy Locally**: Test locally first to ensure everything works
5. **Wait and Retry**: If endpoint is temporarily down, wait and try again later

## Quick Fix: Test Locally

If you just want to test the native token functionality:

```bash
cd contracts

# Terminal 1
npx hardhat node

# Terminal 2
npm run deploy:zenfinance:local

# Copy the deployed addresses to frontend/.env.local
# Update frontend to use localhost network
# Test native token supply/withdraw
```

## Contact

If the RPC endpoint continues to be unavailable:
1. Check ZenChain official channels (Discord, Telegram, Twitter)
2. Check ZenChain documentation for updated endpoints
3. Consider using a different testnet for development/testing

