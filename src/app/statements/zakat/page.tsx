import { requireVerifiedUser } from "@/lib/auth";
import { getHoldings } from "@/lib/portfolio";
import { db } from "@/lib/db";
import { formatSar } from "@/lib/money";
import PrintButton from "@/components/PrintButton";

export default async function ZakatCertificatePage() {
  const user = await requireVerifiedUser();
  const [holdings, wallet] = await Promise.all([
    getHoldings(user.id),
    db.wallet.findUniqueOrThrow({ where: { userId: user.id } }),
  ]);

  const marketValue = holdings.reduce((s, h) => s + h.marketValueHalalas, 0n);
  const zakatBaseHalalas = marketValue + wallet.balanceHalalas;
  const zakatDueHalalas = (zakatBaseHalalas * 25n) / 1000n; // illustrative 2.5%
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="print:hidden">
        <PrintButton />
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-8 print:border-0 print:shadow-none">
        <h1 className="text-lg font-semibold text-center mb-1">Zakat Certificate</h1>
        <p className="text-center text-xs text-zinc-400 mb-6">Derayah Demo &middot; Illustrative, not a religious ruling</p>

        <dl className="text-sm space-y-3">
          <div className="flex justify-between"><dt className="text-zinc-500">Account holder</dt><dd>{user.fullName}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">National ID/Iqama</dt><dd>{user.nationalId}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">As of</dt><dd>{today}</dd></div>
          <div className="flex justify-between border-t border-zinc-100 pt-3"><dt className="text-zinc-500">Wallet cash balance</dt><dd>{formatSar(wallet.balanceHalalas)}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">Holdings market value</dt><dd>{formatSar(marketValue)}</dd></div>
          <div className="flex justify-between font-medium border-t border-zinc-100 pt-3"><dt>Zakat base</dt><dd>{formatSar(zakatBaseHalalas)}</dd></div>
          <div className="flex justify-between font-medium text-emerald-700"><dt>Estimated Zakat due (2.5%)</dt><dd>{formatSar(zakatDueHalalas)}</dd></div>
        </dl>

        <p className="text-xs text-zinc-400 mt-6">
          This is an automated estimate for informational purposes only, using a standard 2.5% rate on cash and
          holdings. It is not a fatwa or substitute for guidance from a qualified Zakat/Shariah authority.
        </p>
      </div>
    </div>
  );
}
