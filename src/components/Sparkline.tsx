import type { Candle } from "@/lib/market";

export default function Sparkline({ candles, width = 600, height = 160 }: { candles: Candle[]; width?: number; height?: number }) {
  if (candles.length < 2) return null;
  const prices = candles.map((c) => Number(c.priceHalalas));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pad = 8;

  const points = candles.map((c, i) => {
    const x = pad + (i / (candles.length - 1)) * (width - pad * 2);
    const y = height - pad - ((Number(c.priceHalalas) - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const up = prices[prices.length - 1] >= prices[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
      <polyline points={points.join(" ")} fill="none" stroke={up ? "#047857" : "#dc2626"} strokeWidth={2} />
    </svg>
  );
}
