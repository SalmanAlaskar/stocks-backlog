"use server";

import { revalidatePath } from "next/cache";
import { requireVerifiedUser } from "@/lib/auth";
import { cancelOrder, OrderError } from "@/lib/orders";

export async function cancelOrderAction(formData: FormData) {
  const user = await requireVerifiedUser();
  const orderId = String(formData.get("orderId"));
  try {
    await cancelOrder(user.id, orderId);
  } catch (e) {
    if (!(e instanceof OrderError)) throw e;
  }
  revalidatePath("/orders");
  revalidatePath("/wallet");
}
