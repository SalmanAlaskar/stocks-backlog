"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitOrderAction } from "@/app/trade/[ticker]/actions";

interface Props {
  ticker: string;
  nameEn: string;
  currentPriceSar: number;
  priceLimitLowerSar: number;
  priceLimitUpperSar: number;
  marketOpen: boolean;
  availableCashSar: number;
  sharesHeld: number;
  defaultSide: "BUY" | "SELL";
}

type OrderType = "MARKET" | "LIMIT" | "STOP";
type Validity = "DAY" | "GOOD_TILL_DATE";

export default function TradeForm(props: Props) {
  const router = useRouter();
  const [side, setSide] = useState<"BUY" | "SELL">(props.defaultSide);
  const [type, setType] = useState<OrderType>("MARKET");
  const [quantity, setQuantity] = useState(10);
  const [limitPrice, setLimitPrice] = useState(props.currentPriceSar.toFixed(2));
  const [stopPrice, setStopPrice] = useState(props.currentPriceSar.toFixed(2));
  const [validity, setValidity] = useState<Validity>("DAY");
  const [goodTillDate, setGoodTillDate] = useState("");
  const [step, setStep] = useState<"form" | "review">("form");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const referencePrice = type === "LIMIT" ? Number(limitPrice) : type === "STOP" ? Number(stopPrice) : props.currentPriceSar;
  const estimatedTotal = referencePrice * quantity;

  const validationError = useMemo(() => {
    if (!quantity || quantity <= 0) return "Enter a quantity greater than zero.";
    if (type === "LIMIT" && (!limitPrice || Number(limitPrice) <= 0)) return "Enter a limit price.";
    if (type === "LIMIT" && (Number(limitPrice) < props.priceLimitLowerSar || Number(limitPrice) > props.priceLimitUpperSar)) {
      return `Limit price must be between ${props.priceLimitLowerSar.toFixed(2)} and ${props.priceLimitUpperSar.toFixed(2)} SAR (+/-10% daily limit).`;
    }
    if (type === "STOP" && (!stopPrice || Number(stopPrice) <= 0)) return "Enter a stop trigger price.";
    if (validity === "GOOD_TILL_DATE" && !goodTillDate) return "Choose a Good-Till-Date expiry.";
    if (side === "BUY" && estimatedTotal > props.availableCashSar) return "Estimated cost exceeds your available Wallet balance.";
    if (side === "SELL" && quantity > props.sharesHeld) return `You only hold ${props.sharesHeld} shares.`;
    if (type === "MARKET" && !props.marketOpen) return "Tadawul is closed. Market orders can only be placed Sun-Thu, 10:00-15:00 AST.";
    return null;
  }, [quantity, type, limitPrice, stopPrice, validity, goodTillDate, side, estimatedTotal, props]);

  function handleReview() {
    setError(validationError);
    if (!validationError) setStep("review");
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await submitOrderAction({
        ticker: props.ticker,
        side,
        type,
        quantity,
        limitPriceSar: type === "LIMIT" ? Number(limitPrice) : undefined,
        stopPriceSar: type === "STOP" ? Number(stopPrice) : undefined,
        validity,
        goodTillDate: validity === "GOOD_TILL_DATE" ? goodTillDate : undefined,
      });
      if (result.error) {
        setError(result.error);
        setStep("form");
      } else {
        setSuccess(result.success ?? "Order submitted.");
        router.refresh();
      }
    });
  }

  if (success) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p className="text-emerald-400 text-sm mb-3">{success}</p>
        <a href="/orders" className="text-sm text-emerald-400 hover:underline">View order history &rarr;</a>
      </div>
    );
  }

  if (step === "review") {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="font-medium">Review order</h2>
        <dl className="text-sm space-y-1">
          <Row label="Stock" value={`${props.ticker} - ${props.nameEn}`} />
          <Row label="Side" value={side} />
          <Row label="Order type" value={type} />
          <Row label="Quantity" value={String(quantity)} />
          {type !== "MARKET" && <Row label="Validity" value={validity === "DAY" ? "Day" : `Good-Till-Date (${goodTillDate})`} />}
          {type === "LIMIT" && <Row label="Limit price" value={`${Number(limitPrice).toFixed(2)} SAR`} />}
          {type === "STOP" && <Row label="Stop trigger price" value={`${Number(stopPrice).toFixed(2)} SAR`} />}
          <Row label="Estimated total" value={`${estimatedTotal.toFixed(2)} SAR`} />
        </dl>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={handleConfirm} disabled={pending} className="rounded bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-500 disabled:opacity-50">
            {pending ? "Submitting..." : "Confirm order"}
          </button>
          <button onClick={() => setStep("form")} disabled={pending} className="rounded border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setSide("BUY")} className={`flex-1 rounded py-2 text-sm font-medium ${side === "BUY" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300"}`}>Buy</button>
        <button onClick={() => setSide("SELL")} className={`flex-1 rounded py-2 text-sm font-medium ${side === "SELL" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"}`}>Sell</button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Order type</label>
        <select value={type} onChange={(e) => setType(e.target.value as OrderType)} className="w-full rounded border border-zinc-700 px-3 py-2 text-sm">
          <option value="MARKET">Market</option>
          <option value="LIMIT">Limit</option>
          <option value="STOP">Stop</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Quantity</label>
        <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full rounded border border-zinc-700 px-3 py-2 text-sm" />
      </div>

      {type === "LIMIT" && (
        <div>
          <label className="block text-sm font-medium mb-1">Limit price (SAR)</label>
          <input type="number" step="0.01" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} className="w-full rounded border border-zinc-700 px-3 py-2 text-sm" />
          <p className="text-xs text-zinc-500 mt-1">Must be within {props.priceLimitLowerSar.toFixed(2)} - {props.priceLimitUpperSar.toFixed(2)} SAR (+/-10% daily limit).</p>
        </div>
      )}

      {type === "STOP" && (
        <div>
          <label className="block text-sm font-medium mb-1">Stop trigger price (SAR)</label>
          <input type="number" step="0.01" value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} className="w-full rounded border border-zinc-700 px-3 py-2 text-sm" />
        </div>
      )}

      {type !== "MARKET" && (
        <div>
          <label className="block text-sm font-medium mb-1">Validity</label>
          <select value={validity} onChange={(e) => setValidity(e.target.value as Validity)} className="w-full rounded border border-zinc-700 px-3 py-2 text-sm">
            <option value="DAY">Day</option>
            <option value="GOOD_TILL_DATE">Good-Till-Date</option>
          </select>
          {validity === "GOOD_TILL_DATE" && (
            <input type="date" value={goodTillDate} onChange={(e) => setGoodTillDate(e.target.value)} className="w-full mt-2 rounded border border-zinc-700 px-3 py-2 text-sm" />
          )}
        </div>
      )}

      <div className="text-sm text-zinc-400">Estimated total: <span className="text-zinc-50 font-medium">{estimatedTotal.toFixed(2)} SAR</span></div>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <button onClick={handleReview} className="w-full rounded bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-500">
        Review order
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-zinc-400">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
