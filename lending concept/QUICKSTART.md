# ZenLend Quick Start Guide

## Prerequisites

- **Node.js** 18+ and npm
- **Git**
- **MetaMask** or compatible Web3 wallet

## Installation

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install contract dependencies
cd ../contracts
npm install
```

Or use the convenience script:
```bash
npm run install:all
```

### 2. Set Up Environment Variables

**For Contracts:**
```bash
cd contracts
cp .env.example .env
# Edit .env with your configuration
```

**For Frontend:**
Create `frontend/.env.local`:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # After deployment
```

### 3. Start Local Development

**Terminal 1: Start Hardhat Node**
```bash
cd contracts
npx hardhat node
```

**Terminal 2: Deploy Contracts (in new terminal)**
```bash
cd contracts
npm run deploy:local
```
Copy the deployed contract address to `frontend/.env.local`

**Terminal 3: Start Frontend (in new terminal)**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Development Workflow

### Smart Contracts

```bash
cd contracts

# Compile
npm run compile

# Run tests
npm test

# Deploy to local network
npm run deploy:local

# Deploy to ZenChain (when ready)
npm run deploy
```

### Frontend

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Testing

### Smart Contract Tests
```bash
cd contracts
npm test
```

### Frontend Tests (Coming Soon)
```bash
cd frontend
npm test
```

## Project Structure

```
zenfinance_v1/
├── contracts/           # Smart contracts
│   ├── contracts/       # Solidity source files
│   ├── test/            # Test files
│   └── scripts/         # Deployment scripts
├── frontend/            # Next.js application
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   └── public/          # Static assets
└── docs/                # Documentation
```

## Next Steps

1. **Connect Wallet**: Use MetaMask or RainbowKit to connect
2. **Add Test Assets**: Use Hardhat console to mint test tokens
3. **Try Lending**: Deposit assets and start earning
4. **Test Borrowing**: Create a loan with collateral
5. **Explore Features**: Navigate through different sections

## Troubleshooting

### Common Issues

**"Module not found" errors:**
- Run `npm install` in the respective directory
- Delete `node_modules` and reinstall if needed

**Contract deployment fails:**
- Ensure Hardhat node is running
- Check that you have test ETH/ZTC in your account

**Frontend won't connect:**
- Verify contract address in `.env.local`
- Check that MetaMask is connected to the correct network
- Ensure Hardhat node is running on port 8545

## Getting Help

- Check `/docs` for detailed documentation
- Review contract comments for function details
- Check GitHub issues (if applicable)

## Video Coding Setup

For video coding sessions:

1. **Prepare Environment**: Follow installation steps above
2. **Start Fresh**: Clear browser cache and MetaMask
3. **Use Test Accounts**: Use Hardhat's default test accounts
4. **Show Network**: Use localhost for fast testing

Happy coding! 🚀
