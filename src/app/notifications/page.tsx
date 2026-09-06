import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { evaluatePriceAlerts } from "@/lib/alerts";
import { markAllReadAction, markReadAction } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  PRICE_ALERT: "Price alert",
  ORDER_FILL: "Order fill",
  IPO_RESULT: "IPO result",
  NEWS: "News",
};

const SORTS = {
  date_desc: { label: "Newest first" },
  date_asc: { label: "Oldest first" },
  unread_first: { label: "Unread first" },
} as const;
type SortKey = keyof typeof SORTS;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const user = await requireVerifiedUser();
  await evaluatePriceAlerts(user.id);
  const { sort } = await searchParams;
  const sortKey: SortKey = sort && sort in SORTS ? (sort as SortKey) : "date_desc";

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  if (sortKey === "date_asc") notifications.reverse();
  else if (sortKey === "unread_first") notifications.sort((a, b) => (a.readAt ? 1 : 0) - (b.readAt ? 1 : 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-zinc-400">Price alerts, order fills, and IPO results. Push/SMS delivery is simulated as in-app notifications here.</p>
        </div>
        <div className="flex items-center gap-3">
          {notifications.length > 1 && (
            <form className="flex items-center gap-2" method="get">
              <select name="sort" defaultValue={sortKey} className="bg-zinc-900 text-zinc-100 rounded border border-zinc-700 px-2 py-1.5 text-sm">
                {Object.entries(SORTS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button type="submit" className="rounded bg-emerald-600 text-white px-3 py-1.5 text-sm hover:bg-emerald-500">Sort</button>
            </form>
          )}
          {notifications.some((n) => !n.readAt) && (
            <form action={markAllReadAction}>
              <button type="submit" className="text-sm text-emerald-400 hover:underline">Mark all read</button>
            </form>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {notifications.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`p-4 flex items-start justify-between gap-4 ${!n.readAt ? "bg-emerald-500/10" : ""}`}>
              <div>
                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800">{TYPE_LABELS[n.type] ?? n.type}</span>
                  <span>{n.createdAt.toLocaleString("en-US")}</span>
                </div>
                <div className="font-medium text-sm">{n.title}</div>
                <div className="text-sm text-zinc-300">{n.body}</div>
              </div>
              {!n.readAt && (
                <form action={markReadAction}>
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" className="text-xs text-zinc-400 hover:text-emerald-300 shrink-0">Mark read</button>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
