# ZenFinance Deployment Guide

This guide will walk you through deploying ZenFinance contracts to Zenchain Testnet.

## Prerequisites

1. **Node.js 18+** and npm installed
2. **ZTC tokens** in your wallet for gas fees (get from faucet if needed)
3. **Private key** of the account you want to deploy from (keep this secure!)

## Step 1: Environment Setup

1. Navigate to the contracts directory:
```bash
cd contracts
```

2. Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```

3. Edit `.env` and add your private key:
```env
ZENCHAIN_RPC_URL=https://zenchain-testnet.api.onfinality.io/public
ZENCHAIN_CHAIN_ID=8408
PRIVATE_KEY=0x_your_private_key_here_without_0x_prefix
```

⚠️ **IMPORTANT**: Never commit your `.env` file to git! It contains your private key.

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Compile Contracts

```bash
npm run compile
```

This will compile all contracts and generate typechain types.

## Step 4: Check Your Balance

Make sure your deployer account has enough ZTC for gas fees. You can check your balance by:

1. Connect your wallet to Zenchain Testnet
2. Visit the faucet if needed
3. Or check in your wallet directly

## Step 5: Deploy to Zenchain Testnet

Run the deployment script:

```bash
npm run deploy:zenfinance
```

This will:
1. Deploy InterestRateModel
2. Deploy Oracle
3. Deploy AssetRegistry
4. Deploy AToken contracts for each asset
5. Deploy ZenFinancePool
6. Configure all contracts with proper addresses
7. Register all assets in the AssetRegistry

## Step 6: Save Deployment Addresses

After deployment, the script will output all contract addresses. **Save these addresses!** You'll need them for the frontend configuration.

Example output:
```
==========================================
Deployment Summary
==========================================
InterestRateModel: 0x...
Oracle: 0x...
AssetRegistry: 0x...
ZenFinancePool: 0x...

AToken Addresses:
  aWBTC: 0x...
  aUSDC: 0x...
  ...
==========================================
```

## Step 7: Update Frontend Configuration

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Create or update `.env.local`:
```env
# Contract Addresses
NEXT_PUBLIC_POOL_ADDRESS=0x_your_pool_address
NEXT_PUBLIC_ORACLE_ADDRESS=0x_your_oracle_address
NEXT_PUBLIC_ASSET_REGISTRY_ADDRESS=0x_your_asset_registry_address
NEXT_PUBLIC_INTEREST_RATE_MODEL_ADDRESS=0x_your_interest_rate_model_address

# AToken Addresses
NEXT_PUBLIC_ATOKEN_WBTC_ADDRESS=0x_your_atoken_wbtc_address
NEXT_PUBLIC_ATOKEN_USDC_ADDRESS=0x_your_atoken_usdc_address
NEXT_PUBLIC_ATOKEN_USDT_ADDRESS=0x_your_atoken_usdt_address
NEXT_PUBLIC_ATOKEN_ZTC_ADDRESS=0x_your_atoken_ztc_address
NEXT_PUBLIC_ATOKEN_ZFI_ADDRESS=0x_your_atoken_zfi_address
NEXT_PUBLIC_ATOKEN_ZY_ADDRESS=0x_your_atoken_zy_address
NEXT_PUBLIC_ATOKEN_DUM1_ADDRESS=0x_your_atoken_dum1_address
NEXT_PUBLIC_ATOKEN_DUM2_ADDRESS=0x_your_atoken_dum2_address

# WalletConnect (optional)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

3. Restart the frontend development server:
```bash
npm run dev
```

## Step 8: Initialize Oracle Prices

After deployment, you need to set initial prices in the Oracle. You can do this by:

1. Using the script we'll provide (see below)
2. Or calling `Oracle.updatePrice()` directly for each asset

Prices should be in USD, scaled to 1e18 (where 1e18 = $1).

Example:
- WBTC: $60,000 = `60000 * 10^18`
- USDC: $1 = `1 * 10^18` (already set in constructor)
- USDT: $1 = `1 * 10^18`

## Step 9: Verify Contracts (Optional)

You can verify contracts on the block explorer (ZenTrace) for transparency:

1. Go to https://zentrace.io
2. Navigate to your contract address
3. Click "Verify Contract"
4. Upload the contract source code and constructor arguments

## Troubleshooting

### "Insufficient funds"
- Make sure your deployer account has enough ZTC for gas fees
- Get testnet ZTC from the faucet

### "Nonce too low"
- Wait a bit and try again
- Or check if there are pending transactions

### "Contract deployment failed"
- Check the error message in the console
- Make sure all prerequisites are met
- Verify your RPC URL is correct

### "RPC connection error"
- Verify the RPC URL: `https://zenchain-testnet.api.onfinality.io/public`
- Check your internet connection
- Try again after a few minutes

## Next Steps

After successful deployment:

1. ✅ Test the contracts with a few transactions
2. ✅ Verify all contracts on the block explorer
3. ✅ Update Oracle prices with real market data
4. ✅ Test the frontend integration
5. ✅ Test supply, borrow, repay, and withdraw flows

## Support

If you encounter issues:
1. Check the error messages in the console
2. Verify your environment variables
3. Ensure your account has sufficient balance
4. Check the Zenchain testnet status

Good luck with your deployment! 🚀

