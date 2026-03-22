"use client";

import { useState } from "react";

import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TokenTable } from "@/components/dashboard/TokenTable";
import type { TrackerData } from "@/lib/analytics";

const toneClasses = {
  yellow: "bg-amber-400/90",
  green: "bg-emerald-400/90",
  cyan: "bg-cyan-400/90",
  slate: "bg-slate-400/90",
};

export function TrackerDashboardClient({ initialData }: { initialData: TrackerData }) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  async function handleRefresh() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    setRefreshError(null);

    try {
      const response = await fetch(`/api/tracker-data?ts=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh tracker data");
      }

      const nextData = (await response.json()) as TrackerData;
      setData(nextData);
    } catch {
      setRefreshError("Could not pull latest blockchain data. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <main className="zen-shell">
      <div className="zen-container space-y-6">
        <section className="zen-card overflow-hidden p-6 md:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-300">
                <span className={`h-2.5 w-2.5 rounded-full ${data.mode === "live" ? "bg-emerald-400" : "bg-amber-400"}`} />
                {data.sourceLabel}
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-6xl">
                ZenFinance protocol tracking dashboard for contract activity, wallet behavior, and liquidity depth.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">{data.sourceDetail}</p>
            </div>
            <div className="grid min-w-[280px] gap-3 rounded-3xl border border-white/10 bg-[rgba(6,10,24,0.55)] p-5 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4">
                <span>Last updated</span>
                <span className="font-mono text-xs text-slate-400">{new Date(data.lastUpdated).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Tracker app</span>
                <span className="font-medium text-white">Isolated in tracking-dashboard</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Primary source</span>
                <span className="font-medium text-white">Direct chain RPC + contract events</span>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-400/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRefreshing ? "Refreshing..." : "Refresh Blockchain Data"}
                </button>
                {refreshError ? <p className="mt-2 text-xs text-rose-300">{refreshError}</p> : null}
              </div>
            </div>
          </div>
        </section>

        <section className="zen-grid kpi-grid">
          {data.metrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </section>

        <section className="zen-grid chart-grid">
          <ActivityChart points={data.activeWalletSeries} />

          <div className="zen-card p-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Interaction mix</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Protocol activity composition</h3>
              </div>
              <p className="max-w-56 text-right text-sm text-slate-400">
                Share of indexed interactions grouped by action type across the current dataset.
              </p>
            </div>

            <div className="space-y-5">
              {data.interactionMix.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium text-white">{item.label}</span>
                    <span className="text-slate-400">{item.value}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/6 p-[2px]">
                    <div className={`h-full rounded-full ${toneClasses[item.tone]}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Tracker notes</p>
              <div className="mt-3 space-y-3 text-sm text-slate-300">
                {data.recentNotes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="zen-grid chart-grid">
          <div className="zen-card p-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Wallet leaderboard</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Most active wallets</h3>
              </div>
              <p className="max-w-56 text-right text-sm text-slate-400">
                Ranked by highest interaction count across protocol events.
              </p>
            </div>

            <div className="space-y-3">
              {data.mostActiveWallets.length > 0 ? (
                data.mostActiveWallets.map((wallet, index) => (
                  <div
                    key={`active-${wallet.wallet}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-mono text-xs text-slate-300">{wallet.wallet}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Rank #{index + 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{wallet.interactions.toLocaleString()} interactions</p>
                      <p className="text-xs text-slate-400">{wallet.uniqueAssets.toLocaleString()} unique assets</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No wallet activity found in the current event window.</p>
              )}
            </div>
          </div>

          <div className="zen-card p-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Wallet diversification</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Wallets with most assets</h3>
              </div>
              <p className="max-w-56 text-right text-sm text-slate-400">
                Ranked by number of distinct assets touched in protocol events.
              </p>
            </div>

            <div className="space-y-3">
              {data.walletsWithMostAssets.length > 0 ? (
                data.walletsWithMostAssets.map((wallet, index) => (
                  <div
                    key={`assets-${wallet.wallet}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-mono text-xs text-slate-300">{wallet.wallet}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Rank #{index + 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">{wallet.uniqueAssets.toLocaleString()} assets</p>
                      <p className="text-xs text-slate-400">{wallet.interactions.toLocaleString()} interactions</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No wallet activity found in the current event window.</p>
              )}
            </div>
          </div>
        </section>

        <section>
          <TokenTable rows={data.tokenRows} />
        </section>
      </div>
    </main>
  );
}