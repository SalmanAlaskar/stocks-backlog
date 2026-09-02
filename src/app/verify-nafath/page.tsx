import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { approveNafathAction } from "./actions";

export default async function VerifyNafathPage() {
  const user = await requireUser();
  if (user.nafathVerifiedAt) redirect("/kyc");

  return (
    <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
      <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-2xl">
        ID
      </div>
      <h1 className="text-xl font-semibold mb-2">Verify your identity via Nafath</h1>
      <p className="text-sm text-zinc-400 mb-6">
        A verification request has been sent to your Nafath app. Open Nafath on your phone and approve the
        request to continue opening your account.
      </p>
      <div className="rounded border border-dashed border-zinc-700 bg-zinc-800/60 p-4 text-xs text-zinc-400 mb-6">
        Demo mode: real Nafath integration requires government API access. Click below to simulate approval.
      </div>
      <form action={approveNafathAction}>
        <button type="submit" className="w-full rounded bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-500">
          Simulate Nafath approval
        </button>
      </form>
    </div>
  );
}
