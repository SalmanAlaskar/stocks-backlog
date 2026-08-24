"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function approveNafathAction() {
  const user = await requireUser();
  await db.user.update({ where: { id: user.id }, data: { nafathVerifiedAt: new Date() } });
  redirect("/kyc");
}
