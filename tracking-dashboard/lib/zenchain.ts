import type { Address } from "viem";

export type TrackedAsset = {
  symbol: string;
  name: string;
  address: Address;
  decimals: number;
};

export type DeploymentCandidate = {
  label: string;
  poolAddress: Address;
  oracleAddress: Address;
  startBlock: bigint;
};

export const ZENCHAIN_RPC_URL =
  process.env.ZENCHAIN_RPC_URL ||
  process.env.NEXT_PUBLIC_ZENCHAIN_RPC_URL ||
  "https://zenchain-testnet.api.onfinality.io/public";

export const DEPLOYMENT_CANDIDATES: DeploymentCandidate[] = [
  {
    label: "ZenChain deployment",
    poolAddress: "0xC2A0fB23EE5d2880EF873Ef3B87c65fa427e2518",
    oracleAddress: "0x8A2E6A7C3c7ba1b70DCDF04275e1e45B86AE7a84",
    startBlock: BigInt(1_000_000),
  },
  {
    label: "Subgraph-indexed deployment",
    poolAddress: "0x72395F14f50c7D9F5ACCA3a7D9658a9808457f7c",
    oracleAddress: "0xbECdf98b0141C52C474753ecC30a1350fE410995",
    startBlock: BigInt(1_000_000),
  },
];

export const TRACKED_ASSETS: TrackedAsset[] = [
  {
    symbol: "WBTC",
    name: "Zipped BTC",
    address: "0xE267b9cC76a614b8E178b4552e9983d1F19CEB05",
    decimals: 8,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x44D25859F79787fF937ec1305Dbf0866d6064E21",
    decimals: 6,
  },
  {
    symbol: "USDT",
    name: "Tether",
    address: "0x2A0B66dEb779EF7DF45b064eF5cee2B1bF6E5DD5",
    decimals: 6,
  },
  {
    symbol: "ZTC",
    name: "ZenChain Token",
    address: "0x0000000000000000000000000000000000000804",
    decimals: 18,
  },
  {
    symbol: "ZFI",
    name: "ZenFinance Token",
    address: "0x867bb07d47A3BF3d1f6835a71A2Ba639bf445DA9",
    decimals: 18,
  },
  {
    symbol: "ZY",
    name: "Zynft Token",
    address: "0x7f7752745A56e5B09Bd8d9fE6d6C3b3477E441FF",
    decimals: 18,
  },
  {
    symbol: "DUM1",
    name: "DUMMY1 Token",
    address: "0xfEf87C98507A92ee3968c40D2ebEbBE3638D7D29",
    decimals: 18,
  },
  {
    symbol: "DUM2",
    name: "DUMMY2 Token",
    address: "0xFd029224030f6227B0Eee44003B464063707b1e9",
    decimals: 18,
  },
];