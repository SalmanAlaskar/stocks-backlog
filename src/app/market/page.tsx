import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentPriceHalalas, hasFreshRealPrice } from "@/lib/market";
import { formatSar, formatPercent } from "@/lib/money";
import DataSourceNote from "@/components/DataSourceNote";

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; shariah?: string; sector?: string }>;
}) {
  await requireVerifiedUser();
  const { q, shariah, sector } = await searchParams;

  const [stocks, sectors] = await Promise.all([
    db.stock.findMany({
      where: {
        AND: [
          shariah === "1" ? { shariahCompliant: true } : {},
          sector ? { sector } : {},
          q
            ? {
                OR: [
                  { ticker: { contains: q } },
                  { nameEn: { contains: q } },
                  { nameAr: { contains: q } },
                ],
              }
            : {},
        ],
      },
      orderBy: { ticker: "asc" },
    }),
    db.stock.findMany({ distinct: ["sector"], select: { sector: true }, orderBy: { sector: "asc" } }),
  ]);

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">TASI Market</h1>
        <p className="text-sm text-zinc-400">Search Tadawul-listed stocks by ticker or company name.</p>
        <div className="mt-2"><DataSourceNote isReal={true} /></div>
      </div>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search ticker or company name..."
          className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 flex-1 min-w-[200px] rounded border border-zinc-700 px-3 py-2 text-sm"
        />
        <select
          name="sector"
          defaultValue={sector ?? ""}
          className="bg-zinc-900 text-zinc-100 rounded border border-zinc-700 px-3 py-2 text-sm"
        >
          <option value="">All sectors</option>
          {sectors.map((s) => (
            <option key={s.sector} value={s.sector}>{s.sector}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" name="shariah" value="1" defaultChecked={shariah === "1"} />
          Shariah-compliant only
        </label>
        <button type="submit" className="rounded bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-500">
          Search
        </button>
        {(q || shariah === "1" || sector) && (
          <Link href="/market" className="text-sm text-zinc-400 hover:text-zinc-200">Clear filters</Link>
        )}
      </form>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {stocks.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400">No matching stocks found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-zinc-800">
                <th className="py-2 px-4 font-normal">Ticker</th>
                <th className="py-2 px-4 font-normal">Company</th>
                <th className="py-2 px-4 font-normal">Sector</th>
                <th className="py-2 px-4 font-normal">Shariah</th>
                <th className="py-2 px-4 font-normal text-right">Price</th>
                <th className="py-2 px-4 font-normal text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => {
                const price = currentPriceHalalas(s.ticker, s.previousCloseHalalas, now, s.lastRealPriceHalalas, s.lastRealPriceAt);
                const changePct = (Number(price - s.previousCloseHalalas) / Number(s.previousCloseHalalas)) * 100;
                const isReal = hasFreshRealPrice(s.lastRealPriceAt, now);
                return (
                  <tr key={s.id} className="border-b border-zinc-800 hover:bg-zinc-800/60">
                    <td className="py-2 px-4">
                      <Link href={`/market/${s.ticker}`} className="font-medium text-emerald-400">{s.ticker}</Link>
                    </td>
                    <td className="py-2 px-4">
                      <div>{s.nameEn}</div>
                      <div className="text-xs text-zinc-500" dir="rtl">{s.nameAr}</div>
                    </td>
                    <td className="py-2 px-4 text-zinc-400">{s.sector}</td>
                    <td className="py-2 px-4">
                      {s.shariahCompliant ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Compliant</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">Non-compliant</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-right">
                      {formatSar(price)}
                      {!isReal && <div className="text-[10px] text-amber-500">simulated</div>}
                    </td>
                    <td className={`py-2 px-4 text-right ${changePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {formatPercent(changePct)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
