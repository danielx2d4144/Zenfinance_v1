# Graph Integration Deployment Guide

## Overview

The Graph integration provides historical APY data and analytics for ZenFinance protocol through a GraphQL API.

## Status

✅ **Completed:**
- Subgraph schema created with Asset, AssetAPYSnapshot, User, Transaction entities
- Event handlers implemented for Supply, Withdraw, Borrow, Repay, Liquidation events
- APY calculation with kinked interest rate model
- Contract ABIs copied to subgraph folder
- Contract addresses configured (Pool, Oracle, InterestRateModel)
- Subgraph built successfully
- Frontend GraphQL service created
- APYChart component integrated into AssetDetailsView
- graphql-request library installed

🔄 **Next Steps:**

1. **Deploy Subgraph**
2. **Update Frontend Environment Variable**
3. **Test the Integration**

---

## Deployment Steps

### 1. Deploy to The Graph Studio

#### a. Create Account and Subgraph

1. Go to [The Graph Studio](https://thegraph.com/studio/)
2. Connect your wallet
3. Click "Create a Subgraph"
4. Name it: `zenfinance-subgraph`
5. Select network: **Custom** (for ZenChain Testnet)

#### b. Get Deploy Key

After creating the subgraph, you'll see a deploy key. Copy it.

#### c. Authenticate

```bash
cd subgraph
graph auth --studio YOUR_DEPLOY_KEY_HERE
```

#### d. Deploy

```bash
npm run deploy
```

Follow the prompts:
- Version Label: `v0.1.0`
- Subgraph Name: `zenfinance-subgraph`

### 2. Update Frontend Configuration

After deployment, The Graph Studio will give you a query URL like:
```
https://api.studio.thegraph.com/query/[DEPLOY_ID]/zenfinance-subgraph/version/latest
```

Update `frontend/.env.local`:

```bash
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/[DEPLOY_ID]/zenfinance-subgraph/version/latest
```

### 3. Wait for Indexing

The subgraph will start indexing from block 1000000. This may take a few minutes to several hours depending on:
- Number of blocks to index
- Number of events
- The Graph network load

You can monitor indexing progress in The Graph Studio dashboard.

### 4. Test the Integration

#### a. Test GraphQL Queries

Go to The Graph Studio playground and try:

```graphql
{
  assets {
    id
    symbol
    totalSupplied
    totalBorrowed
    supplyAPY
    borrowAPY
  }
}
```

#### b. Test Frontend Chart

1. Restart the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to an asset details page (e.g., `/assets/WBTC`)

3. The APY chart should display:
   - Line chart showing Supply APY over time
   - Timeframe buttons (30D, 6M, 1Y)
   - Grid lines and axis labels

#### c. Verify Data Flow

The chart will only show data if:
- Subgraph has indexed events
- There are Supply/Borrow/Withdraw events in the blockchain
- APY snapshots have been created (happens on each event)

---

## Alternative: Local Graph Node (Development)

For local testing before deploying to The Graph Studio:

### 1. Start Local Graph Node

Requires Docker. Clone and run:

```bash
git clone https://github.com/graphprotocol/graph-node
cd graph-node/docker
# Edit docker-compose.yml to point to ZenChain RPC
docker-compose up
```

### 2. Deploy Locally

```bash
cd subgraph
npm run create-local
npm run deploy-local
```

### 3. Query Locally

The local endpoint will be:
```
http://localhost:8000/subgraphs/name/zenfinance/zenfinance-testnet
```

Update `frontend/.env.local`:
```bash
NEXT_PUBLIC_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/zenfinance/zenfinance-testnet
```

---

## Troubleshooting

### Subgraph Fails to Index

**Problem**: Subgraph shows indexing errors or no data

**Solutions**:
1. Check if the start block (1000000) is correct
   - Find actual deployment block from ZenTrace explorer
   - Update in `subgraph.yaml`
2. Verify contract addresses are correct
3. Check ZenChain RPC is accessible
4. Review event signatures match the contract

### No APY Data in Chart

**Problem**: Chart shows "No data available"

**Solutions**:
1. Wait for subgraph to finish indexing
2. Check if there are any transactions on the pool
   - Subgraph creates APY snapshots on each event
   - If no events, no snapshots
3. Verify subgraph URL in frontend `.env.local`
4. Check browser console for GraphQL errors

### Build Errors

**Problem**: `npm run build` fails in subgraph

**Solutions**:
1. Run `npm run codegen` first
2. Check ABIs are present in `abis/` folder
3. Verify event signatures in `subgraph.yaml` match ABI
4. Review AssemblyScript syntax in `src/mapping.ts`

### Frontend Chart Not Displaying

**Problem**: Chart component doesn't render

**Solutions**:
1. Check if `graphql-request` is installed: `npm list graphql-request`
2. Verify subgraph URL is set in environment variables
3. Check browser console for errors
4. Ensure subgraph is deployed and indexing

---

## Configuration Summary

### Subgraph Configuration

**File**: `subgraph/subgraph.yaml`

- **Network**: zenchain-testnet
- **Contract Address**: 0x72395F14f50c7D9F5ACCA3a7D9658a9808457f7c
- **Start Block**: 1000000 (adjust if needed)
- **Events**: Supply, Withdraw, Borrow, Repay, Liquidation, InterestAccrued

### Frontend Configuration

**File**: `frontend/.env.local`

```bash
NEXT_PUBLIC_SUBGRAPH_URL=<YOUR_SUBGRAPH_URL>
```

### Event Signatures

From contract ABI:
- `Supply(indexed address,indexed address,uint256,uint256,uint256)`
- `Withdraw(indexed address,indexed address,uint256,uint256)`
- `Borrow(indexed address,indexed address,uint256,uint256,uint256)`
- `Repay(indexed address,indexed address,uint256,uint256)`
- `Liquidation(indexed address,indexed address,indexed address,uint256,uint256)`
- `InterestAccrued(indexed address,uint256,uint256,uint256)`

---

## Next Features

After successful deployment, consider adding:

1. **Borrow APY Chart**: Add chart for borrow APY alongside supply APY
2. **Utilization Chart**: Show utilization rate over time
3. **TVL Chart**: Total Value Locked across all assets
4. **User Analytics**: Personal supply/borrow history charts
5. **Market Snapshots**: Daily market-wide statistics

---

## Support

- **The Graph Docs**: https://thegraph.com/docs/
- **Discord**: https://discord.gg/graphprotocol
- **ZenChain Docs**: https://docs.zenchain.io/

---

## Files Modified/Created

### Subgraph
- ✅ `subgraph/schema.graphql` - GraphQL schema
- ✅ `subgraph/subgraph.yaml` - Configuration with contract addresses
- ✅ `subgraph/src/mapping.ts` - Event handlers
- ✅ `subgraph/package.json` - Dependencies and scripts
- ✅ `subgraph/abis/` - Contract ABIs copied
- ✅ `subgraph/README.md` - Documentation

### Frontend
- ✅ `frontend/services/graphService.ts` - GraphQL query service
- ✅ `frontend/components/APYChart.tsx` - Chart component
- ✅ `frontend/components/AssetDetailsView.tsx` - Integrated chart
- ✅ `frontend/.env.local` - Added NEXT_PUBLIC_SUBGRAPH_URL
- ✅ `frontend/package.json` - Added graphql-request dependency

---

**Ready to deploy!** Follow the deployment steps above to get the Graph integration live.
