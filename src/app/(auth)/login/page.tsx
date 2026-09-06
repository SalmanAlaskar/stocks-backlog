import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;
  return <LoginForm justReset={reset === "1"} />;
}
