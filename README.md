# ZenFinance - Advanced Lending DApp on ZenChain

A sophisticated decentralized lending platform built on ZenChain with advanced features including BTC-redeemable lending, validator-backed vaults, dynamic collateral management, and cross-chain capabilities.

## Features

- 🏦 **True BTC-Redeemable Lending** - On-chain mortgage with CCIM redemption
- 🔒 **Validator-Backed Overcollateralized Vaults** - Stake + BTC liquidity
- 🤖 **Niō-Powered Dynamic Collateral & Liquidation Engine** - AI-driven risk management
- 🌉 **Cross-Chain Collateral & Cross-Liquidation** - Multi-chain support
- 💰 **zBTC Yield Aggregator + Debt Share Tokens** - Yield optimization
- 🛡️ **Protocol-Level Bridge Insurance Pool** - Governance-managed security
- ⚡ **Precompile Accelerated Liquidations** - Fast, coordinated multisig execution

## Project Structure

```
zenfinance_v1/
├── contracts/          # Smart contracts (Solidity)
├── frontend/           # React/Next.js frontend
├── scripts/            # Deployment and utility scripts
└── docs/               # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Hardhat/Foundry for smart contracts
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Install all dependencies
npm run install:all

# Compile contracts
npm run compile

# Run tests
npm run test:contracts

# Start development server
npm run dev
```

## Development

### Smart Contracts

```bash
cd contracts
npm run compile    # Compile contracts
npm test           # Run tests
npm run deploy     # Deploy to network
```

### Frontend

```bash
cd frontend
npm run dev        # Start dev server (port 3000)
npm run build      # Build for production
```

## Tech Stack

- **Smart Contracts**: Solidity, Hardhat
- **Frontend**: Next.js, React, TypeScript, Web3.js/Ethers.js
- **Styling**: Tailwind CSS
- **State Management**: React Context / Zustand
- **Testing**: Hardhat, Jest, React Testing Library

## Documentation

See `/docs` for detailed documentation on each feature and implementation details.

## License

MIT
