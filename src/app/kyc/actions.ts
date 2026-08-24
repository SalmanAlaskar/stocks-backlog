"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function submitKycAction(formData: FormData) {
  const user = await requireUser();
  const riskProfile = String(formData.get("riskProfile") ?? "");
  const sourceOfFunds = String(formData.get("sourceOfFunds") ?? "");

  await db.user.update({
    where: { id: user.id },
    data: { riskProfile, sourceOfFunds, kycStatus: "PENDING" },
  });
  redirect("/kyc");
}

export async function checkKycStatusAction() {
  const user = await requireUser();
  if (user.kycStatus === "PENDING") {
    await db.user.update({ where: { id: user.id }, data: { kycStatus: "APPROVED" } });
    redirect("/dashboard");
  }
  redirect("/kyc");
}
