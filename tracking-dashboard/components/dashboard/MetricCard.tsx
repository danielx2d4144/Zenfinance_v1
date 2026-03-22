import type { TrackerMetric } from "@/lib/analytics";

const accentMap: Record<TrackerMetric["tone"], string> = {
  yellow: "rgba(250, 204, 21, 0.9)",
  green: "rgba(34, 197, 94, 0.9)",
  cyan: "rgba(6, 182, 212, 0.9)",
  slate: "rgba(148, 163, 184, 0.9)",
};

export function MetricCard({ metric }: { metric: TrackerMetric }) {
  return (
    <article className="zen-card p-5 shadow-[0_20px_60px_rgba(10,14,39,0.35)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-sm uppercase tracking-[0.28em] text-slate-400">{metric.label}</span>
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: accentMap[metric.tone], boxShadow: `0 0 24px ${accentMap[metric.tone]}` }}
        />
      </div>
      <div className="text-3xl font-semibold tracking-tight text-white">{metric.value}</div>
      <p className="mt-2 text-sm text-slate-400">{metric.change}</p>
    </article>
  );
}
