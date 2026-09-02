import type { NewsItem, Stock } from "@/generated/prisma/client";
import type { Holding } from "@/lib/portfolio";
import type { AccountBucket } from "@/lib/netWorth";
import { formatSar, formatPercent } from "@/lib/money";

/**
 * Lightweight, rule-based text generation — NOT a call to an LLM. Labelled as such in the UI.
 * A real deployment would swap these for actual model calls (e.g. Claude) over the same inputs.
 */

export function summarizeNews(stock: Stock, items: NewsItem[]): string {
  if (items.length === 0) return `No recent news found for ${stock.nameEn}.`;
  const headlines = items.map((i) => i.headline);
  const sources = [...new Set(items.map((i) => i.source))].join(", ");
  return `${stock.nameEn} (${stock.ticker}) has ${items.length} recent update${items.length > 1 ? "s" : ""} from ${sources}: ${headlines
    .map((h) => h.replace(/\.$/, ""))
    .join("; ")}.`;
}

export interface RiskInsight {
  severity: "info" | "warning";
  message: string;
}

export function analyzePortfolioRisk(holdings: Holding[]): RiskInsight[] {
  const insights: RiskInsight[] = [];
  if (holdings.length === 0) return insights;

  const marketValue = holdings.reduce((s, h) => s + h.marketValueHalalas, 0n);
  if (marketValue === 0n) return insights;

  const bySector = new Map<string, bigint>();
  for (const h of holdings) bySector.set(h.stock.sector, (bySector.get(h.stock.sector) ?? 0n) + h.marketValueHalalas);
  for (const [sector, value] of bySector) {
    const pct = (Number(value) / Number(marketValue)) * 100;
    if (pct >= 40) {
      insights.push({ severity: "warning", message: `${pct.toFixed(0)}% of your portfolio is concentrated in ${sector}. Consider diversifying across more sectors.` });
    }
  }

  for (const h of holdings) {
    const pct = (Number(h.marketValueHalalas) / Number(marketValue)) * 100;
    if (pct >= 25) {
      insights.push({ severity: "warning", message: `${h.stock.ticker} (${h.stock.nameEn}) is ${pct.toFixed(0)}% of your portfolio — a single-stock concentration risk.` });
    }
  }

  const nonCompliantValue = holdings.filter((h) => !h.stock.shariahCompliant).reduce((s, h) => s + h.marketValueHalalas, 0n);
  if (nonCompliantValue > 0n) {
    const pct = (Number(nonCompliantValue) / Number(marketValue)) * 100;
    insights.push({ severity: "info", message: `${pct.toFixed(0)}% of your portfolio is in non-Shariah-compliant holdings.` });
  }

  if (insights.length === 0) {
    insights.push({ severity: "info", message: "Your portfolio looks reasonably diversified across sectors and positions." });
  }

  return insights;
}

/** Cross-account insights across Wallet/Stocks/Abian/Al Rajhi — descriptive only, not advice. */
export function analyzeNetWorth(buckets: AccountBucket[], totalAssetsHalalas: bigint): RiskInsight[] {
  const insights: RiskInsight[] = [];
  const activeBuckets = buckets.filter((b) => b.exists && b.valueHalalas > 0n);
  if (totalAssetsHalalas === 0n) return insights;

  for (const b of activeBuckets) {
    const pct = (Number(b.valueHalalas) / Number(totalAssetsHalalas)) * 100;
    if (pct >= 60 && b.key !== "wallet") {
      insights.push({ severity: "warning", message: `${pct.toFixed(0)}% of your total assets sit in ${b.label}. Your overall net worth depends heavily on that one account.` });
    }
  }

  const losingAccounts = activeBuckets.filter((b) => b.gainHalalas != null && b.gainHalalas < 0n);
  if (losingAccounts.length >= 2) {
    insights.push({ severity: "info", message: `${losingAccounts.length} of your ${activeBuckets.length} accounts are currently showing a loss (${losingAccounts.map((b) => b.label).join(", ")}).` });
  }

  const investedBuckets = activeBuckets.filter((b) => b.key !== "wallet");
  if (investedBuckets.length >= 3) {
    insights.push({ severity: "info", message: `Your investments are spread across ${investedBuckets.length} different account types (${investedBuckets.map((b) => b.label).join(", ")}), which diversifies which products your returns depend on.` });
  }

  if (insights.length === 0) {
    insights.push({ severity: "info", message: "Your assets look reasonably distributed across your connected accounts." });
  }

  return insights;
}

export interface AssistantContext {
  fullName: string;
  walletBalanceHalalas: bigint;
  walletAvailableHalalas: bigint;
  holdings: Holding[];
  netWorthHalalas: bigint;
  unrealizedPnlHalalas: bigint;
}

/** Simple keyword-matched Q&A over the user's own data — not a live model call. */
export function answerAssistantQuestion(question: string, ctx: AssistantContext): string {
  const q = question.toLowerCase();

  const findStock = () => ctx.holdings.find((h) => q.includes(h.stock.ticker.toLowerCase()) || q.includes(h.stock.nameEn.toLowerCase()));

  if (/(how many shares|shares of|hold)/.test(q)) {
    const h = findStock();
    if (h) return `You hold ${h.quantity} shares of ${h.stock.nameEn} (${h.stock.ticker}), worth ${formatSar(h.marketValueHalalas)} at the current price.`;
  }

  if (/(gain|loss|up|down|performance)/.test(q)) {
    const h = findStock();
    if (h) {
      const pct = h.costBasisHalalas > 0n ? (Number(h.unrealizedPnlHalalas) / Number(h.costBasisHalalas)) * 100 : 0;
      return `${h.stock.nameEn} is ${h.unrealizedPnlHalalas < 0n ? "down" : "up"} ${formatSar(h.unrealizedPnlHalalas < 0n ? -h.unrealizedPnlHalalas : h.unrealizedPnlHalalas)} (${formatPercent(pct)}) since your average cost of ${formatSar(h.avgCostHalalas)}.`;
    }
    const pct = ctx.holdings.length ? (Number(ctx.unrealizedPnlHalalas) / Number(ctx.holdings.reduce((s, h) => s + h.costBasisHalalas, 0n) || 1n)) * 100 : 0;
    return `Your overall unrealized gain/loss is ${formatSar(ctx.unrealizedPnlHalalas)} (${formatPercent(pct)}).`;
  }

  if (/(wallet|cash|balance|available)/.test(q)) {
    return `Your Wallet balance is ${formatSar(ctx.walletBalanceHalalas)}, with ${formatSar(ctx.walletAvailableHalalas)} available to trade (the rest is reserved for pending orders).`;
  }

  if (/(worth|net worth|total|portfolio value)/.test(q)) {
    return `Your total net worth (Wallet cash + holdings) is ${formatSar(ctx.netWorthHalalas)}.`;
  }

  if (/(biggest|largest|most)/.test(q) && ctx.holdings.length > 0) {
    const biggest = [...ctx.holdings].sort((a, b) => Number(b.marketValueHalalas - a.marketValueHalalas))[0];
    return `Your largest position is ${biggest.stock.nameEn} (${biggest.stock.ticker}) at ${formatSar(biggest.marketValueHalalas)}.`;
  }

  return "I can answer questions about your holdings, gain/loss, Wallet balance, and net worth — try asking \"how much am I up this month?\" or \"how many shares of SABIC do I hold?\". This is a simple rule-based assistant, not a live AI model, and it can't give personalized financial advice.";
}
