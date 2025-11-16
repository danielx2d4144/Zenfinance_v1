# Quick Fix: RPC Endpoint Issue

## Problem
ZenChain testnet RPC endpoints are not reachable. Deployment fails with DNS/timeout errors.

## Quick Solutions

### 1. Check if Testnet is Operational

Visit ZenTrace block explorer: https://zentrace.io
- If blocks are being produced → Testnet is up, RPC endpoint issue
- If no blocks → Testnet is down, wait for it to come back

### 2. Test Locally (Recommended)

Since RPC is down, test the native token functionality locally:

```bash
# Terminal 1: Start local node
cd contracts
npx hardhat node

# Terminal 2: Deploy locally
npm run deploy:zenfinance:local

# Copy the output addresses to frontend/.env.local
# Update frontend to use localhost network
# Test ZTC supply/withdraw locally
```

### 3. Wait and Retry

The RPC endpoint might be temporarily down. Wait a few hours and try again:
```bash
cd contracts
npm run deploy:zenfinance
```

### 4. Check ZenChain Status

- **Discord**: Check ZenChain Discord for network status
- **Telegram**: Check ZenChain Telegram for updates
- **Twitter**: Check ZenChain Twitter for announcements
- **Documentation**: Check ZenChain docs for updated RPC endpoints

## What's Ready

✅ **Code is ready**: Native token support is implemented and compiles successfully
✅ **Frontend is ready**: Hooks updated to use native functions for ZTC
⏳ **Waiting for RPC**: Cannot deploy until RPC is available

## Next Steps When RPC is Available

1. **Deploy contracts**:
   ```bash
   cd contracts
   npm run deploy:zenfinance
   ```

2. **Update frontend** with new addresses

3. **Test ZTC supply**:
   - Should see ONE transaction (supplyNative)
   - No approval needed for ZTC

4. **Verify on-chain**:
   - Check pool balance increased
   - Check your supply balance updated

## Summary

**Status**: Code ready ✅ | RPC unavailable ⏳

**Action**: Test locally first, then deploy to testnet when RPC is available.

