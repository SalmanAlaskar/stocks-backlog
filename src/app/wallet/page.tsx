import { requireVerifiedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatSar } from "@/lib/money";
import { DepositForm, WithdrawForm } from "@/components/WalletForms";

export default async function WalletPage() {
  const user = await requireVerifiedUser();
  const wallet = await db.wallet.findUniqueOrThrow({
    where: { userId: user.id },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  const available = wallet.balanceHalalas - wallet.reservedHalalas;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Derayah Wallet</h1>
        <p className="text-sm text-zinc-500">Held with Derayah&apos;s partner bank (ANB). Fund via SARIE/IBAN transfer or mada.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs text-zinc-500">Available balance</div>
          <div className="text-2xl font-semibold">{formatSar(available)}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs text-zinc-500">Total balance</div>
          <div className="text-2xl font-semibold">{formatSar(wallet.balanceHalalas)}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs text-zinc-500">Reserved (pending orders)</div>
          <div className="text-2xl font-semibold">{formatSar(wallet.reservedHalalas)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <h2 className="font-medium mb-3">Fund Wallet</h2>
          <DepositForm />
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <h2 className="font-medium mb-3">Withdraw</h2>
          <WithdrawForm />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="font-medium mb-3">Transaction history</h2>
        {wallet.transactions.length === 0 ? (
          <p className="text-sm text-zinc-500">No transactions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500 border-b border-zinc-100">
                <th className="py-2 font-normal">Date</th>
                <th className="py-2 font-normal">Type</th>
                <th className="py-2 font-normal">Description</th>
                <th className="py-2 font-normal text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {wallet.transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-zinc-50">
                  <td className="py-2 text-zinc-500">{tx.createdAt.toLocaleString("en-US")}</td>
                  <td className="py-2">{tx.type.replace("_", " ")}</td>
                  <td className="py-2">{tx.description}</td>
                  <td className={`py-2 text-right ${tx.amountHalalas < 0n ? "text-red-600" : "text-emerald-700"}`}>
                    {tx.amountHalalas < 0n ? "-" : "+"}
                    {formatSar(tx.amountHalalas < 0n ? -tx.amountHalalas : tx.amountHalalas)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
