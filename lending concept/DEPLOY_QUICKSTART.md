# 🚀 Quick Start: Deploy to Zenchain Testnet

This is a quick guide to deploy ZenFinance contracts to Zenchain Testnet.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] ZTC tokens in your wallet (for gas fees)
- [ ] Private key of deployer account
- [ ] Zenchain Testnet RPC is working (confirmed ✅)

## Step 1: Setup Environment

```bash
cd contracts

# Create .env file
cat > .env << EOF
ZENCHAIN_RPC_URL=https://zenchain-testnet.api.onfinality.io/public
ZENCHAIN_CHAIN_ID=8408
PRIVATE_KEY=your_private_key_here_without_0x_prefix
EOF
```

⚠️ **Replace `your_private_key_here_without_0x_prefix` with your actual private key!**

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Compile Contracts

```bash
npm run compile
```

## Step 4: Deploy Contracts

```bash
npm run deploy:zenfinance
```

This will:
- Deploy all contracts in the correct order
- Save addresses to `deployments/zenchain-testnet.json`
- Display frontend environment variables

**📝 Copy the environment variables output!**

## Step 5: Update Frontend

1. Navigate to frontend directory:
```bash
cd ../frontend
```

2. Create `.env.local` with the addresses from deployment:
```bash
# Copy the output from deployment script
NEXT_PUBLIC_POOL_ADDRESS=0x...
NEXT_PUBLIC_ORACLE_ADDRESS=0x...
# ... etc
```

3. Restart frontend:
```bash
npm run dev
```

## Step 6: Initialize Oracle Prices

```bash
cd ../contracts
npm run update-oracle-prices
```

This sets initial prices for all assets. Update prices in `scripts/update-oracle-prices.ts` with real market values before running.

## Step 7: Test the Application

1. Connect your wallet to Zenchain Testnet
2. Visit `http://localhost:3000`
3. Test supply, borrow, repay, and withdraw operations

## Troubleshooting

### "Insufficient funds"
- Get ZTC from faucet
- Check your account balance

### "RPC error"
- Verify RPC URL: `https://zenchain-testnet.api.onfinality.io/public`
- Check internet connection

### "Contract not found"
- Verify addresses in `.env.local`
- Restart frontend after updating addresses

## Next Steps

- [ ] Verify contracts on ZenTrace block explorer
- [ ] Update Oracle prices with real market data
- [ ] Test all contract functions
- [ ] Test frontend integration
- [ ] Deploy frontend to production (Vercel/Netlify)

## Need Help?

Check `contracts/DEPLOYMENT.md` for detailed instructions.

Happy deploying! 🎉

