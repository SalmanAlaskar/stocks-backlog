import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatSar, formatPercent } from "@/lib/money";
import { getHoldings } from "@/lib/portfolio";
import { getAppConfig } from "@/lib/config";
import { isMarketOpen } from "@/lib/market";
import { evaluatePendingOrders } from "@/lib/orders";
import { evaluatePriceAlerts } from "@/lib/alerts";
import { computeGoalProgress, getNetDepositedHalalas } from "@/lib/goals";

export default async function DashboardPage() {
  const user = await requireVerifiedUser();
  await evaluatePendingOrders(user.id);
  await evaluatePriceAlerts(user.id);

  const [wallet, holdings, config, netDeposited] = await Promise.all([
    db.wallet.findUniqueOrThrow({ where: { userId: user.id } }),
    getHoldings(user.id),
    getAppConfig(),
    getNetDepositedHalalas(user.id),
  ]);

  const marketOpen = isMarketOpen(new Date(), config.forceMarketOpen);
  const marketValue = holdings.reduce((s, h) => s + h.marketValueHalalas, 0n);
  const costBasis = holdings.reduce((s, h) => s + h.costBasisHalalas, 0n);
  const unrealized = marketValue - costBasis;
  const unrealizedPct = costBasis > 0n ? (Number(unrealized) / Number(costBasis)) * 100 : 0;
  const netWorth = wallet.balanceHalalas + marketValue;
  const goal = computeGoalProgress({ netDepositedHalalas: netDeposited, netWorthHalalas: netWorth, now: new Date() });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Welcome back, {user.fullName.split(" ")[0]}</h1>
        <span className={`text-xs px-2 py-1 rounded-full ${marketOpen ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
          Tadawul {marketOpen ? "open" : "closed"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs text-zinc-500">Net worth</div>
          <div className="text-2xl font-semibold">{formatSar(netWorth)}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs text-zinc-500">Wallet balance</div>
          <div className="text-2xl font-semibold">{formatSar(wallet.balanceHalalas)}</div>
          <Link href="/wallet" className="text-xs text-emerald-700">Manage wallet &rarr;</Link>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs text-zinc-500">Unrealized gain/loss</div>
          <div className={`text-2xl font-semibold ${unrealized < 0n ? "text-red-600" : "text-emerald-700"}`}>
            {formatSar(unrealized)}
          </div>
          <div className="text-xs text-zinc-500">{formatPercent(unrealizedPct)}</div>
        </div>
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
            Informational only — arithmetic on your own deposits and portfolio value. Not a prediction or a
            trading recommendation; nothing here suggests what to buy or sell.
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
            <div><dt className="text-zinc-500 inline">Current net worth: </dt><dd className="inline">{formatSar(goal.netWorthHalalas)}</dd></div>
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
          <h2 className="font-medium">Holdings</h2>
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
