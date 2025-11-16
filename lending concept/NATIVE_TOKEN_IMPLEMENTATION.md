# Native Token (ZTC) Support Implementation

## Problem
The original implementation tried to treat ZTC (native token on ZenChain) as an ERC20 token. When users tried to supply ZTC, the transaction would:
1. Successfully approve the token contract (because the address exists as a precompile)
2. Fail when trying to call `supply()` because native tokens cannot be transferred using ERC20 `transferFrom`

## Solution
Extended the pool contract and frontend to support native token operations directly using `payable` functions.

## Changes Made

### 1. Smart Contract Updates

#### `contracts/contracts/core/ZenFinancePool.sol`
- Added `NATIVE_TOKEN` constant: `0x0000000000000000000000000000000000000804` (ZTC address)
- Added `supplyNative()` function: Payable function that accepts native tokens via `msg.value`
- Added `withdrawNative()` function: Withdraws native tokens and sends them via `call{value: amount}("")`
- Updated `withdraw()`: Routes to `withdrawNative()` if asset is native token
- Updated `borrow()`: Handles native token transfer using `call{value: amount}("")`
- Updated `repay()`: Made payable, handles native token repayment via `msg.value`
- Updated `liquidate()`: Made payable, handles native token liquidation
- Added `receive()` function: Allows contract to receive native tokens
- Added `fallback()` function: Reverts for unknown function calls

#### `contracts/contracts/interfaces/IZenFinancePool.sol`
- Added `supplyNative()` function signature
- Added `withdrawNative()` function signature
- Updated `repay()` to be payable

### 2. Frontend Updates

#### `frontend/hooks/useContract.ts`
- Updated `useSupply()`: Detects ZTC and uses `supplyNative()` with `value` parameter instead of approve + supply
- Updated `useWithdraw()`: Detects ZTC and uses `withdrawNative()` instead of regular withdraw
- Updated `useRepay()`: Detects ZTC and uses payable `repay()` with `value` parameter
- Updated `POOL_ABI`: Added `supplyNative` and `withdrawNative` function signatures, made `repay` payable

### 3. Wallet Balance Handling

#### `frontend/hooks/useBalance.ts`
- Already correctly handles ZTC using wagmi's `useBalance()` hook for native token balance
- No changes needed here

## How It Works

### For Native Token (ZTC):
1. **Supply**: User calls `supplyNative()` with ZTC sent via `msg.value` → No approval needed
2. **Withdraw**: User calls `withdrawNative(amount)` → Contract sends native tokens directly
3. **Borrow**: User calls `borrow(NATIVE_TOKEN, amount)` → Contract sends native tokens directly
4. **Repay**: User calls `repay(NATIVE_TOKEN, amount)` with ZTC sent via `msg.value` → No approval needed

### For ERC20 Tokens:
1. **Supply**: User approves token → User calls `supply(asset, amount)` → Contract transfers tokens
2. **Withdraw**: User calls `withdraw(asset, amount)` → Contract transfers tokens back
3. **Borrow**: User calls `borrow(asset, amount)` → Contract transfers tokens
4. **Repay**: User approves token → User calls `repay(asset, amount)` → Contract transfers tokens

## Testing

### Before Deployment:
1. Compile contracts: `npm run compile` in `contracts/` directory
2. Run tests: `npm test` (if tests are updated)
3. Deploy to testnet: `npm run deploy:zenfinance`

### After Deployment:
1. Test ZTC supply:
   - Connect wallet with ZTC balance
   - Navigate to dashboard
   - Click "Supply" on ZTC
   - Enter amount and click "Supply"
   - Should see only ONE transaction (supplyNative) instead of two (approve + supply)
   
2. Test ZTC withdraw:
   - After supplying ZTC
   - Click "Withdraw" on ZTC
   - Enter amount and click "Withdraw"
   - Should receive ZTC directly to wallet

3. Verify on-chain:
   - Check pool's `totalSupplied(NATIVE_TOKEN)` should increase
   - Check user's `supplyBalances(user, NATIVE_TOKEN)` should show balance
   - Check aToken balance should be minted

## Important Notes

1. **Native Token Address**: The native token address `0x0000000000000000000000000000000804` is used as the key in all mappings (supplyBalances, totalSupplied, etc.)

2. **Contract Balance**: The pool contract must hold native tokens. When users supply, tokens are stored in the contract. When users borrow, tokens are sent from the contract's balance.

3. **Gas Costs**: Native token operations are slightly cheaper than ERC20 operations because they don't require approval transactions.

4. **Frontend Detection**: The frontend detects ZTC by comparing the asset address to `0x0000000000000000000000000000000804`.

## Next Steps

1. Deploy updated contracts to testnet
2. Test native token supply/withdraw functionality
3. Test native token borrow/repay functionality
4. Update deployment documentation
5. Consider adding tests for native token operations

## Files Modified

- `contracts/contracts/core/ZenFinancePool.sol`
- `contracts/contracts/interfaces/IZenFinancePool.sol`
- `frontend/hooks/useContract.ts`

## Files That May Need Updates (Future)

- `contracts/test/ZenFinancePool.test.ts` - Add native token tests
- `DEPLOY_QUICKSTART.md` - Update deployment instructions if needed
- `DEVELOPMENT_PLAN.md` - Mark native token support as completed

