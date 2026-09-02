import { db } from "@/lib/db";
import { currentPriceHalalas } from "@/lib/market";
import { formatSar } from "@/lib/money";
import { notify } from "@/lib/notifications";

export async function evaluatePriceAlerts(userId: string) {
  const alerts = await db.priceAlert.findMany({
    where: { userId, triggeredAt: null },
    include: { stock: true },
  });

  const now = new Date();
  for (const alert of alerts) {
    const price = currentPriceHalalas(alert.stock.ticker, alert.stock.previousCloseHalalas, now, alert.stock.lastRealPriceHalalas, alert.stock.lastRealPriceAt);
    const crossed = alert.direction === "ABOVE" ? price >= alert.targetHalalas : price <= alert.targetHalalas;
    if (!crossed) continue;

    await db.priceAlert.update({ where: { id: alert.id }, data: { triggeredAt: now } });
    await notify(
      userId,
      "PRICE_ALERT",
      `${alert.stock.ticker} hit your target`,
      `${alert.stock.ticker} (${alert.stock.nameEn}) is now ${formatSar(price)}, ${alert.direction === "ABOVE" ? "above" : "below"} your target of ${formatSar(alert.targetHalalas)}.`
    );
  }
}
