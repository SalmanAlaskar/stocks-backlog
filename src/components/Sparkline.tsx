import type { Candle } from "@/lib/market";

function formatAxisDate(t: number) {
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Sparkline({ candles, width = 640, height = 220 }: { candles: Candle[]; width?: number; height?: number }) {
  if (candles.length < 2) return null;

  const prices = candles.map((c) => Number(c.priceHalalas));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const marginLeft = 56;
  const marginRight = 12;
  const marginTop = 12;
  const marginBottom = 24;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  const lastIndex = candles.length - 1;
  const xFor = (i: number) => marginLeft + (i / lastIndex) * plotWidth;
  const yFor = (price: number) => marginTop + plotHeight - ((price - min) / range) * plotHeight;

  const points = candles.map((c, i) => `${xFor(i).toFixed(1)},${yFor(Number(c.priceHalalas)).toFixed(1)}`);
  const up = prices[lastIndex] >= prices[0];
  const lineColor = up ? "#047857" : "#dc2626";

  const yTicks = [max, (max + min) / 2, min];
  const xTickIndices = candles.length > 2 ? [0, Math.floor(lastIndex / 2), lastIndex] : [0, lastIndex];

  const lastX = xFor(lastIndex);
  const lastY = yFor(prices[lastIndex]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {yTicks.map((price, i) => {
        const y = yFor(price);
        return (
          <g key={i}>
            <line x1={marginLeft} y1={y} x2={width - marginRight} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={marginLeft - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#9ca3af">
              {(price / 100).toFixed(2)}
            </text>
          </g>
        );
      })}

      {xTickIndices.map((idx) => (
        <text
          key={idx}
          x={xFor(idx)}
          y={height - 6}
          textAnchor={idx === lastIndex ? "end" : idx === 0 ? "start" : "middle"}
          fontSize={11}
          fontWeight={idx === lastIndex ? 600 : 400}
          fill={idx === lastIndex ? lineColor : "#9ca3af"}
        >
          {idx === lastIndex ? "Today" : formatAxisDate(candles[idx].t)}
        </text>
      ))}

      <line x1={lastX} y1={marginTop} x2={lastX} y2={marginTop + plotHeight} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3 3" />

      <polyline points={points.join(" ")} fill="none" stroke={lineColor} strokeWidth={2} />

      <circle cx={lastX} cy={lastY} r={5} fill="white" stroke={lineColor} strokeWidth={2} />
      <circle cx={lastX} cy={lastY} r={2} fill={lineColor} />
    </svg>
  );
}
