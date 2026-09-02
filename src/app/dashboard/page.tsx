import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { formatSar, formatPercent } from "@/lib/money";
import { getHoldings } from "@/lib/portfolio";
import { getAppConfig } from "@/lib/config";
import { isMarketOpen } from "@/lib/market";
import { evaluatePendingOrders } from "@/lib/orders";
import { evaluatePriceAlerts } from "@/lib/alerts";
import { computeGoalProgress, getNetDepositedHalalas } from "@/lib/goals";
import { getNetWorthSummary } from "@/lib/netWorth";
import { analyzeNetWorth } from "@/lib/ai";
import AllocationBar from "@/components/AllocationBar";

export default async function DashboardPage() {
  const user = await requireVerifiedUser();
  await evaluatePendingOrders(user.id);
  await evaluatePriceAlerts(user.id);

  const [config, netDeposited, summary, holdings] = await Promise.all([
    getAppConfig(),
    getNetDepositedHalalas(user.id),
    getNetWorthSummary(user.id),
    getHoldings(user.id),
  ]);

  const marketOpen = isMarketOpen(new Date(), config.forceMarketOpen);
  const { totalAssetsHalalas, totalGainHalalas, buckets } = summary;
  const goal = computeGoalProgress({ netDepositedHalalas: netDeposited, netWorthHalalas: totalAssetsHalalas, now: new Date() });
  const insights = analyzeNetWorth(buckets, totalAssetsHalalas);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Welcome back, {user.fullName.split(" ")[0]}</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${marketOpen ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
          Tadawul {marketOpen ? "open" : "closed"}
        </span>
      </div>

      {/* Hero: total assets across every connected account */}
      <div className="bg-white border border-zinc-200 rounded-lg p-5">
        <div className="text-xs text-zinc-500">Total assets (all accounts)</div>
        <div className="text-4xl font-semibold mt-1">{formatSar(totalAssetsHalalas)}</div>
        <div className={`text-sm mt-1 ${totalGainHalalas < 0n ? "text-red-600" : "text-emerald-700"}`}>
          {formatSar(totalGainHalalas)} combined gain/loss
        </div>
        <p className="text-xs text-zinc-400 mt-2">
          Combines Wallet cash, stock holdings (unrealized), Abian (current-period return), and Al Rajhi funds
          (total gain since inception) — each account reports gain on a different basis, so the combined figure
          is a sum of those, not one apples-to-apples number. See the breakdown below.
        </p>
      </div>

      {/* Allocation across accounts */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="font-medium mb-3">Asset allocation</h2>
        <AllocationBar buckets={buckets} totalHalalas={totalAssetsHalalas} />
      </div>

      {/* Per-account breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {buckets.map((b) => (
          <Link key={b.key} href={b.href} className="block bg-white border border-zinc-200 rounded-lg p-4 hover:border-emerald-300">
            <div className="text-xs text-zinc-500">{b.label}</div>
            {b.exists || b.key === "wallet" ? (
              <>
                <div className="text-xl font-semibold mt-1">{formatSar(b.valueHalalas)}</div>
                {b.gainHalalas != null ? (
                  <div className={`text-xs mt-1 ${b.gainHalalas < 0n ? "text-red-600" : "text-emerald-700"}`}>
                    {formatSar(b.gainHalalas)} · {b.gainLabel}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400 mt-1">{b.gainLabel}</div>
                )}
              </>
            ) : (
              <div className="text-sm text-zinc-400 mt-1">Not set up yet &rarr;</div>
            )}
          </Link>
        ))}
      </div>

      {/* Cross-account insights */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="font-medium mb-1">Cross-account insights</h2>
        <p className="text-xs text-zinc-400 mb-3">Rule-based demo, not a live model call. Informational only — not financial advice.</p>
        <ul className="space-y-2 text-sm">
          {insights.map((insight, i) => (
            <li key={i} className={`flex gap-2 ${insight.severity === "warning" ? "text-amber-700" : "text-zinc-600"}`}>
              <span>{insight.severity === "warning" ? "!" : "i"}</span>
              <span>{insight.message}</span>
            </li>
          ))}
        </ul>
      </div>

      {goal && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-medium">2026 return goal</h2>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                goal.aheadOrBehind === "ahead"
                  ? "bg-emerald-100 text-emerald-700"
                  : goal.aheadOrBehind === "behind"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              {goal.aheadOrBehind === "ahead" ? "Ahead of pace" : goal.aheadOrBehind === "behind" ? "Behind pace" : "On track"}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            Informational only — arithmetic on your total assets across all accounts vs. your net deposits into
            your brokerage Wallet. Not a prediction or a trading recommendation; nothing here suggests what to
            buy or sell.
          </p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-2xl font-semibold ${goal.returnPct < 0 ? "text-red-600" : "text-emerald-700"}`}>
              {formatPercent(goal.returnPct)}
            </span>
            <span className="text-sm text-zinc-400">of {goal.targetPct}% target by Dec 31, 2026</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden mb-3">
            <div
              className={`h-full ${goal.returnPct < 0 ? "bg-red-500" : "bg-emerald-600"}`}
              style={{ width: `${Math.max(0, Math.min(100, (goal.returnPct / goal.targetPct) * 100))}%` }}
            />
          </div>
          <dl className="text-sm grid grid-cols-2 gap-2">
            <div><dt className="text-zinc-500 inline">Net capital deposited: </dt><dd className="inline">{formatSar(goal.netDepositedHalalas)}</dd></div>
            <div><dt className="text-zinc-500 inline">Current total assets: </dt><dd className="inline">{formatSar(goal.netWorthHalalas)}</dd></div>
            <div><dt className="text-zinc-500 inline">Trading days left in 2026: </dt><dd className="inline">{goal.remainingTradingDays}</dd></div>
            <div>
              <dt className="text-zinc-500 inline">Avg. daily growth still needed: </dt>
              <dd className="inline">{goal.requiredDailyGrowthPct != null ? formatPercent(goal.requiredDailyGrowthPct) : "N/A"}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Stock holdings</h2>
          <Link href="/portfolio" className="text-xs text-emerald-700">View portfolio &rarr;</Link>
        </div>
        {holdings.length === 0 ? (
          <p className="text-sm text-zinc-500">
            You don&apos;t hold any positions yet. <Link href="/market" className="text-emerald-700">Browse the market</Link> to place your first trade.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {holdings.slice(0, 5).map((h) => (
              <li key={h.stock.id} className="py-2 flex items-center justify-between text-sm">
                <Link href={`/market/${h.stock.ticker}`} className="hover:text-emerald-700">
                  {h.stock.ticker} &middot; {h.stock.nameEn}
                </Link>
                <span>{h.quantity} shares &middot; {formatSar(h.marketValueHalalas)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
