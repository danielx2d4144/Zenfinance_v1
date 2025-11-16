/**
 * GraphQL service for querying ZenFinance subgraph data
 * Provides historical data, APY snapshots, and market analytics
 */

import { request, gql } from 'graphql-request';

// Subgraph endpoint (will be updated after deployment)
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'http://localhost:8000/subgraphs/name/zenfinance/zenfinance-testnet';

// Type definitions
export interface APYSnapshot {
  id: string;
  supplyAPY: string;
  borrowAPY: string;
  utilization: string;
  timestamp: string;
  totalSupplied: string;
  totalBorrowed: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  totalSupplied: string;
  totalBorrowed: string;
  supplyAPY: string;
  borrowAPY: string;
  utilization: string;
  historicalAPY: APYSnapshot[];
}

export interface UserSupply {
  id: string;
  amount: string;
  aTokenBalance: string;
  asset: {
    id: string;
    symbol: string;
  };
}

export interface UserBorrow {
  id: string;
  amount: string;
  interestAccrued: string;
  asset: {
    id: string;
    symbol: string;
  };
}

export interface Transaction {
  id: string;
  type: string;
  amount: string;
  timestamp: string;
  txHash: string;
  asset: {
    id: string;
    symbol: string;
  };
}

// Query to get asset APY history
const GET_ASSET_APY_HISTORY = gql`
  query GetAssetAPYHistory($assetId: ID!, $timeframe: String!) {
    asset(id: $assetId) {
      id
      symbol
      name
      supplyAPY
      borrowAPY
      historicalAPY(
        first: 1000
        orderBy: timestamp
        orderDirection: desc
        where: { timestamp_gte: $timeframe }
      ) {
        id
        supplyAPY
        borrowAPY
        utilization
        timestamp
        totalSupplied
        totalBorrowed
      }
    }
  }
`;

// Query to get all assets
const GET_ALL_ASSETS = gql`
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
`;

// Query to get user supplies
const GET_USER_SUPPLIES = gql`
  query GetUserSupplies($userId: ID!) {
    user(id: $userId) {
      supplies {
        id
        amount
        aTokenBalance
        asset {
          id
          symbol
        }
      }
    }
  }
`;

// Query to get user borrows
const GET_USER_BORROWS = gql`
  query GetUserBorrows($userId: ID!) {
    user(id: $userId) {
      borrows {
        id
        amount
        interestAccrued
        asset {
          id
          symbol
        }
      }
    }
  }
`;

// Query to get user transactions
const GET_USER_TRANSACTIONS = gql`
  query GetUserTransactions($userId: ID!, $first: Int!) {
    user(id: $userId) {
      transactions(first: $first, orderBy: timestamp, orderDirection: desc) {
        id
        type
        amount
        timestamp
        txHash
        asset {
          id
          symbol
        }
      }
    }
  }
`;

/**
 * Get asset APY history for charting
 * @param assetAddress Asset contract address
 * @param timeframe Time period (30D, 6M, 1Y)
 * @param type Type of APY to fetch ('supply' or 'borrow')
 * @returns Array of formatted chart data points
 */
export async function getAssetAPYHistory(
  assetAddress: string,
  timeframe: '30D' | '6M' | '1Y',
  type: 'supply' | 'borrow' = 'supply'
): Promise<{ timestamp: number; value: number; date: string }[]> {
  try {
    const now = Math.floor(Date.now() / 1000);
    let secondsAgo: number;
    
    switch (timeframe) {
      case '30D':
        secondsAgo = 30 * 24 * 60 * 60; // 30 days
        break;
      case '6M':
        secondsAgo = 180 * 24 * 60 * 60; // 180 days
        break;
      case '1Y':
        secondsAgo = 365 * 24 * 60 * 60; // 365 days
        break;
      default:
        secondsAgo = 30 * 24 * 60 * 60;
    }
    
    const timeframeTimestamp = (now - secondsAgo).toString();
    
    const data = await request(SUBGRAPH_URL, GET_ASSET_APY_HISTORY, {
      assetId: assetAddress.toLowerCase(),
      timeframe: timeframeTimestamp,
    });
    
    const snapshots = data.asset?.historicalAPY || [];
    
    // Format data for chart
    const dataType = type === 'supply' ? 'supplyAPY' : 'borrowAPY';
    return formatChartData(snapshots, dataType);
  } catch (error) {
    console.error('Error fetching APY history from subgraph:', error);
    return [];
  }
}

/**
 * Get all assets data
 * @returns Array of assets
 */
export async function getAllAssets(): Promise<Asset[]> {
  try {
    const data = await request(SUBGRAPH_URL, GET_ALL_ASSETS);
    return data.assets || [];
  } catch (error) {
    console.error('Error fetching assets from subgraph:', error);
    return [];
  }
}

/**
 * Get user supplies
 * @param userAddress User wallet address
 * @returns Array of user supplies
 */
export async function getUserSupplies(userAddress: string): Promise<UserSupply[]> {
  try {
    const data = await request(SUBGRAPH_URL, GET_USER_SUPPLIES, {
      userId: userAddress.toLowerCase(),
    });
    return data.user?.supplies || [];
  } catch (error) {
    console.error('Error fetching user supplies from subgraph:', error);
    return [];
  }
}

/**
 * Get user borrows
 * @param userAddress User wallet address
 * @returns Array of user borrows
 */
export async function getUserBorrows(userAddress: string): Promise<UserBorrow[]> {
  try {
    const data = await request(SUBGRAPH_URL, GET_USER_BORROWS, {
      userId: userAddress.toLowerCase(),
    });
    return data.user?.borrows || [];
  } catch (error) {
    console.error('Error fetching user borrows from subgraph:', error);
    return [];
  }
}

/**
 * Get user transactions
 * @param userAddress User wallet address
 * @param limit Number of transactions to fetch
 * @returns Array of transactions
 */
export async function getUserTransactions(
  userAddress: string,
  limit: number = 100
): Promise<Transaction[]> {
  try {
    const data = await request(SUBGRAPH_URL, GET_USER_TRANSACTIONS, {
      userId: userAddress.toLowerCase(),
      first: limit,
    });
    return data.user?.transactions || [];
  } catch (error) {
    console.error('Error fetching user transactions from subgraph:', error);
    return [];
  }
}

/**
 * Format chart data for display
 * @param snapshots Array of APY snapshots
 * @param dataType Type of data to display (supplyAPY or borrowAPY)
 * @returns Formatted chart data
 */
export function formatChartData(
  snapshots: APYSnapshot[],
  dataType: 'supplyAPY' | 'borrowAPY' = 'supplyAPY'
): { timestamp: number; value: number; date: string }[] {
  return snapshots
    .map((snapshot) => ({
      timestamp: parseInt(snapshot.timestamp),
      value: parseFloat(snapshot[dataType]),
      date: new Date(parseInt(snapshot.timestamp) * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
    }))
    .reverse(); // Reverse to show oldest first
}
