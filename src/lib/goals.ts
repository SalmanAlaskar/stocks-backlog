import { isTradingDay } from "@/lib/market";
import { db } from "@/lib/db";

/**
 * Pure arithmetic on the user's own capital and portfolio value — this is
 * NOT a prediction, recommendation, or promise of future performance. It
 * reports facts (return so far, days left, what compounding rate the
 * remaining days would need to average) without suggesting any trade.
 */

export const GOAL_TARGET_PCT = 10;
export const GOAL_YEAR_END = new Date("2026-12-31T23:59:59Z");

export interface GoalProgress {
  netDepositedHalalas: bigint;
  netWorthHalalas: bigint;
  returnPct: number;
  targetPct: number;
  targetNetWorthHalalas: bigint;
  remainingTradingDays: number;
  requiredDailyGrowthPct: number | null;
  expectedPctByNow: number;
  aheadOrBehind: "ahead" | "behind" | "on-track";
}

function countRemainingTradingDays(from: Date, to: Date): number {
  if (to <= from) return 0;
  let count = 0;
  const cursor = new Date(from);
  while (cursor < to) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (cursor <= to && isTradingDay(cursor)) count++;
  }
  return count;
}

export async function getNetDepositedHalalas(userId: string): Promise<bigint> {
  const wallet = await db.wallet.findUnique({ where: { userId } });
  if (!wallet) return 0n;
  const deposits = await db.walletTransaction.findMany({
    where: { walletId: wallet.id, type: { in: ["DEPOSIT", "WITHDRAWAL"] } },
  });
  return deposits.reduce((s, tx) => s + tx.amountHalalas, 0n);
}

export function computeGoalProgress(params: {
  netDepositedHalalas: bigint;
  netWorthHalalas: bigint;
  now: Date;
  yearStart?: Date;
}): GoalProgress | null {
  const { netDepositedHalalas, netWorthHalalas, now } = params;
  if (netDepositedHalalas <= 0n) return null;

  const yearStart = params.yearStart ?? new Date(`${now.getUTCFullYear()}-01-01T00:00:00Z`);
  const returnPct = (Number(netWorthHalalas - netDepositedHalalas) / Number(netDepositedHalalas)) * 100;
  const targetNetWorthHalalas = (netDepositedHalalas * BigInt(1000 + GOAL_TARGET_PCT * 10)) / 1000n;

  const remainingTradingDays = countRemainingTradingDays(now, GOAL_YEAR_END);

  let requiredDailyGrowthPct: number | null = null;
  if (remainingTradingDays > 0 && netWorthHalalas > 0n) {
    const ratio = Number(targetNetWorthHalalas) / Number(netWorthHalalas);
    requiredDailyGrowthPct = (Math.pow(ratio, 1 / remainingTradingDays) - 1) * 100;
  }

  const totalTradingDaysInYear = countRemainingTradingDays(yearStart, GOAL_YEAR_END);
  const elapsedTradingDays = Math.max(0, totalTradingDaysInYear - remainingTradingDays);
  const expectedPctByNow = totalTradingDaysInYear > 0 ? GOAL_TARGET_PCT * (elapsedTradingDays / totalTradingDaysInYear) : 0;

  const aheadOrBehind: GoalProgress["aheadOrBehind"] =
    returnPct > expectedPctByNow + 0.5 ? "ahead" : returnPct < expectedPctByNow - 0.5 ? "behind" : "on-track";

  return {
    netDepositedHalalas,
    netWorthHalalas,
    returnPct,
    targetPct: GOAL_TARGET_PCT,
    targetNetWorthHalalas,
    remainingTradingDays,
    requiredDailyGrowthPct,
    expectedPctByNow,
    aheadOrBehind,
  };
}
