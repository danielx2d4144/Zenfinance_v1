# Testing Checklist for ZenFinance Dashboard

## Pre-Testing Setup
- [ ] Ensure dev server is running: `cd frontend && npm run dev`
- [ ] Ensure wallet is connected to ZenChain Testnet (Chain ID: 8408)
- [ ] Verify RPC URL is set: `https://zenchain-testnet.api.onfinality.io/public`

## Dashboard Page Tests

### 1. Metrics Section (Top Cards)
- [ ] **Net Worth**: Should display "$0.00" if no supplies/borrows, or calculated value
- [ ] **Net APY**: Should display "0.00%" if no activity, or calculated weighted APY (green if positive, red if negative)
- [ ] **Health Factor**: Should display "∞" if no borrows, or calculated value from contract
- [ ] **Available Rewards**: Should display "$0" (placeholder)

### 2. Assets to Supply Section
- [ ] Shows all assets listed in ZenFinance
- [ ] Displays wallet balance for each asset (or "0.00" if zero)
- [ ] Shows APY for each asset
- [ ] "Show assets with 0 balance" checkbox works (shows/hides zero balance assets)
- [ ] "Supply" button opens SupplyModal
- [ ] Only assets with balance > 0 shown by default (unless checkbox is checked)

### 3. Your Supplies Section
- [ ] Shows only assets that have been supplied (balance > 0)
- [ ] Displays supply balance and USD value
- [ ] Displays APY for each supplied asset
- [ ] Shows total balance (sum of all supplied assets in USD)
- [ ] Shows total APY (weighted average)
- [ ] Shows total collateral (sum of borrowed assets in USD)
- [ ] "Supply" button opens SupplyModal (to add more)
- [ ] "Withdraw" button opens WithdrawModal

### 4. Assets to Borrow Section
- [ ] Shows all assets available to borrow
- [ ] Displays available borrow amount (75% of supplied collateral minus already borrowed)
- [ ] Displays available borrow amount in USD
- [ ] Shows borrow APY (calculated from utilization rate)
- [ ] "Borrow" button opens BorrowModal
- [ ] "Borrow" button is disabled if available borrow is 0

### 5. Your Borrows Section
- [ ] Shows only assets that have been borrowed (balance > 0)
- [ ] Displays borrow balance and USD value
- [ ] Displays borrow APY for each asset
- [ ] Shows total balance (sum of all borrowed assets in USD)
- [ ] Shows total APY (weighted average)
- [ ] Shows borrow power used (percentage)
- [ ] "Borrow" button opens BorrowModal (to borrow more)
- [ ] "Repay" button opens RepayModal
- [ ] Shows "No borrows yet" message if no borrows

## Modal Tests

### 6. Supply Modal
- [ ] Opens when "Supply" button is clicked
- [ ] Shows wallet balance for the asset
- [ ] Shows USD value of input amount
- [ ] "MAX" button fills in maximum wallet balance
- [ ] Shows supply APY
- [ ] Shows health factor (after supply)
- [ ] "Supply" button is disabled if amount is invalid
- [ ] Transaction loading states work (Processing... / Confirming...)
- [ ] Success/error messages display
- [ ] Modal closes after successful transaction

### 7. Withdraw Modal
- [ ] Opens when "Withdraw" button is clicked
- [ ] Shows supply balance for the asset
- [ ] Shows USD value of input amount
- [ ] "MAX" button fills in maximum supply balance
- [ ] Shows supply APY
- [ ] Shows health factor (after withdraw)
- [ ] "Withdraw" button is disabled if amount is invalid
- [ ] Transaction loading states work
- [ ] Success/error messages display
- [ ] Modal closes after successful transaction

### 8. Borrow Modal
- [ ] Opens when "Borrow" button is clicked
- [ ] Shows available borrow amount for the asset
- [ ] Shows USD value of input amount
- [ ] "MAX" button fills in maximum available borrow
- [ ] Shows borrow APY
- [ ] Shows health factor (after borrow)
- [ ] "Borrow" button is disabled if amount is invalid
- [ ] Transaction loading states work
- [ ] Success/error messages display
- [ ] Modal closes after successful transaction

### 9. Repay Modal
- [ ] Opens when "Repay" button is clicked
- [ ] Shows borrow balance (debt) for the asset
- [ ] Shows wallet balance for the asset
- [ ] Shows USD value of input amount
- [ ] "MAX" button fills in minimum of wallet balance and borrow balance
- [ ] Shows borrow APY
- [ ] Shows health factor (after repay)
- [ ] Shows remaining debt after repay
- [ ] "Repay" button is disabled if amount is invalid
- [ ] Transaction loading states work
- [ ] Success/error messages display
- [ ] Modal closes after successful transaction

## Data Integration Tests

### 10. Real-time Data Updates
- [ ] Wallet balances update after transactions
- [ ] Supply balances update after supply/withdraw
- [ ] Borrow balances update after borrow/repay
- [ ] Health factor updates after transactions
- [ ] Available borrow amounts update after transactions
- [ ] Prices update from Oracle contract
- [ ] APY rates update based on utilization

### 11. Calculations
- [ ] Net Worth = Total Supplied - Total Borrowed
- [ ] Net APY = Weighted Supply APY - Weighted Borrow APY
- [ ] Borrow Power Used = (Total Borrowed / Max Borrow Limit) × 100
- [ ] Health Factor calculated correctly from contract
- [ ] Available Borrow = 75% of supplied collateral - already borrowed
- [ ] Total Balance sums all assets correctly

## Error Handling Tests

### 12. Error Scenarios
- [ ] Handles wallet not connected gracefully
- [ ] Handles RPC errors gracefully
- [ ] Shows loading states during data fetching
- [ ] Handles transaction failures with error messages
- [ ] Handles insufficient balance errors
- [ ] Handles approval errors
- [ ] Handles contract call errors

## UI/UX Tests

### 13. User Experience
- [ ] All sections can be collapsed/expanded
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Loading states are clear and informative
- [ ] Error messages are user-friendly
- [ ] Success messages confirm actions
- [ ] Numbers are formatted correctly (2 decimal places, K/M notation)
- [ ] Colors are appropriate (green for positive, red for negative)

## Performance Tests

### 14. Performance
- [ ] Page loads within reasonable time
- [ ] Data fetching doesn't block UI
- [ ] Multiple rapid transactions handled correctly
- [ ] No console errors or warnings (except expected ones)
- [ ] No memory leaks

## Known Issues / TODOs
- [ ] Health factor calculation may need verification
- [ ] Net APY calculation uses static APY from config (should use dynamic from contract)
- [ ] Available rewards is placeholder ($0)
- [ ] Some contract addresses may need to be updated after deployment

