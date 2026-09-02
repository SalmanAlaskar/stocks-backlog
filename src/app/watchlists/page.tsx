import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentPriceHalalas } from "@/lib/market";
import { formatSar, formatPercent } from "@/lib/money";
import { createWatchlistAction, deleteWatchlistAction, removeFromWatchlistAction } from "./actions";

export default async function WatchlistsPage({
  searchParams,
}: {
  searchParams: Promise<{ shariah?: string }>;
}) {
  const user = await requireVerifiedUser();
  const { shariah } = await searchParams;
  const watchlists = await db.watchlist.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { items: { include: { stock: true } } },
  });
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Watchlists</h1>
        <p className="text-sm text-zinc-400">Track TASI stocks you&apos;re interested in.</p>
      </div>

      <form action={createWatchlistAction} className="flex gap-3">
        <input name="name" placeholder="New watchlist name" required className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 flex-1 rounded border border-zinc-700 px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-500">Create</button>
      </form>

      {watchlists.length === 0 && (
        <p className="text-sm text-zinc-400">No watchlists yet. Create one above, or add stocks from the <Link href="/market" className="text-emerald-400">market page</Link>.</p>
      )}

      {watchlists.length > 0 && (
        <form className="flex items-center gap-3" method="get">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" name="shariah" value="1" defaultChecked={shariah === "1"} />
            Shariah-compliant only
          </label>
          <button type="submit" className="rounded bg-emerald-600 text-white px-3 py-1.5 text-sm hover:bg-emerald-500">Filter</button>
          {shariah === "1" && <Link href="/watchlists" className="text-sm text-zinc-400 hover:text-zinc-200">Clear</Link>}
        </form>
      )}

      {watchlists.map((wl) => {
        const items = shariah === "1" ? wl.items.filter((item) => item.stock.shariahCompliant) : wl.items;
        return (
        <div key={wl.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">{wl.name}</h2>
            <form action={deleteWatchlistAction}>
              <input type="hidden" name="id" value={wl.id} />
              <button type="submit" className="text-xs text-red-400 hover:underline">Delete watchlist</button>
            </form>
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-400">{wl.items.length === 0 ? "No stocks added yet." : "No stocks match this filter."}</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {items.map((item) => {
                  const price = currentPriceHalalas(item.stock.ticker, item.stock.previousCloseHalalas, now, item.stock.lastRealPriceHalalas, item.stock.lastRealPriceAt);
                  const changePct = (Number(price - item.stock.previousCloseHalalas) / Number(item.stock.previousCloseHalalas)) * 100;
                  return (
                    <tr key={item.id} className="border-b border-zinc-800 last:border-0">
                      <td className="py-2">
                        <Link href={`/market/${item.stock.ticker}`} className="font-medium text-emerald-400">{item.stock.ticker}</Link>
                        <span className="text-zinc-400 ml-2">{item.stock.nameEn}</span>
                      </td>
                      <td className="py-2 text-right">{formatSar(price)}</td>
                      <td className={`py-2 text-right ${changePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatPercent(changePct)}</td>
                      <td className="py-2 text-right">
                        <form action={removeFromWatchlistAction}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button type="submit" className="text-xs text-zinc-400 hover:text-red-400">Remove</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        );
      })}
    </div>
  );
}
