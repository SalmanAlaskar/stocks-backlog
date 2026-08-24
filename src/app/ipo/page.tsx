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
        <p className="text-sm text-zinc-500">Subscribe to new TASI/Nomu listings using your Derayah Wallet balance.</p>
      </div>

      {ipos.length === 0 ? (
        <p className="text-sm text-zinc-500">No IPOs available right now.</p>
      ) : (
        ipos.map((ipo) => {
          const mySub = mySubs.find((s) => s.ipoId === ipo.id);
          const now = new Date();
          const isOpen = ipo.status === "OPEN" && now >= ipo.subscriptionStart && now <= ipo.subscriptionEnd;
          return (
            <div key={ipo.id} className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-medium">{ipo.companyNameEn}</h2>
                  <p className="text-xs text-zinc-400" dir="rtl">{ipo.companyNameAr}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${ipo.status === "ALLOCATED" ? "bg-emerald-100 text-emerald-700" : isOpen ? "bg-amber-100 text-amber-700" : "bg-zinc-100 text-zinc-500"}`}>
                  {ipo.status === "ALLOCATED" ? "Allocated" : isOpen ? "Open" : "Closed"}
                </span>
              </div>
              <dl className="text-sm grid grid-cols-2 gap-2">
                <div><dt className="text-zinc-500 inline">Offer price: </dt><dd className="inline">{formatSar(ipo.offerPriceHalalas)}</dd></div>
                <div><dt className="text-zinc-500 inline">Per-investor cap: </dt><dd className="inline">{formatSar(ipo.perInvestorCapHalalas)}</dd></div>
                <div><dt className="text-zinc-500 inline">Opens: </dt><dd className="inline">{ipo.subscriptionStart.toLocaleDateString("en-US")}</dd></div>
                <div><dt className="text-zinc-500 inline">Closes: </dt><dd className="inline">{ipo.subscriptionEnd.toLocaleDateString("en-US")}</dd></div>
              </dl>

              {mySub ? (
                <div className="text-sm bg-zinc-50 rounded p-3">
                  <p>You subscribed with {formatSar(mySub.reservedHalalas)}.</p>
                  {mySub.allocatedHalalas != null ? (
                    <p className="text-emerald-700 mt-1">
                      Allocated {formatSar(mySub.allocatedHalalas)}; {formatSar(mySub.refundedHalalas ?? 0n)} refunded.
                    </p>
                  ) : (
                    <p className="text-zinc-500 mt-1">Awaiting allocation results.</p>
                  )}
                </div>
              ) : isOpen ? (
                <IpoSubscribeForm ipoId={ipo.id} perInvestorCapSar={Number(ipo.perInvestorCapHalalas) / 100} />
              ) : (
                <p className="text-sm text-zinc-500">Subscription window closed.</p>
              )}

              {isOpen && (
                <form action={simulateAllocationAction} className="pt-2 border-t border-zinc-100">
                  <input type="hidden" name="ipoId" value={ipo.id} />
                  <button type="submit" className="text-xs text-zinc-400 hover:text-zinc-700">
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
