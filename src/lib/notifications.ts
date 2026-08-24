import { db } from "@/lib/db";

type NotificationType = "PRICE_ALERT" | "ORDER_FILL" | "IPO_RESULT" | "NEWS";

const PREF_FIELD: Record<NotificationType, "priceAlerts" | "orderFills" | "ipoResults" | "news"> = {
  PRICE_ALERT: "priceAlerts",
  ORDER_FILL: "orderFills",
  IPO_RESULT: "ipoResults",
  NEWS: "news",
};

export async function notify(userId: string, type: NotificationType, title: string, body: string) {
  const prefs = await db.notificationPreference.findUnique({ where: { userId } });
  const field = PREF_FIELD[type];
  if (prefs && prefs[field] === false) return;

  await db.notification.create({ data: { userId, type, title, body } });
}

export async function getUnreadCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
