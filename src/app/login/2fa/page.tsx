import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getPendingTwoFactorUser } from "@/lib/auth";
import TwoFactorForm from "@/components/TwoFactorForm";

export default async function LoginTwoFactorPage() {
  const user = await getPendingTwoFactorUser();
  if (!user) redirect("/login");

  const store = await cookies();
  const sessionId = store.get("session_id")?.value;
  const session = sessionId ? await db.session.findUnique({ where: { id: sessionId } }) : null;

  return (
    <div className="max-w-sm mx-auto bg-white border border-zinc-200 rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-2">Two-factor verification</h1>
      <p className="text-sm text-zinc-500 mb-4">Enter the 6-digit code sent to your mobile, or a backup code.</p>
      <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500 mb-4">
        Demo mode: real SMS delivery requires a telecom integration. Your code is <span className="font-mono font-semibold text-zinc-800">{session?.twoFactorCode}</span>.
      </div>
      <TwoFactorForm />
    </div>
  );
}
