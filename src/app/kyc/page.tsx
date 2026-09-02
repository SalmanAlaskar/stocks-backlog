import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { submitKycAction, checkKycStatusAction } from "./actions";

export default async function KycPage() {
  const user = await requireUser();
  if (!user.nafathVerifiedAt) redirect("/verify-nafath");
  if (user.kycStatus === "APPROVED") redirect("/dashboard");

  if (user.kycStatus === "PENDING") {
    return (
      <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">KYC under review</h1>
        <p className="text-sm text-zinc-400 mb-6">
          Your CMA-required KYC details are being reviewed. This usually only takes a moment in this demo.
        </p>
        <form action={checkKycStatusAction}>
          <button type="submit" className="w-full rounded bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-500">
            Check status
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h1 className="text-xl font-semibold mb-1">Complete your KYC</h1>
      <p className="text-sm text-zinc-400 mb-6">
        Required by the Capital Market Authority (CMA) before you can trade on Tadawul.
      </p>
      <form action={submitKycAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="riskProfile">Investor risk profile</label>
          <select id="riskProfile" name="riskProfile" required className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="CONSERVATIVE">Conservative</option>
            <option value="MODERATE">Moderate</option>
            <option value="AGGRESSIVE">Aggressive</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="sourceOfFunds">Source of funds</label>
          <select id="sourceOfFunds" name="sourceOfFunds" required className="bg-zinc-900 text-zinc-100 placeholder:text-zinc-400 w-full rounded border border-zinc-700 px-3 py-2 text-sm">
            <option value="">Select...</option>
            <option value="SALARY">Salary / employment income</option>
            <option value="BUSINESS">Business income</option>
            <option value="INHERITANCE">Inheritance</option>
            <option value="SAVINGS">Personal savings</option>
          </select>
        </div>
        <button type="submit" className="w-full rounded bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-500">
          Submit for review
        </button>
      </form>
    </div>
  );
}
