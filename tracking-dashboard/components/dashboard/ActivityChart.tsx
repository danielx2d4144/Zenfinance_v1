import type { ActivityPoint } from "@/lib/analytics";

export function ActivityChart({ points }: { points: ActivityPoint[] }) {
  const max = Math.max(...points.map((point) => point.wallets), 1);

  return (
    <div className="zen-card p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Vault deposit activity</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Active supply wallets</h3>
        </div>
        <p className="max-w-52 text-right text-sm text-slate-400">
          Unique wallets with supply-side activity across the recent indexed window.
        </p>
      </div>
      <div className="flex h-60 items-end gap-3">
        {points.map((point) => {
          const height = `${Math.max((point.wallets / max) * 100, 12)}%`;

          return (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
              <div className="flex h-full w-full items-end rounded-2xl bg-white/5 p-2">
                <div
                  className="w-full rounded-xl bg-[linear-gradient(180deg,rgba(250,204,21,0.95),rgba(34,197,94,0.75)_58%,rgba(6,182,212,0.75))]"
                  style={{ height }}
                />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-white">{point.wallets}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{point.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
