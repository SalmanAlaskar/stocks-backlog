import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

/** Temporary QA-only endpoint: logs the caller in as the existing throwaway
 * test account, purely to visually verify pages that require auth. Remove
 * after verification. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const user = await db.user.findUnique({ where: { mobile: "0599999999" } });
  if (!user) return NextResponse.json({ error: "qa user not found" }, { status: 404 });
  await createSession(user.id);
  return NextResponse.redirect(new URL("/market", req.url));
}
