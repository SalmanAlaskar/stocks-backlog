import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatSar } from "@/lib/money";
import IpoSubscribeForm from "@/components/IpoSubscribeForm";
import { simulateAllocationAction } from "./actions";

export default async function IpoPage() {
  const user = await requireVerifiedUser();
  const ipos = await db.ipo.findMany({ orderBy: { subscriptionStart: "desc" } });
  const mySubs = await db.ipoSubscription.findMany({ where: { userId: user.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">IPO Subscriptions</h1>
        <p className="text-sm text-zinc-400">Subscribe to new TASI/Nomu listings using your Derayah Wallet balance.</p>
      </div>

      {ipos.length === 0 ? (
        <p className="text-sm text-zinc-400">No IPOs available right now.</p>
      ) : (
        ipos.map((ipo) => {
          const mySub = mySubs.find((s) => s.ipoId === ipo.id);
          const now = new Date();
          const isOpen = ipo.status === "OPEN" && now >= ipo.subscriptionStart && now <= ipo.subscriptionEnd;
          return (
            <div key={ipo.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-medium">{ipo.companyNameEn}</h2>
                  <p className="text-xs text-zinc-500" dir="rtl">{ipo.companyNameAr}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${ipo.status === "ALLOCATED" ? "bg-emerald-500/10 text-emerald-400" : isOpen ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>
                  {ipo.status === "ALLOCATED" ? "Allocated" : isOpen ? "Open" : "Closed"}
                </span>
              </div>
              <dl className="text-sm grid grid-cols-2 gap-2">
                <div><dt className="text-zinc-400 inline">Offer price: </dt><dd className="inline">{formatSar(ipo.offerPriceHalalas)}</dd></div>
                <div><dt className="text-zinc-400 inline">Per-investor cap: </dt><dd className="inline">{formatSar(ipo.perInvestorCapHalalas)}</dd></div>
                <div><dt className="text-zinc-400 inline">Opens: </dt><dd className="inline">{ipo.subscriptionStart.toLocaleDateString("en-US")}</dd></div>
                <div><dt className="text-zinc-400 inline">Closes: </dt><dd className="inline">{ipo.subscriptionEnd.toLocaleDateString("en-US")}</dd></div>
              </dl>

              {mySub ? (
                <div className="text-sm bg-zinc-800/60 rounded p-3">
                  <p>You subscribed with {formatSar(mySub.reservedHalalas)}.</p>
                  {mySub.allocatedHalalas != null ? (
                    <p className="text-emerald-400 mt-1">
                      Allocated {formatSar(mySub.allocatedHalalas)}; {formatSar(mySub.refundedHalalas ?? 0n)} refunded.
                    </p>
                  ) : (
                    <p className="text-zinc-400 mt-1">Awaiting allocation results.</p>
                  )}
                </div>
              ) : isOpen ? (
                <IpoSubscribeForm ipoId={ipo.id} perInvestorCapSar={Number(ipo.perInvestorCapHalalas) / 100} />
              ) : (
                <p className="text-sm text-zinc-400">Subscription window closed.</p>
              )}

              {isOpen && (
                <form action={simulateAllocationAction} className="pt-2 border-t border-zinc-800">
                  <input type="hidden" name="ipoId" value={ipo.id} />
                  <button type="submit" className="text-xs text-zinc-500 hover:text-zinc-200">
                    Demo control: simulate allocation results now
                  </button>
                </form>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
