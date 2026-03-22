import {
  createPublicClient,
  decodeEventLog,
  formatUnits,
  http,
  parseAbi,
  parseAbiItem,
  type Address,
  type PublicClient,
} from "viem";

import {
  DEPLOYMENT_CANDIDATES,
  TRACKED_ASSETS,
  ZENCHAIN_RPC_URL,
  type DeploymentCandidate,
  type TrackedAsset,
} from "@/lib/zenchain";

type EventType = "Supply" | "Withdraw" | "Borrow" | "Repay" | "Liquidation";

type ProtocolEvent = {
  type: EventType;
  asset: Address;
  timestamp: bigint;
  participants: Address[];
};

type AssetSnapshot = {
  asset: TrackedAsset;
  totalSupplied: bigint;
  totalBorrowed: bigint;
  activeSuppliers: number;
  activeBorrowers: number;
  priceUsd: bigint;
};

export type TrackerMetric = {
  label: string;
  value: string;
  change: string;
  tone: "yellow" | "green" | "cyan" | "slate";
};

export type TokenRow = {
  symbol: string;
  name: string;
  contract: string;
  totalInteractions: number;
  zenFinanceInteractions: number;
  uniqueUsers: number;
  activeSuppliers: number;
  activeBorrowers: number;
  suppliedUsd: number;
  borrowedUsd: number;
  availableUsd: number;
  priceUsd: number;
  utilization: number;
};

export type ActivityPoint = {
  label: string;
  wallets: number;
};

export type WalletLeaderboardRow = {
  wallet: string;
  interactions: number;
  uniqueAssets: number;
};

export type TrackerData = {
  mode: "live";
  sourceLabel: string;
  sourceDetail: string;
  metrics: TrackerMetric[];
  tokenRows: TokenRow[];
  activeWalletSeries: ActivityPoint[];
  mostActiveWallets: WalletLeaderboardRow[];
  walletsWithMostAssets: WalletLeaderboardRow[];
  interactionMix: Array<{ label: string; value: number; tone: TrackerMetric["tone"] }>;
  recentNotes: string[];
  lastUpdated: string;
};

const poolAbi = parseAbi([
  "function totalSupplied(address asset) view returns (uint256)",
  "function totalBorrowed(address asset) view returns (uint256)",
  "function getActiveSuppliers(address asset) view returns (uint256)",
  "function getActiveBorrowers(address asset) view returns (uint256)",
]);

const oracleAbi = parseAbi(["function getPrice(address token) view returns (uint256)"]);

const protocolEventAbi = parseAbi([
  "event Supply(address indexed user, address indexed asset, uint256 amount, uint256 aTokenAmount, uint256 timestamp)",
  "event Withdraw(address indexed user, address indexed asset, uint256 amount, uint256 timestamp)",
  "event Borrow(address indexed user, address indexed asset, uint256 amount, uint256 loanId, uint256 timestamp)",
  "event Repay(address indexed user, address indexed asset, uint256 amount, uint256 timestamp)",
  "event Liquidation(address indexed liquidator, address indexed user, address indexed asset, uint256 amount, uint256 timestamp)",
]);

const supplyEvent = parseAbiItem(
  "event Supply(address indexed user, address indexed asset, uint256 amount, uint256 aTokenAmount, uint256 timestamp)",
);
const withdrawEvent = parseAbiItem(
  "event Withdraw(address indexed user, address indexed asset, uint256 amount, uint256 timestamp)",
);
const borrowEvent = parseAbiItem(
  "event Borrow(address indexed user, address indexed asset, uint256 amount, uint256 loanId, uint256 timestamp)",
);
const repayEvent = parseAbiItem(
  "event Repay(address indexed user, address indexed asset, uint256 amount, uint256 timestamp)",
);
const liquidationEvent = parseAbiItem(
  "event Liquidation(address indexed liquidator, address indexed user, address indexed asset, uint256 amount, uint256 timestamp)",
);

const EVENT_LOOKBACK_BLOCKS = BigInt(
  Number(process.env.ZENFINANCE_EVENT_LOOKBACK_BLOCKS || 25_000),
);

function makeClient(): PublicClient {
  return createPublicClient({
    transport: http(ZENCHAIN_RPC_URL, { timeout: 30_000 }),
  });
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function bigintToNumber(value: bigint, decimals: number): number {
  return Number(formatUnits(value, decimals));
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function uniqueCount(values: string[]): number {
  return new Set(values.map((value) => value.toLowerCase())).size;
}

function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}

async function getLogsChunked(
  client: PublicClient,
  address: Address,
  fromBlock: bigint,
  toBlock: bigint,
  chunkSize: bigint = BigInt(25_000),
) {
  const logs = [];

  for (let start = fromBlock; start <= toBlock; start += chunkSize + BigInt(1)) {
    const end = start + chunkSize > toBlock ? toBlock : start + chunkSize;
    const chunk = await getLogsForRange(client, address, start, end);
    logs.push(...chunk);
  }

  return logs;
}

async function getLogsForRange(
  client: PublicClient,
  address: Address,
  fromBlock: bigint,
  toBlock: bigint,
): Promise<Awaited<ReturnType<PublicClient["getLogs"]>>> {
  try {
    return await client.getLogs({
      address,
      fromBlock,
      toBlock,
    });
  } catch {
    if (toBlock - fromBlock <= BigInt(1_000)) {
      return [];
    }

    const midpoint = fromBlock + (toBlock - fromBlock) / BigInt(2);
    const [left, right] = await Promise.all([
      getLogsForRange(client, address, fromBlock, midpoint),
      getLogsForRange(client, address, midpoint + BigInt(1), toBlock),
    ]);

    return [...left, ...right];
  }
}

async function probeDeployment(client: PublicClient, candidate: DeploymentCandidate, latestBlock: bigint) {
  try {
    const [supplied, price] = await Promise.all([
      client.readContract({
        address: candidate.poolAddress,
        abi: poolAbi,
        functionName: "totalSupplied",
        args: [TRACKED_ASSETS[0].address],
      }),
      client.readContract({
        address: candidate.oracleAddress,
        abi: oracleAbi,
        functionName: "getPrice",
        args: [TRACKED_ASSETS[1].address],
      }),
    ]);

    const liquidityScore = Number(supplied > BigInt(0) ? supplied : BigInt(0));
    const priceScore = Number(price > BigInt(0) ? price : BigInt(0));

    return { candidate, score: liquidityScore + priceScore + Number(latestBlock % BigInt(10)) };
  } catch {
    return { candidate, score: -1 };
  }
}

async function selectDeployment(client: PublicClient): Promise<DeploymentCandidate> {
  const latestBlock = await client.getBlockNumber();
  const probes = await Promise.all(DEPLOYMENT_CANDIDATES.map((candidate) => probeDeployment(client, candidate, latestBlock)));
  probes.sort((left, right) => right.score - left.score);

  if (probes[0]?.score >= 0) {
    return probes[0].candidate;
  }

  throw new Error("Could not resolve a live ZenFinance deployment on ZenChain");
}

async function readAssetSnapshots(client: PublicClient, deployment: DeploymentCandidate): Promise<AssetSnapshot[]> {
  const snapshots = await Promise.all(
    TRACKED_ASSETS.map(async (asset) => {
      try {
        const [totalSupplied, totalBorrowed, activeSuppliers, activeBorrowers, priceUsd] = await Promise.all([
          client.readContract({
            address: deployment.poolAddress,
            abi: poolAbi,
            functionName: "totalSupplied",
            args: [asset.address],
          }),
          client.readContract({
            address: deployment.poolAddress,
            abi: poolAbi,
            functionName: "totalBorrowed",
            args: [asset.address],
          }),
          client.readContract({
            address: deployment.poolAddress,
            abi: poolAbi,
            functionName: "getActiveSuppliers",
            args: [asset.address],
          }),
          client.readContract({
            address: deployment.poolAddress,
            abi: poolAbi,
            functionName: "getActiveBorrowers",
            args: [asset.address],
          }),
          client.readContract({
            address: deployment.oracleAddress,
            abi: oracleAbi,
            functionName: "getPrice",
            args: [asset.address],
          }),
        ]);

        return {
          asset,
          totalSupplied,
          totalBorrowed,
          activeSuppliers: Number(activeSuppliers),
          activeBorrowers: Number(activeBorrowers),
          priceUsd,
        } satisfies AssetSnapshot;
      } catch {
        return null;
      }
    }),
  );

  return snapshots.filter((snapshot): snapshot is AssetSnapshot => snapshot !== null);
}

async function readProtocolEvents(client: PublicClient, deployment: DeploymentCandidate): Promise<ProtocolEvent[]> {
  const latestBlock = await client.getBlockNumber();
  const rangeStartByLookback =
    latestBlock > EVENT_LOOKBACK_BLOCKS ? latestBlock - EVENT_LOOKBACK_BLOCKS : deployment.startBlock;
  const fromBlock = rangeStartByLookback > deployment.startBlock ? rangeStartByLookback : deployment.startBlock;
  const rawLogs = await getLogsChunked(client, deployment.poolAddress, fromBlock, latestBlock);

  return rawLogs
    .map((log) => {
      try {
        const decoded = decodeEventLog({
          abi: protocolEventAbi,
          data: log.data,
          topics: log.topics,
        });

        switch (decoded.eventName) {
          case "Supply":
            if (!decoded.args.asset || !decoded.args.timestamp || !decoded.args.user) {
              return null;
            }
            return {
              type: "Supply" as const,
              asset: decoded.args.asset,
              timestamp: decoded.args.timestamp,
              participants: [decoded.args.user],
            };
          case "Withdraw":
            if (!decoded.args.asset || !decoded.args.timestamp || !decoded.args.user) {
              return null;
            }
            return {
              type: "Withdraw" as const,
              asset: decoded.args.asset,
              timestamp: decoded.args.timestamp,
              participants: [decoded.args.user],
            };
          case "Borrow":
            if (!decoded.args.asset || !decoded.args.timestamp || !decoded.args.user) {
              return null;
            }
            return {
              type: "Borrow" as const,
              asset: decoded.args.asset,
              timestamp: decoded.args.timestamp,
              participants: [decoded.args.user],
            };
          case "Repay":
            if (!decoded.args.asset || !decoded.args.timestamp || !decoded.args.user) {
              return null;
            }
            return {
              type: "Repay" as const,
              asset: decoded.args.asset,
              timestamp: decoded.args.timestamp,
              participants: [decoded.args.user],
            };
          case "Liquidation":
            if (
              !decoded.args.asset ||
              !decoded.args.timestamp ||
              !("user" in decoded.args) ||
              !decoded.args.user ||
              !("liquidator" in decoded.args) ||
              !decoded.args.liquidator
            ) {
              return null;
            }
            return {
              type: "Liquidation" as const,
              asset: decoded.args.asset,
              timestamp: decoded.args.timestamp,
              participants: [decoded.args.user, decoded.args.liquidator],
            };
          default:
            return null;
        }
      } catch {
        return null;
      }
    })
    .filter((event): event is ProtocolEvent => event !== null)
    .sort((left, right) => Number(left.timestamp - right.timestamp));
}

function buildWalletSeries(events: ProtocolEvent[], days = 7): ActivityPoint[] {
  const labels = new Map<string, Set<string>>();
  const now = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - offset);
    const key = day.toISOString().slice(0, 10);
    labels.set(key, new Set());
  }

  for (const event of events) {
    if (event.type !== "Supply") {
      continue;
    }

    const timestamp = new Date(Number(event.timestamp) * 1000);
    const key = timestamp.toISOString().slice(0, 10);

    if (!labels.has(key)) {
      continue;
    }

    for (const participant of event.participants) {
      labels.get(key)?.add(participant.toLowerCase());
    }
  }

  return Array.from(labels.entries()).map(([key, users]) => ({
    label: new Date(key).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    wallets: users.size,
  }));
}

function buildInteractionMix(events: ProtocolEvent[]): TrackerData["interactionMix"] {
  const total = events.length || 1;
  const counts = {
    Supply: events.filter((event) => event.type === "Supply").length,
    Borrow: events.filter((event) => event.type === "Borrow").length,
    Repay: events.filter((event) => event.type === "Repay").length,
    Withdraw: events.filter((event) => event.type === "Withdraw").length,
  };

  return [
    { label: "Supply", value: Math.round((counts.Supply / total) * 100), tone: "yellow" },
    { label: "Borrow", value: Math.round((counts.Borrow / total) * 100), tone: "green" },
    { label: "Repay", value: Math.round((counts.Repay / total) * 100), tone: "cyan" },
    { label: "Withdraw", value: Math.round((counts.Withdraw / total) * 100), tone: "slate" },
  ];
}

function buildWalletLeaderboards(
  events: ProtocolEvent[],
  limit = 8,
): Pick<TrackerData, "mostActiveWallets" | "walletsWithMostAssets"> {
  const statsByWallet = new Map<
    string,
    {
      wallet: string;
      interactions: number;
      assets: Set<string>;
    }
  >();

  for (const event of events) {
    for (const participant of event.participants) {
      const key = participant.toLowerCase();
      const current = statsByWallet.get(key) ?? {
        wallet: participant,
        interactions: 0,
        assets: new Set<string>(),
      };

      current.interactions += 1;
      current.assets.add(event.asset.toLowerCase());
      statsByWallet.set(key, current);
    }
  }

  const rows: WalletLeaderboardRow[] = Array.from(statsByWallet.values()).map((row) => ({
    wallet: formatAddress(row.wallet),
    interactions: row.interactions,
    uniqueAssets: row.assets.size,
  }));

  const mostActiveWallets = [...rows]
    .sort((left, right) => {
      if (right.interactions !== left.interactions) {
        return right.interactions - left.interactions;
      }

      return right.uniqueAssets - left.uniqueAssets;
    })
    .slice(0, limit);

  const walletsWithMostAssets = [...rows]
    .sort((left, right) => {
      if (right.uniqueAssets !== left.uniqueAssets) {
        return right.uniqueAssets - left.uniqueAssets;
      }

      return right.interactions - left.interactions;
    })
    .slice(0, limit);

  return {
    mostActiveWallets,
    walletsWithMostAssets,
  };
}

function buildTokenRows(snapshots: AssetSnapshot[], events: ProtocolEvent[]): TokenRow[] {
  return snapshots
    .map((snapshot) => {
      const assetEvents = events.filter(
        (event) => event.asset.toLowerCase() === snapshot.asset.address.toLowerCase(),
      );
      const suppliedUnits = bigintToNumber(snapshot.totalSupplied, snapshot.asset.decimals);
      const borrowedUnits = bigintToNumber(snapshot.totalBorrowed, snapshot.asset.decimals);
      const priceUsd = bigintToNumber(snapshot.priceUsd, 18);
      const suppliedUsd = suppliedUnits * priceUsd;
      const borrowedUsd = borrowedUnits * priceUsd;
      const availableUsd = Math.max(suppliedUsd - borrowedUsd, 0);
      const uniqueUsers = uniqueCount(assetEvents.flatMap((event) => event.participants));

      return {
        symbol: snapshot.asset.symbol,
        name: snapshot.asset.name,
        contract: formatAddress(snapshot.asset.address),
        totalInteractions: assetEvents.length,
        zenFinanceInteractions: assetEvents.length,
        uniqueUsers,
        activeSuppliers: snapshot.activeSuppliers,
        activeBorrowers: snapshot.activeBorrowers,
        suppliedUsd,
        borrowedUsd,
        availableUsd,
        priceUsd,
        utilization: suppliedUsd > 0 ? (borrowedUsd / suppliedUsd) * 100 : 0,
      } satisfies TokenRow;
    })
    .sort((left, right) => right.suppliedUsd - left.suppliedUsd);
}

function countWindowUsers(events: ProtocolEvent[], seconds: number): number {
  const threshold = BigInt(Math.floor(Date.now() / 1000) - seconds);
  return uniqueCount(
    events
      .filter((event) => event.timestamp >= threshold)
      .flatMap((event) => event.participants),
  );
}

function buildMetrics(tokenRows: TokenRow[], events: ProtocolEvent[]): TrackerMetric[] {
  const protocolUsers = uniqueCount(events.flatMap((event) => event.participants));
  const dailyUsers = countWindowUsers(events, 60 * 60 * 24);
  const weeklyUsers = countWindowUsers(events, 60 * 60 * 24 * 7);
  const monthlyUsers = countWindowUsers(events, 60 * 60 * 24 * 30);
  const totalMarketSize = tokenRows.reduce((sum, row) => sum + row.suppliedUsd, 0);
  const totalBorrowed = tokenRows.reduce((sum, row) => sum + row.borrowedUsd, 0);
  const availableToBorrow = tokenRows.reduce((sum, row) => sum + row.availableUsd, 0);

  return [
    { label: "Protocol users", value: formatCount(protocolUsers), change: `${formatCount(events.length)} total contract interactions`, tone: "yellow" },
    { label: "Daily active wallets", value: formatCount(dailyUsers), change: `${formatCount(weeklyUsers)} active over 7d`, tone: "green" },
    { label: "Weekly active wallets", value: formatCount(weeklyUsers), change: `${formatCount(monthlyUsers)} active over 30d`, tone: "cyan" },
    { label: "Monthly active wallets", value: formatCount(monthlyUsers), change: `${formatCount(protocolUsers)} all-time unique wallets`, tone: "slate" },
    { label: "Total market size", value: formatUsd(totalMarketSize), change: `${tokenRows.length} assets priced by oracle`, tone: "yellow" },
    { label: "Total borrowed", value: formatUsd(totalBorrowed), change: totalMarketSize > 0 ? `${percent((totalBorrowed / totalMarketSize) * 100)} utilization` : "0.0% utilization", tone: "green" },
    { label: "Available to borrow", value: formatUsd(availableToBorrow), change: `${formatUsd(totalMarketSize)} total supplied`, tone: "cyan" },
  ];
}

export async function getTrackerData(): Promise<TrackerData> {
  const client = makeClient();
  const deployment = await selectDeployment(client);
  const [snapshots, events] = await Promise.all([
    readAssetSnapshots(client, deployment),
    readProtocolEvents(client, deployment),
  ]);
  const tokenRows = buildTokenRows(snapshots, events);
  const { mostActiveWallets, walletsWithMostAssets } = buildWalletLeaderboards(events);
  const totalMarketSize = tokenRows.reduce((sum, row) => sum + row.suppliedUsd, 0);

  return {
    mode: "live",
    sourceLabel: `Direct ZenChain RPC | ${deployment.label}`,
    sourceDetail:
      "The dashboard reads ZenFinance pool and oracle contracts directly from ZenChain RPC, and derives interaction analytics from recent on-chain pool events.",
    metrics: buildMetrics(tokenRows, events),
    tokenRows,
    activeWalletSeries: buildWalletSeries(events),
    mostActiveWallets,
    walletsWithMostAssets,
    interactionMix: buildInteractionMix(events),
    recentNotes: [
      `Pool contract: ${deployment.poolAddress}`,
      `Oracle contract: ${deployment.oracleAddress}`,
      `Event analytics window: last ${EVENT_LOOKBACK_BLOCKS.toString()} blocks (direct chain scan).`,
      `Market size is computed as oracle-priced total supplied across ${tokenRows.length} tracked assets and currently totals ${formatUsd(totalMarketSize)}.`,
    ],
    lastUpdated: new Date().toISOString(),
  };
}
