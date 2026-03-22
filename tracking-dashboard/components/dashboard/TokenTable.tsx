import type { TokenRow } from "@/lib/analytics";

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 4,
  }).format(value);
}

export function TokenTable({ rows }: { rows: TokenRow[] }) {
  return (
    <div className="zen-card overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Token intelligence</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Contracts and protocol activity</h3>
        </div>
        <p className="max-w-64 text-right text-sm text-slate-400">
          Per-token interaction counts, utilization, wallet reach, and lending depth.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/4 text-left text-xs uppercase tracking-[0.22em] text-slate-400">
              <th className="px-6 py-4 font-medium">Asset</th>
              <th className="px-6 py-4 font-medium">Contract</th>
              <th className="px-6 py-4 font-medium">Interactions</th>
              <th className="px-6 py-4 font-medium">Protocol</th>
              <th className="px-6 py-4 font-medium">Users</th>
              <th className="px-6 py-4 font-medium">Suppliers</th>
              <th className="px-6 py-4 font-medium">Borrowers</th>
              <th className="px-6 py-4 font-medium">Supplied</th>
              <th className="px-6 py-4 font-medium">Borrowed</th>
              <th className="px-6 py-4 font-medium">Available</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.contract + row.symbol} className="border-b border-white/6 text-sm text-slate-200">
                <td className="px-6 py-4 align-top">
                  <div className="font-semibold text-white">{row.symbol}</div>
                  <div className="mt-1 text-slate-400">{row.name}</div>
                </td>
                <td className="px-6 py-4 font-mono text-xs text-slate-300">{row.contract}</td>
                <td className="px-6 py-4">{row.totalInteractions.toLocaleString()}</td>
                <td className="px-6 py-4">{row.zenFinanceInteractions.toLocaleString()}</td>
                <td className="px-6 py-4">{row.uniqueUsers.toLocaleString()}</td>
                <td className="px-6 py-4">{row.activeSuppliers.toLocaleString()}</td>
                <td className="px-6 py-4">{row.activeBorrowers.toLocaleString()}</td>
                <td className="px-6 py-4">{formatUsd(row.suppliedUsd)}</td>
                <td className="px-6 py-4">{formatUsd(row.borrowedUsd)}</td>
                <td className="px-6 py-4">{formatUsd(row.availableUsd)}</td>
                <td className="px-6 py-4">{formatPrice(row.priceUsd)}</td>
                <td className="px-6 py-4">{formatPercent(row.utilization)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
