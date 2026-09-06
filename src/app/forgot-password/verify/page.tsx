import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ForgotPasswordVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ mobile?: string }>;
}) {
  const { mobile } = await searchParams;
  if (!mobile) redirect("/forgot-password");

  const user = await db.user.findUnique({ where: { mobile } });
  if (!user || !user.passwordResetCode) redirect("/forgot-password");

  return (
    <div className="max-w-sm mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h1 className="text-xl font-semibold mb-2">Reset your password</h1>
      <p className="text-sm text-zinc-400 mb-4">Enter the code sent to your mobile, then choose a new password.</p>
      <div className="rounded border border-dashed border-zinc-700 bg-zinc-800/60 p-3 text-xs text-zinc-400 mb-4">
        Demo mode: real SMS delivery requires a telecom integration. Your code is{" "}
        <span className="font-mono font-semibold text-zinc-100">{user.passwordResetCode}</span>.
      </div>
      <ResetPasswordForm mobile={mobile} />
    </div>
  );
}
