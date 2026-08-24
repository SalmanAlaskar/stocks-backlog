"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function markAllReadAction() {
  const user = await requireVerifiedUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
}

export async function markReadAction(formData: FormData) {
  const user = await requireVerifiedUser();
  const id = String(formData.get("id"));
  await db.notification.updateMany({ where: { id, userId: user.id }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
}
