import Link from "next/link";
import { requireVerifiedUser } from "@/lib/auth";
import { getAppConfig } from "@/lib/config";
import { isMarketOpen } from "@/lib/market";
import { db } from "@/lib/db";
import { toggleForceMarketOpenAction, updateNotificationPrefsAction } from "./actions";
import TwoFactorSettings from "@/components/TwoFactorSettings";

export default async function SettingsPage() {
  const user = await requireVerifiedUser();
  const [config, prefs] = await Promise.all([
    getAppConfig(),
    db.notificationPreference.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id } }),
  ]);
  const realMarketOpen = isMarketOpen(new Date(), false);

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-zinc-500">{user.fullName} &middot; {user.mobile}</p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="font-medium mb-1">Two-factor authentication</h2>
        <p className="text-sm text-zinc-500 mb-3">Require a code at login in addition to your password.</p>
        <TwoFactorSettings enabled={user.twoFactorEnabled} pendingCode={user.twoFactorSecret} />
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="font-medium mb-1">Notification preferences</h2>
        <p className="text-sm text-zinc-500 mb-3">Push/SMS delivery is simulated as in-app <Link href="/notifications" className="text-emerald-700">notifications</Link> in this demo.</p>
        <form action={updateNotificationPrefsAction} className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="priceAlerts" defaultChecked={prefs.priceAlerts} className="h-4 w-4" /> Price alerts
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="orderFills" defaultChecked={prefs.orderFills} className="h-4 w-4" /> Order fills
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="ipoResults" defaultChecked={prefs.ipoResults} className="h-4 w-4" /> IPO subscription results
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="news" defaultChecked={prefs.news} className="h-4 w-4" /> News
          </label>
          <button type="submit" className="rounded bg-emerald-700 text-white px-3 py-1.5 text-sm hover:bg-emerald-800">Save preferences</button>
        </form>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="font-medium mb-1">Market hours (demo control)</h2>
        <p className="text-sm text-zinc-500 mb-3">
          Tadawul is actually {realMarketOpen ? "open" : "closed"} right now (Sun-Thu, 10:00-15:00 AST). Force it
          open here to test trading outside real hours.
        </p>
        <form action={toggleForceMarketOpenAction} className="flex items-center gap-2">
          <input type="checkbox" id="forceMarketOpen" name="forceMarketOpen" defaultChecked={config.forceMarketOpen} className="h-4 w-4" />
          <label htmlFor="forceMarketOpen" className="text-sm">Force market open for testing</label>
          <button type="submit" className="ml-auto rounded bg-emerald-700 text-white px-3 py-1.5 text-sm hover:bg-emerald-800">Save</button>
        </form>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="font-medium mb-1">Account</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between"><dt className="text-zinc-500">National ID/Iqama</dt><dd>{user.nationalId}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">KYC status</dt><dd>{user.kycStatus}</dd></div>
          <div className="flex justify-between"><dt className="text-zinc-500">Risk profile</dt><dd>{user.riskProfile ?? "-"}</dd></div>
        </dl>
        <Link href="/statements" className="text-sm text-emerald-700 mt-3 inline-block">Statements & Zakat certificate &rarr;</Link>
      </div>
    </div>
  );
}
