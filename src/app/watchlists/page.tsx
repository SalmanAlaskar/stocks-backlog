import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentPriceHalalas } from "@/lib/market";
import { formatSar, formatPercent } from "@/lib/money";
import { createWatchlistAction, deleteWatchlistAction, removeFromWatchlistAction } from "./actions";

export default async function WatchlistsPage() {
  const user = await requireVerifiedUser();
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
        <p className="text-sm text-zinc-500">Track TASI stocks you&apos;re interested in.</p>
      </div>

      <form action={createWatchlistAction} className="flex gap-3">
        <input name="name" placeholder="New watchlist name" required className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-emerald-700 text-white px-4 py-2 text-sm hover:bg-emerald-800">Create</button>
      </form>

      {watchlists.length === 0 && (
        <p className="text-sm text-zinc-500">No watchlists yet. Create one above, or add stocks from the <Link href="/market" className="text-emerald-700">market page</Link>.</p>
      )}

      {watchlists.map((wl) => (
        <div key={wl.id} className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium">{wl.name}</h2>
            <form action={deleteWatchlistAction}>
              <input type="hidden" name="id" value={wl.id} />
              <button type="submit" className="text-xs text-red-600 hover:underline">Delete watchlist</button>
            </form>
          </div>
          {wl.items.length === 0 ? (
            <p className="text-sm text-zinc-500">No stocks added yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {wl.items.map((item) => {
                  const price = currentPriceHalalas(item.stock.ticker, item.stock.previousCloseHalalas, now);
                  const changePct = (Number(price - item.stock.previousCloseHalalas) / Number(item.stock.previousCloseHalalas)) * 100;
                  return (
                    <tr key={item.id} className="border-b border-zinc-50 last:border-0">
                      <td className="py-2">
                        <Link href={`/market/${item.stock.ticker}`} className="font-medium text-emerald-700">{item.stock.ticker}</Link>
                        <span className="text-zinc-500 ml-2">{item.stock.nameEn}</span>
                      </td>
                      <td className="py-2 text-right">{formatSar(price)}</td>
                      <td className={`py-2 text-right ${changePct >= 0 ? "text-emerald-700" : "text-red-600"}`}>{formatPercent(changePct)}</td>
                      <td className="py-2 text-right">
                        <form action={removeFromWatchlistAction}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button type="submit" className="text-xs text-zinc-500 hover:text-red-600">Remove</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}
