import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { halalasToSar } from "@/lib/money";

export async function GET() {
  const user = await requireVerifiedUser();
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { stock: true },
  });

  const header = "Date,Ticker,Company,Side,Type,Quantity,FillPriceSAR,Status,SettlementDate";
  const rows = orders.map((o) =>
    [
      o.createdAt.toISOString(),
      o.stock.ticker,
      o.stock.nameEn,
      o.side,
      o.type,
      o.quantity,
      o.fillPriceHalalas ? halalasToSar(o.fillPriceHalalas).toFixed(2) : "",
      o.status,
      o.settlementDate ? o.settlementDate.toISOString().slice(0, 10) : "",
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trade-history-${user.mobile}.csv"`,
    },
  });
}
