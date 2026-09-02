export default function DataSourceNote({ isReal }: { isReal: boolean }) {
  return isReal ? (
    <p className="text-xs text-zinc-500">
      Real Tadawul-listed price data via Yahoo Finance — delayed and unofficial, not a licensed real-time Tadawul feed.
    </p>
  ) : (
    <p className="text-xs text-amber-500">
      Real-data sync unavailable right now — this price is simulated, not a live quote.
    </p>
  );
}
