import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import {
  Supply,
  Withdraw,
  Borrow,
  Repay,
  Liquidation,
  InterestAccrued,
} from "../generated/ZenFinancePool/ZenFinancePool";
import {
  Asset,
  AssetAPYSnapshot,
  User,
  UserSupply,
  UserBorrow,
  Transaction,
  MarketSnapshot,
} from "../generated/schema";

// Constants
const SECONDS_PER_YEAR = BigInt.fromI32(31536000); // 365 days
const WAD = BigDecimal.fromString("1000000000000000000"); // 1e18

// Helper function to get or create Asset
function getOrCreateAsset(assetAddress: Address): Asset {
  let asset = Asset.load(assetAddress.toHexString());
  
  if (asset == null) {
    asset = new Asset(assetAddress.toHexString());
    asset.symbol = ""; // Will be populated from contract
    asset.name = "";
    asset.decimals = 18;
    asset.totalSupplied = BigInt.fromI32(0);
    asset.totalBorrowed = BigInt.fromI32(0);
    asset.supplyAPY = BigDecimal.fromString("0");
    asset.borrowAPY = BigDecimal.fromString("0");
    asset.utilization = BigDecimal.fromString("0");
    asset.lastUpdateTimestamp = BigInt.fromI32(0);
    asset.lastUpdateBlock = BigInt.fromI32(0);
    asset.save();
  }
  
  return asset as Asset;
}

// Helper function to get or create User
function getOrCreateUser(userAddress: Address): User {
  let user = User.load(userAddress.toHexString());
  
  if (user == null) {
    user = new User(userAddress.toHexString());
    user.save();
  }
  
  return user as User;
}

// Helper function to calculate APY from utilization
function calculateAPY(utilization: BigDecimal, isSupply: boolean): BigDecimal {
  // Kinked interest rate model
  const BASE_RATE = BigDecimal.fromString("0.02"); // 2%
  const SLOPE1 = BigDecimal.fromString("0.08"); // 8%
  const SLOPE2 = BigDecimal.fromString("0.50"); // 50%
  const OPTIMAL_UTILIZATION = BigDecimal.fromString("0.75"); // 75%
  const RESERVE_FACTOR = BigDecimal.fromString("0.10"); // 10%
  
  let borrowRate: BigDecimal;
  
  if (utilization.le(OPTIMAL_UTILIZATION)) {
    // Rate = Base Rate + (Utilization / Optimal Utilization) × Slope1
    borrowRate = BASE_RATE.plus(
      utilization.div(OPTIMAL_UTILIZATION).times(SLOPE1)
    );
  } else {
    // Rate = Base Rate + Slope1 + ((Utilization - Optimal) / (1 - Optimal)) × Slope2
    const excessUtilization = utilization.minus(OPTIMAL_UTILIZATION);
    const maxExcess = BigDecimal.fromString("1").minus(OPTIMAL_UTILIZATION);
    borrowRate = BASE_RATE.plus(SLOPE1).plus(
      excessUtilization.div(maxExcess).times(SLOPE2)
    );
  }
  
  if (isSupply) {
    // Supply APY = Borrow Rate × (1 - Reserve Factor) × Utilization
    return borrowRate.times(
      BigDecimal.fromString("1").minus(RESERVE_FACTOR)
    ).times(utilization);
  }
  
  return borrowRate;
}

// Helper function to create APY snapshot
function createAPYSnapshot(
  asset: Asset,
  timestamp: BigInt,
  block: BigInt
): void {
  const snapshotId = asset.id + "-" + timestamp.toString();
  let snapshot = new AssetAPYSnapshot(snapshotId);
  
  snapshot.asset = asset.id;
  snapshot.supplyAPY = asset.supplyAPY;
  snapshot.borrowAPY = asset.borrowAPY;
  snapshot.utilization = asset.utilization;
  snapshot.totalSupplied = asset.totalSupplied;
  snapshot.totalBorrowed = asset.totalBorrowed;
  snapshot.timestamp = timestamp;
  snapshot.block = block;
  
  snapshot.save();
}

// Handle Supply event
export function handleSupply(event: Supply): void {
  const user = getOrCreateUser(event.params.user);
  const asset = getOrCreateAsset(event.params.asset);
  
  // Update asset totals
  asset.totalSupplied = asset.totalSupplied.plus(event.params.amount);
  
  // Calculate utilization
  if (asset.totalSupplied.gt(BigInt.fromI32(0))) {
    asset.utilization = asset.totalBorrowed.toBigDecimal().div(
      asset.totalSupplied.toBigDecimal()
    );
  } else {
    asset.utilization = BigDecimal.fromString("0");
  }
  
  // Calculate APY
  asset.supplyAPY = calculateAPY(asset.utilization, true);
  asset.borrowAPY = calculateAPY(asset.utilization, false);
  asset.lastUpdateTimestamp = event.block.timestamp;
  asset.lastUpdateBlock = event.block.number;
  asset.save();
  
  // Create APY snapshot
  createAPYSnapshot(asset, event.block.timestamp, event.block.number);
  
  // Update user supply
  const userSupplyId = user.id + "-" + asset.id;
  let userSupply = UserSupply.load(userSupplyId);
  
  if (userSupply == null) {
    userSupply = new UserSupply(userSupplyId);
    userSupply.user = user.id;
    userSupply.asset = asset.id;
    userSupply.amount = BigInt.fromI32(0);
    userSupply.aTokenBalance = BigInt.fromI32(0);
  }
  
  userSupply.amount = userSupply.amount.minus(event.params.amount);
  // Note: Withdraw event doesn't include aTokenAmount, so we estimate it
  userSupply.aTokenBalance = userSupply.amount; // aTokens are 1:1 with supplied amount
  userSupply.lastUpdateTimestamp = event.block.timestamp;
  userSupply.lastUpdateBlock = event.block.number;
  userSupply.save();
  
  // Create transaction
  const txId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const transaction = new Transaction(txId);
  transaction.user = user.id;
  transaction.asset = asset.id;
  transaction.type = "SUPPLY";
  transaction.amount = event.params.amount;
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.txHash = event.transaction.hash;
  transaction.save();
}

// Handle Withdraw event
export function handleWithdraw(event: Withdraw): void {
  const user = getOrCreateUser(event.params.user);
  const asset = getOrCreateAsset(event.params.asset);
  
  // Update asset totals
  asset.totalSupplied = asset.totalSupplied.minus(event.params.amount);
  
  // Calculate utilization
  if (asset.totalSupplied.gt(BigInt.fromI32(0))) {
    asset.utilization = asset.totalBorrowed.toBigDecimal().div(
      asset.totalSupplied.toBigDecimal()
    );
  } else {
    asset.utilization = BigDecimal.fromString("0");
  }
  
  // Calculate APY
  asset.supplyAPY = calculateAPY(asset.utilization, true);
  asset.borrowAPY = calculateAPY(asset.utilization, false);
  asset.lastUpdateTimestamp = event.block.timestamp;
  asset.lastUpdateBlock = event.block.number;
  asset.save();
  
  // Create APY snapshot
  createAPYSnapshot(asset, event.block.timestamp, event.block.number);
  
  // Update user supply
  const userSupplyId = user.id + "-" + asset.id;
  let userSupply = UserSupply.load(userSupplyId);
  
  if (userSupply != null) {
    userSupply.amount = userSupply.amount.minus(event.params.amount);
    // Note: Withdraw event doesn't include aTokenAmount, so we set it equal to amount
    userSupply.aTokenBalance = userSupply.amount;
    userSupply.lastUpdateTimestamp = event.block.timestamp;
    userSupply.lastUpdateBlock = event.block.number;
    userSupply.save();
  }
  
  // Create transaction
  const txId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const transaction = new Transaction(txId);
  transaction.user = user.id;
  transaction.asset = asset.id;
  transaction.type = "WITHDRAW";
  transaction.amount = event.params.amount;
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.txHash = event.transaction.hash;
  transaction.save();
}

// Handle Borrow event
export function handleBorrow(event: Borrow): void {
  const user = getOrCreateUser(event.params.user);
  const asset = getOrCreateAsset(event.params.asset);
  
  // Update asset totals
  asset.totalBorrowed = asset.totalBorrowed.plus(event.params.amount);
  
  // Calculate utilization
  if (asset.totalSupplied.gt(BigInt.fromI32(0))) {
    asset.utilization = asset.totalBorrowed.toBigDecimal().div(
      asset.totalSupplied.toBigDecimal()
    );
  } else {
    asset.utilization = BigDecimal.fromString("0");
  }
  
  // Calculate APY
  asset.supplyAPY = calculateAPY(asset.utilization, true);
  asset.borrowAPY = calculateAPY(asset.utilization, false);
  asset.lastUpdateTimestamp = event.block.timestamp;
  asset.lastUpdateBlock = event.block.number;
  asset.save();
  
  // Create APY snapshot
  createAPYSnapshot(asset, event.block.timestamp, event.block.number);
  
  // Update user borrow
  const userBorrowId = user.id + "-" + asset.id;
  let userBorrow = UserBorrow.load(userBorrowId);
  
  if (userBorrow == null) {
    userBorrow = new UserBorrow(userBorrowId);
    userBorrow.user = user.id;
    userBorrow.asset = asset.id;
    userBorrow.amount = BigInt.fromI32(0);
    userBorrow.interestAccrued = BigInt.fromI32(0);
  }
  
  userBorrow.amount = userBorrow.amount.plus(event.params.amount);
  userBorrow.lastUpdateTimestamp = event.block.timestamp;
  userBorrow.lastUpdateBlock = event.block.number;
  userBorrow.save();
  
  // Create transaction
  const txId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const transaction = new Transaction(txId);
  transaction.user = user.id;
  transaction.asset = asset.id;
  transaction.type = "BORROW";
  transaction.amount = event.params.amount;
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.txHash = event.transaction.hash;
  transaction.save();
}

// Handle Repay event
export function handleRepay(event: Repay): void {
  const user = getOrCreateUser(event.params.user);
  const asset = getOrCreateAsset(event.params.asset);
  
  // Update asset totals
  asset.totalBorrowed = asset.totalBorrowed.minus(event.params.amount);
  
  // Calculate utilization
  if (asset.totalSupplied.gt(BigInt.fromI32(0))) {
    asset.utilization = asset.totalBorrowed.toBigDecimal().div(
      asset.totalSupplied.toBigDecimal()
    );
  } else {
    asset.utilization = BigDecimal.fromString("0");
  }
  
  // Calculate APY
  asset.supplyAPY = calculateAPY(asset.utilization, true);
  asset.borrowAPY = calculateAPY(asset.utilization, false);
  asset.lastUpdateTimestamp = event.block.timestamp;
  asset.lastUpdateBlock = event.block.number;
  asset.save();
  
  // Create APY snapshot
  createAPYSnapshot(asset, event.block.timestamp, event.block.number);
  
  // Update user borrow
  const userBorrowId = user.id + "-" + asset.id;
  let userBorrow = UserBorrow.load(userBorrowId);
  
  if (userBorrow != null) {
    userBorrow.amount = userBorrow.amount.minus(event.params.amount);
    userBorrow.lastUpdateTimestamp = event.block.timestamp;
    userBorrow.lastUpdateBlock = event.block.number;
    userBorrow.save();
  }
  
  // Create transaction
  const txId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const transaction = new Transaction(txId);
  transaction.user = user.id;
  transaction.asset = asset.id;
  transaction.type = "REPAY";
  transaction.amount = event.params.amount;
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.txHash = event.transaction.hash;
  transaction.save();
}

// Handle Liquidation event
export function handleLiquidation(event: Liquidation): void {
  const user = getOrCreateUser(event.params.user);
  const asset = getOrCreateAsset(event.params.asset);
  
  // Create transaction
  const txId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  const transaction = new Transaction(txId);
  transaction.user = user.id;
  transaction.asset = asset.id;
  transaction.type = "LIQUIDATION";
  transaction.amount = event.params.amount;
  transaction.timestamp = event.block.timestamp;
  transaction.block = event.block.number;
  transaction.txHash = event.transaction.hash;
  transaction.save();
}

// Handle InterestAccrued event
export function handleInterestAccrued(event: InterestAccrued): void {
  const asset = getOrCreateAsset(event.params.asset);
  
  // Update timestamp
  asset.lastUpdateTimestamp = event.block.timestamp;
  asset.lastUpdateBlock = event.block.number;
  asset.save();
  
  // Create APY snapshot periodically (every hour)
  const hourTimestamp = event.block.timestamp.div(BigInt.fromI32(3600)).times(BigInt.fromI32(3600));
  const snapshotId = asset.id + "-" + hourTimestamp.toString();
  
  // Only create if snapshot doesn't exist for this hour
  if (AssetAPYSnapshot.load(snapshotId) == null) {
    createAPYSnapshot(asset, hourTimestamp, event.block.number);
  }
}
