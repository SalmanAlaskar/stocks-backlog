export function halalasToSar(halalas: bigint): number {
  return Number(halalas) / 100;
}

export function sarToHalalas(sar: number): bigint {
  return BigInt(Math.round(sar * 100));
}

export function formatSar(halalas: bigint): string {
  const sar = halalasToSar(halalas);
  return `${sar.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
