import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <h1 className="text-3xl font-semibold text-zinc-900 mb-3">Trade Tadawul (TASI) stocks</h1>
      <p className="text-zinc-500 mb-8">
        A prototype brokerage app styled after the Derayah Wallet — sign up, fund your wallet, and trade
        TASI-listed stocks with realistic trading-hour, settlement, and Shariah-compliance rules.
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/signup" className="rounded bg-emerald-700 text-white px-5 py-2.5 text-sm font-medium hover:bg-emerald-800">
          Open an account
        </Link>
        <Link href="/login" className="rounded border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100">
          Log in
        </Link>
      </div>
    </div>
  );
}
