# RPC Endpoint Troubleshooting

## Issue
DNS error when trying to connect to ZenChain testnet RPC:
```
Error: getaddrinfo ENOTFOUND zenchain-testnet.api.onfinality.io
```

## Possible Causes

1. **RPC Endpoint is Down**: The OnFinality endpoint might be temporarily unavailable
2. **DNS Resolution Issue**: Your network might have DNS issues
3. **Endpoint Changed**: The RPC endpoint URL might have changed
4. **Network Connectivity**: Firewall or network restrictions

## Solutions

### Solution 1: Check if Contracts Are Already Deployed

Since you already have a deployment file (`contracts/deployments/zenchain-testnet.json`), you might not need to redeploy. The contracts with native token support can be deployed as an upgrade, or you can use the existing deployment if it works.

### Solution 2: Try Alternative RPC Endpoints

Try updating your `.env` file with alternative RPC endpoints:

```env
# Option 1: Direct ZenChain RPC (if available)
ZENCHAIN_RPC_URL=https://rpc.zenchain.io

# Option 2: Public RPC (if available)
ZENCHAIN_RPC_URL=https://zenchain-testnet-rpc.publicnode.com

# Option 3: Check ZenChain documentation for latest RPC
# Visit: https://docs.zenchain.io or https://zenchain.io
```

### Solution 3: Check ZenChain Documentation

1. Visit ZenChain official documentation
2. Check for updated RPC endpoints
3. Look for alternative RPC providers (Alchemy, Infura, etc.)
4. Check ZenChain Discord/Telegram for network status

### Solution 4: Test Network Connectivity

```bash
# Test DNS resolution
nslookup zenchain-testnet.api.onfinality.io

# Test HTTP connection
curl -X POST https://zenchain-testnet.api.onfinality.io/public \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Or use a browser to test
# Visit: https://zenchain-testnet.api.onfinality.io/public
```

### Solution 5: Use Existing Deployment

If your contracts are already deployed, you can:
1. Use the existing contract addresses from `contracts/deployments/zenchain-testnet.json`
2. Update the frontend with those addresses
3. Test the native token functionality (it might already work if the contracts support it)

### Solution 6: Deploy to Local Network First

Test the deployment locally first:
```bash
cd contracts
npx hardhat node
npm run deploy:local
```

Then test the native token functionality locally before deploying to testnet.

## Next Steps

1. **Check ZenChain Status**: Visit ZenChain's official channels to check if the testnet is operational
2. **Try Alternative Endpoints**: Update `.env` with alternative RPC URLs
3. **Use Existing Deployment**: If contracts are already deployed, use those addresses
4. **Deploy Locally**: Test locally first to ensure everything works

## Current Deployment Status

Based on `contracts/deployments/zenchain-testnet.json`:
- Pool: `0xcE756d8002623A1F537dd214F388ab7061d58a53`
- Oracle: `0x17Cd75B2824EDd109fE6b12D165bE73999Bc2bD9`
- AssetRegistry: `0x1681C5614f7eF53D9cFc0E92aB1Ee1f4d4918E2D`

**Note**: These contracts were deployed with the old code (without native token support). You'll need to deploy new contracts or upgrade existing ones to support native token operations.

## Recommendation

Since the RPC endpoint is not reachable:
1. Check ZenChain's official documentation for the correct RPC endpoint
2. Try using the existing deployment to test if basic functionality works
3. Wait for the RPC endpoint to come back online
4. Consider deploying to a local network for testing

