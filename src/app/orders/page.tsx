import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { evaluatePendingOrders } from "@/lib/orders";
import { formatSar } from "@/lib/money";
import { cancelOrderAction } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400",
  FILLED: "bg-emerald-500/10 text-emerald-400",
  PARTIALLY_FILLED: "bg-amber-500/10 text-amber-400",
  CANCELLED: "bg-zinc-800 text-zinc-400",
  REJECTED: "bg-red-500/10 text-red-400",
  EXPIRED: "bg-zinc-800 text-zinc-400",
};

export default async function OrdersPage() {
  const user = await requireVerifiedUser();
  await evaluatePendingOrders(user.id);

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { stock: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Order history</h1>
        <p className="text-sm text-zinc-400">Track pending, filled, and settled orders. Tadawul settles on T+2.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto">
        {orders.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-400 border-b border-zinc-800">
                <th className="py-2 px-4 font-normal">Date</th>
                <th className="py-2 px-4 font-normal">Stock</th>
                <th className="py-2 px-4 font-normal">Side</th>
                <th className="py-2 px-4 font-normal">Type</th>
                <th className="py-2 px-4 font-normal text-right">Qty</th>
                <th className="py-2 px-4 font-normal text-right">Fill price</th>
                <th className="py-2 px-4 font-normal">Status</th>
                <th className="py-2 px-4 font-normal">Settlement</th>
                <th className="py-2 px-4 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-zinc-800">
                  <td className="py-2 px-4 text-zinc-400">{o.createdAt.toLocaleString("en-US")}</td>
                  <td className="py-2 px-4">{o.stock.ticker}</td>
                  <td className={`py-2 px-4 ${o.side === "BUY" ? "text-emerald-400" : "text-red-400"}`}>{o.side}</td>
                  <td className="py-2 px-4">{o.type}</td>
                  <td className="py-2 px-4 text-right">{o.quantity}</td>
                  <td className="py-2 px-4 text-right">{o.fillPriceHalalas ? formatSar(o.fillPriceHalalas) : "-"}</td>
                  <td className="py-2 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[o.status]}`}>{o.status.replace("_", " ")}</span>
                  </td>
                  <td className="py-2 px-4 text-zinc-400">
                    {o.status === "FILLED" && o.settlementDate
                      ? `Settles ${o.settlementDate.toLocaleDateString("en-US")}`
                      : "-"}
                  </td>
                  <td className="py-2 px-4">
                    {o.status === "PENDING" && (
                      <form action={cancelOrderAction}>
                        <input type="hidden" name="orderId" value={o.id} />
                        <button type="submit" className="text-xs text-red-400 hover:underline">Cancel</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
