"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/auth";

export async function createWatchlistAction(formData: FormData) {
  const user = await requireVerifiedUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db.watchlist.create({ data: { userId: user.id, name } });
  revalidatePath("/watchlists");
}

export async function renameWatchlistAction(formData: FormData) {
  const user = await requireVerifiedUser();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db.watchlist.updateMany({ where: { id, userId: user.id }, data: { name } });
  revalidatePath("/watchlists");
}

export async function deleteWatchlistAction(formData: FormData) {
  const user = await requireVerifiedUser();
  const id = String(formData.get("id"));
  await db.watchlist.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/watchlists");
}

export async function addToWatchlistAction(formData: FormData) {
  const user = await requireVerifiedUser();
  const watchlistId = String(formData.get("watchlistId"));
  const stockId = String(formData.get("stockId"));
  const watchlist = await db.watchlist.findFirst({ where: { id: watchlistId, userId: user.id } });
  if (!watchlist) return;
  await db.watchlistItem.upsert({
    where: { watchlistId_stockId: { watchlistId, stockId } },
    update: {},
    create: { watchlistId, stockId },
  });
  revalidatePath("/watchlists");
  const stock = await db.stock.findUnique({ where: { id: stockId } });
  if (stock) revalidatePath(`/market/${stock.ticker}`);
}

export async function removeFromWatchlistAction(formData: FormData) {
  const user = await requireVerifiedUser();
  const itemId = String(formData.get("itemId"));
  await db.watchlistItem.deleteMany({ where: { id: itemId, watchlist: { userId: user.id } } });
  revalidatePath("/watchlists");
}
