import { formatSar } from "@/lib/money";
import type { AccountBucket } from "@/lib/netWorth";

// Categorical slots 1-4 from the validated reference palette (blue/orange/aqua/yellow),
// dark-mode steps (validated against our zinc-900 card surface) — order fixed, never reassigned.
const COLORS: Record<AccountBucket["key"], string> = {
  wallet: "#3987e5",
  stocks: "#d95926",
  abian: "#199e70",
  alrajhi: "#c98500",
};

export default function AllocationBar({ buckets, totalHalalas }: { buckets: AccountBucket[]; totalHalalas: bigint }) {
  const visible = buckets.filter((b) => b.valueHalalas > 0n);
  if (visible.length === 0 || totalHalalas === 0n) {
    return <p className="text-sm text-zinc-400">No assets to show an allocation for yet.</p>;
  }

  return (
    <div>
      <div className="flex gap-0.5 w-full overflow-hidden rounded" style={{ height: 24 }}>
        {visible.map((b, i) => {
          const pct = (Number(b.valueHalalas) / Number(totalHalalas)) * 100;
          return (
            <div
              key={b.key}
              title={`${b.label}: ${formatSar(b.valueHalalas)} (${pct.toFixed(1)}%)`}
              style={{
                width: `${pct}%`,
                height: "100%",
                backgroundColor: COLORS[b.key],
                borderTopLeftRadius: i === 0 ? 4 : 0,
                borderBottomLeftRadius: i === 0 ? 4 : 0,
                borderTopRightRadius: i === visible.length - 1 ? 4 : 0,
                borderBottomRightRadius: i === visible.length - 1 ? 4 : 0,
              }}
            />
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs">
        {visible.map((b) => {
          const pct = (Number(b.valueHalalas) / Number(totalHalalas)) * 100;
          return (
            <li key={b.key} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[b.key] }} />
              <span className="text-zinc-300">{b.label}</span>
              <span className="text-zinc-50 font-medium">{formatSar(b.valueHalalas)}</span>
              <span className="text-zinc-500">({pct.toFixed(1)}%)</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
