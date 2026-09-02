import { db } from "@/lib/db";
import { getHoldings } from "@/lib/portfolio";

export interface AccountBucket {
  key: "wallet" | "stocks" | "abian" | "alrajhi";
  label: string;
  href: string;
  valueHalalas: bigint;
  gainHalalas: bigint | null;
  gainLabel: string;
  exists: boolean;
}

export interface NetWorthSummary {
  totalAssetsHalalas: bigint;
  totalGainHalalas: bigint;
  buckets: AccountBucket[];
}

export async function getNetWorthSummary(userId: string): Promise<NetWorthSummary> {
  const [wallet, holdings, abian, alRajhi] = await Promise.all([
    db.wallet.findUniqueOrThrow({ where: { userId } }),
    getHoldings(userId),
    db.abianAccount.findUnique({ where: { userId } }),
    db.rajhiFundAccount.findUnique({ where: { userId } }),
  ]);

  const stockMarketValue = holdings.reduce((s, h) => s + h.marketValueHalalas, 0n);
  const stockCostBasis = holdings.reduce((s, h) => s + h.costBasisHalalas, 0n);
  const stockGain = stockMarketValue - stockCostBasis;

  const buckets: AccountBucket[] = [
    {
      key: "wallet",
      label: "Wallet cash",
      href: "/wallet",
      valueHalalas: wallet.balanceHalalas,
      gainHalalas: null,
      gainLabel: "Cash, not invested",
      exists: true,
    },
    {
      key: "stocks",
      label: "Stock portfolio",
      href: "/portfolio",
      valueHalalas: stockMarketValue,
      gainHalalas: stockGain,
      gainLabel: "Unrealized, vs. your cost",
      exists: holdings.length > 0,
    },
    {
      key: "abian",
      label: "Abian",
      href: "/abian",
      valueHalalas: abian?.marketValueHalalas ?? 0n,
      gainHalalas: abian?.currentReturnHalalas ?? null,
      gainLabel: "Current-period return",
      exists: !!abian,
    },
    {
      key: "alrajhi",
      label: "Al Rajhi funds",
      href: "/alrajhi",
      valueHalalas: alRajhi?.totalValueHalalas ?? 0n,
      gainHalalas: alRajhi?.totalGainHalalas ?? null,
      gainLabel: "Total gain since inception",
      exists: !!alRajhi,
    },
  ];

  const totalAssetsHalalas = buckets.reduce((s, b) => s + b.valueHalalas, 0n);
  const totalGainHalalas = buckets.reduce((s, b) => s + (b.gainHalalas ?? 0n), 0n);

  return { totalAssetsHalalas, totalGainHalalas, buckets };
}
