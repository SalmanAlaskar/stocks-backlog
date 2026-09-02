import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatSar, formatPercent } from "@/lib/money";
import { abianHistory } from "@/lib/abian";
import Sparkline from "@/components/Sparkline";

const RANGES: Record<string, number> = { "1M": 30, "3M": 90, "6M": 180, "1Y": 365, All: 365 * 3 };

export default async function AbianPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireVerifiedUser();
  const { range } = await searchParams;
  const rangeKey = range && RANGES[range] ? range : "1M";

  const account = await db.abianAccount.findUnique({
    where: { userId: user.id },
    include: { funds: true },
  });

  if (!account) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Abian</h1>
          <p className="text-sm text-zinc-500">Your managed, diversified investment portfolio.</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-6 text-sm text-zinc-500">
          You don&apos;t have an Abian portfolio yet. This is a separate managed-investment product
          from your self-directed <Link href="/portfolio" className="text-emerald-700">stock holdings</Link>.
        </div>
      </div>
    );
  }

  const now = new Date();
  const candles = abianHistory(account.id, account.marketValueHalalas, RANGES[rangeKey], now);
  const returnPct = account.currentReturnBps / 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Abian</h1>
        <p className="text-sm text-zinc-500">Your managed, diversified investment portfolio.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs text-zinc-500">Market value</div>
          <div className="text-2xl font-semibold">{formatSar(account.marketValueHalalas)}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs text-zinc-500">Returns since inception</div>
          <div className="text-2xl font-semibold text-emerald-700">{formatSar(account.returnsSinceInceptionHalalas)}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs text-zinc-500">Current returns</div>
          <div className={`text-2xl font-semibold ${account.currentReturnHalalas < 0n ? "text-red-600" : "text-emerald-700"}`}>
            {formatSar(account.currentReturnHalalas)}
          </div>
          <div className="text-xs text-zinc-500">{formatPercent(returnPct)}</div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Portfolio performance</h2>
          <div className="flex gap-2 text-xs">
            {Object.keys(RANGES).map((r) => (
              <Link
                key={r}
                href={`/abian?range=${r}`}
                className={`px-2 py-1 rounded ${rangeKey === r ? "bg-emerald-700 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}
              >
                {r}
              </Link>
            ))}
          </div>
        </div>
        <Sparkline candles={candles} />
        <p className="text-xs text-zinc-400 mt-2">Illustrative performance path for demo purposes — ends at your real current value.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <h2 className="font-medium mb-3">Savings</h2>
          <div className="text-2xl font-semibold">{formatSar(account.savingsHalalas)}</div>
          <p className="text-xs text-zinc-500 mt-1">Uninvested cash held within your Abian account.</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <h2 className="font-medium mb-3">Investment portfolios</h2>
          {account.funds.length === 0 ? (
            <p className="text-sm text-zinc-500">No underlying funds on record.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {account.funds.map((f) => (
                <li key={f.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <div>{f.nameEn}</div>
                    <div className="text-xs text-zinc-400" dir="rtl">{f.nameAr}</div>
                  </div>
                  <span className="font-medium">{formatSar(f.valueHalalas)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
