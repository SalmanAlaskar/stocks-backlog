import { notFound } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentPriceHalalas, priceLimits, isMarketOpen } from "@/lib/market";
import { getAppConfig } from "@/lib/config";
import { getSharesHeld } from "@/lib/portfolio";
import { halalasToSar } from "@/lib/money";
import TradeForm from "@/components/TradeForm";

export default async function TradePage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ side?: string }>;
}) {
  const user = await requireVerifiedUser();
  const { ticker } = await params;
  const { side } = await searchParams;

  const [stock, wallet, config] = await Promise.all([
    db.stock.findUnique({ where: { ticker } }),
    db.wallet.findUniqueOrThrow({ where: { userId: user.id } }),
    getAppConfig(),
  ]);
  if (!stock) notFound();

  const now = new Date();
  const price = currentPriceHalalas(stock.ticker, stock.previousCloseHalalas, now);
  const { lower, upper } = priceLimits(stock.previousCloseHalalas);
  const sharesHeld = await getSharesHeld(user.id, stock.id);
  const available = wallet.balanceHalalas - wallet.reservedHalalas;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Trade {stock.ticker} &middot; {stock.nameEn}</h1>
        <p className="text-sm text-zinc-500">Current price: {halalasToSar(price).toFixed(2)} SAR</p>
      </div>
      <TradeForm
        ticker={stock.ticker}
        nameEn={stock.nameEn}
        currentPriceSar={halalasToSar(price)}
        priceLimitLowerSar={halalasToSar(lower)}
        priceLimitUpperSar={halalasToSar(upper)}
        marketOpen={isMarketOpen(now, config.forceMarketOpen)}
        availableCashSar={halalasToSar(available)}
        sharesHeld={sharesHeld}
        defaultSide={side === "SELL" ? "SELL" : "BUY"}
      />
    </div>
  );
}
