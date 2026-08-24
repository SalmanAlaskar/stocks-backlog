"use server";

import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHoldings } from "@/lib/portfolio";
import { answerAssistantQuestion } from "@/lib/ai";

export async function askAssistantAction(_prev: unknown, formData: FormData): Promise<{ question: string; answer: string }> {
  const user = await requireVerifiedUser();
  const question = String(formData.get("question") ?? "").trim();
  if (!question) return { question: "", answer: "Ask me something about your portfolio or Wallet." };

  const [wallet, holdings] = await Promise.all([
    db.wallet.findUniqueOrThrow({ where: { userId: user.id } }),
    getHoldings(user.id),
  ]);
  const marketValue = holdings.reduce((s, h) => s + h.marketValueHalalas, 0n);
  const costBasis = holdings.reduce((s, h) => s + h.costBasisHalalas, 0n);

  const answer = answerAssistantQuestion(question, {
    fullName: user.fullName,
    walletBalanceHalalas: wallet.balanceHalalas,
    walletAvailableHalalas: wallet.balanceHalalas - wallet.reservedHalalas,
    holdings,
    netWorthHalalas: wallet.balanceHalalas + marketValue,
    unrealizedPnlHalalas: marketValue - costBasis,
  });

  return { question, answer };
}
