# ZenFinance Subgraph

This subgraph indexes ZenFinance protocol events and provides historical data through a GraphQL API.

## Features

- **Asset Tracking**: Total supplied, total borrowed, utilization rates
- **APY History**: Hourly snapshots of supply and borrow APY
- **User Positions**: Supply and borrow positions per user per asset
- **Transaction History**: All supply, withdraw, borrow, repay, and liquidation events

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Update Configuration

The subgraph is already configured for ZenChain Testnet with the deployed contract addresses:

- **Pool**: `0x72395F14f50c7D9F5ACCA3a7D9658a9808457f7c`
- **Oracle**: `0xbECdf98b0141C52C474753ecC30a1350fE410995`
- **InterestRateModel**: `0x44948BB5ACCE54302aa5e3304A00d08BFA888726`
- **Start Block**: 1000000 (adjust if needed)

### 3. Generate TypeScript Types

```bash
npm run codegen
```

This generates TypeScript types from the GraphQL schema and contract ABIs.

### 4. Build the Subgraph

```bash
npm run build
```

This compiles the AssemblyScript mappings to WebAssembly.

## Deployment

### Option 1: The Graph Studio (Recommended)

1. Create a subgraph on [The Graph Studio](https://thegraph.com/studio/)
2. Get your deploy key
3. Authenticate:
   ```bash
   graph auth --studio <DEPLOY_KEY>
   ```
4. Deploy:
   ```bash
   npm run deploy
   ```

### Option 2: Local Graph Node

For development and testing:

1. Start a local Graph Node (requires Docker)
2. Create the subgraph:
   ```bash
   npm run create-local
   ```
3. Deploy locally:
   ```bash
   npm run deploy-local
   ```

## GraphQL Queries

### Get APY History for an Asset

```graphql
query GetAssetAPYHistory($asset: String!, $startTime: BigInt!) {
  assetAPYSnapshots(
    where: { asset: $asset, timestamp_gte: $startTime }
    orderBy: timestamp
    orderDirection: asc
  ) {
    id
    supplyAPY
    borrowAPY
    utilization
    timestamp
  }
}
```

### Get User Supplies

```graphql
query GetUserSupplies($user: String!) {
  userSupplies(where: { user: $user }) {
    id
    asset {
      symbol
      name
    }
    amount
    aTokenBalance
    lastUpdateTimestamp
  }
}
```

### Get User Borrows

```graphql
query GetUserBorrows($user: String!) {
  userBorrows(where: { user: $user }) {
    id
    asset {
      symbol
      name
    }
    amount
    interestAccrued
    lastUpdateTimestamp
  }
}
```

### Get All Assets

```graphql
query GetAllAssets {
  assets {
    id
    symbol
    name
    totalSupplied
    totalBorrowed
    supplyAPY
    borrowAPY
    utilization
  }
}
```

## Schema

### Entities

- **Asset**: Asset information and current state
- **AssetAPYSnapshot**: Hourly snapshots of APY data
- **User**: User addresses
- **UserSupply**: User supply positions
- **UserBorrow**: User borrow positions
- **Transaction**: All transactions (supply, withdraw, borrow, repay, liquidation)
- **MarketSnapshot**: Daily market-wide snapshots

## Development

### File Structure

```
subgraph/
├── schema.graphql          # GraphQL schema
├── subgraph.yaml          # Subgraph configuration
├── src/
│   └── mapping.ts         # Event handlers
├── abis/                  # Contract ABIs
│   ├── ZenFinancePool.json
│   ├── InterestRateModel.json
│   └── Oracle.json
└── generated/             # Auto-generated types (from codegen)
```

### Event Handlers

- `handleSupply`: Tracks supply events and updates asset/user state
- `handleWithdraw`: Tracks withdraw events
- `handleBorrow`: Tracks borrow events
- `handleRepay`: Tracks repay events
- `handleLiquidation`: Tracks liquidation events
- `handleInterestAccrued`: Updates interest accumulation

### APY Calculation

The subgraph uses the kinked interest rate model to calculate APY:

- **Base Rate**: 2%
- **Slope 1**: 8% (below optimal utilization)
- **Slope 2**: 50% (above optimal utilization)
- **Optimal Utilization**: 75%

APY is recalculated on every event that changes asset state.

## Testing

After deployment, test queries using:

1. The Graph Studio playground
2. GraphiQL (for local node)
3. Frontend GraphQL client

## Updating

When contracts are updated:

1. Copy new ABIs to `abis/` folder
2. Update contract addresses in `subgraph.yaml`
3. Update start block if needed
4. Run `npm run codegen` and `npm run build`
5. Deploy updated version

## Troubleshooting

### Build Errors

- Ensure all ABIs are present in `abis/` folder
- Check event signatures match contract ABIs
- Run `npm run codegen` before building

### Deployment Errors

- Verify network configuration in `subgraph.yaml`
- Check contract addresses are correct
- Ensure start block is valid

### Missing Data

- Check if events are being emitted by contracts
- Verify start block is before deployment
- Allow time for indexing to complete

## Support

- [The Graph Docs](https://thegraph.com/docs/)
- [Discord](https://discord.gg/graphprotocol)
- [Forum](https://forum.thegraph.com/)
