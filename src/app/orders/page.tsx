import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { evaluatePendingOrders } from "@/lib/orders";
import { formatSar } from "@/lib/money";
import { cancelOrderAction } from "./actions";
import { OrderStatus, OrderSide } from "@/generated/prisma/client";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-400",
  FILLED: "bg-emerald-500/10 text-emerald-400",
  PARTIALLY_FILLED: "bg-amber-500/10 text-amber-400",
  CANCELLED: "bg-zinc-800 text-zinc-400",
  REJECTED: "bg-red-500/10 text-red-400",
  EXPIRED: "bg-zinc-800 text-zinc-400",
};

const STATUSES = Object.values(OrderStatus);

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; side?: string }>;
}) {
  const user = await requireVerifiedUser();
  await evaluatePendingOrders(user.id);
  const { status, side } = await searchParams;
  const statusFilter = status && (STATUSES as string[]).includes(status) ? (status as OrderStatus) : undefined;
  const sideFilter = side === "BUY" || side === "SELL" ? (side as OrderSide) : undefined;

  const orders = await db.order.findMany({
    where: {
      userId: user.id,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(sideFilter ? { side: sideFilter } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { stock: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Order history</h1>
        <p className="text-sm text-zinc-400">Track pending, filled, and settled orders. Tadawul settles on T+2.</p>
      </div>

      <form className="flex flex-wrap items-center gap-3" method="get">
        <select name="status" defaultValue={status ?? ""} className="bg-zinc-900 text-zinc-100 rounded border border-zinc-700 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <select name="side" defaultValue={side ?? ""} className="bg-zinc-900 text-zinc-100 rounded border border-zinc-700 px-3 py-2 text-sm">
          <option value="">Buy &amp; sell</option>
          <option value="BUY">Buy only</option>
          <option value="SELL">Sell only</option>
        </select>
        <button type="submit" className="rounded bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-500">Filter</button>
        {(status || side) && <Link href="/orders" className="text-sm text-zinc-400 hover:text-zinc-200">Clear filters</Link>}
      </form>

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
