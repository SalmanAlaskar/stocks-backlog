import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const SESSION_COOKIE = "session_id";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

export async function createSession(userId: string, twoFactorVerified = true) {
  const session = await db.session.create({
    data: { userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS), twoFactorVerified },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });
  return session;
}

export async function destroySession() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await db.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

async function getCurrentSession() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  const session = await db.session.findUnique({ where: { id: sessionId }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session || !session.twoFactorVerified) return null;
  return session.user;
}

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.twoFactorVerified) redirect("/login/2fa");
  return session.user;
}

export async function requireVerifiedUser() {
  const user = await requireUser();
  if (!user.nafathVerifiedAt) redirect("/verify-nafath");
  if (user.kycStatus !== "APPROVED") redirect("/kyc");
  return user;
}

export async function markSessionTwoFactorVerified() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  return db.session.update({ where: { id: sessionId }, data: { twoFactorVerified: true } }).catch(() => null);
}

export async function getPendingTwoFactorUser() {
  const session = await getCurrentSession();
  if (!session || session.twoFactorVerified) return null;
  return session.user;
}
