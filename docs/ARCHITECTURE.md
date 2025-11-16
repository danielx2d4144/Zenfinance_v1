# ZenLend Architecture Documentation

## Overview

ZenLend is a sophisticated decentralized lending platform built on ZenChain, featuring advanced capabilities including BTC-redeemable lending, validator-backed vaults, dynamic collateral management, and cross-chain functionality.

## System Architecture

### Core Components

#### 1. Smart Contracts (`/contracts`)

**ZenLendCore.sol**
- Core lending functionality
- Deposit, borrow, repay, withdraw operations
- Loan management and liquidation
- Base contract for all advanced features

**Key Features:**
- Multi-asset support (not just BTC)
- Overcollateralized lending (150% minimum)
- Interest rate management
- Liquidation mechanism (120% threshold)

#### 2. Frontend Application (`/frontend`)

**Tech Stack:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Wagmi + RainbowKit (Web3 integration)
- React Query (data fetching)

**Components:**
- `Dashboard.tsx` - Main user interface
- `LendSection.tsx` - Deposit/lending interface
- `BorrowSection.tsx` - Borrowing interface
- `VaultsSection.tsx` - Validator vault interface
- `YieldSection.tsx` - Yield aggregator interface

## Feature Implementation Roadmap

### Phase 1: Core Lending ✅
- [x] Basic deposit/withdraw
- [x] Borrowing with collateral
- [x] Loan repayment
- [x] Basic liquidation
- [ ] Oracle price feeds integration
- [ ] Interest rate calculation refinements

### Phase 2: Advanced Features 🚧
- [ ] True BTC-Redeemable Lending
- [ ] Validator-Backed Overcollateralized Vaults
- [ ] Niō-Powered Dynamic Collateral & Liquidation Engine
- [ ] Cross-Chain Collateral & Cross-Liquidation
- [ ] zBTC Yield Aggregator + Debt Share Tokens
- [ ] Protocol-Level Bridge Insurance Pool
- [ ] Precompile Accelerated Liquidations

### Phase 3: Multi-Asset Support 🌟
- [ ] Support for ETH, USDC, USDT, and other assets
- [ ] Asset-specific risk parameters
- [ ] Cross-asset collateral pools

## Smart Contract Structure

```
contracts/
├── contracts/
│   ├── core/
│   │   └── ZenLendCore.sol      # Main lending contract
│   ├── features/
│   │   ├── BTCRedeemable.sol    # BTC redemption feature
│   │   ├── ValidatorVaults.sol  # Validator vaults
│   │   ├── CrossChain.sol       # Cross-chain functionality
│   │   └── YieldAggregator.sol  # Yield optimization
│   ├── interfaces/
│   │   ├── IERC20.sol
│   │   └── IZenLend.sol
│   └── mocks/
│       └── MockERC20.sol
├── test/
│   └── ZenLendCore.test.ts
└── scripts/
    └── deploy.ts
```

## Security Considerations

1. **Reentrancy Protection**: All critical functions use `nonReentrant` modifier
2. **Access Control**: Owner-only functions for critical operations
3. **Overflow Protection**: Solidity 0.8+ built-in checks
4. **Collateralization**: Minimum 150% ratio enforced
5. **Liquidation**: Automated threshold checks

## Deployment Process

1. Compile contracts: `npm run compile`
2. Run tests: `npm run test:contracts`
3. Deploy: `npm run deploy:local` (or to testnet/mainnet)
4. Verify contracts on block explorer
5. Update frontend with contract addresses

## Development Workflow

1. **Local Development**
   ```bash
   # Terminal 1: Start local Hardhat node
   npx hardhat node
   
   # Terminal 2: Deploy contracts
   npm run deploy:local
   
   # Terminal 3: Start frontend
   npm run dev
   ```

2. **Testing**
   - Unit tests for smart contracts
   - Integration tests for full flow
   - Frontend E2E tests (planned)

3. **Code Quality**
   - Solidity linter (Solhint)
   - TypeScript strict mode
   - Prettier formatting

## Next Steps

1. Integrate price oracles for asset valuation
2. Implement advanced features from roadmap
3. Add comprehensive testing suite
4. Security audit preparation
5. Documentation for end users
