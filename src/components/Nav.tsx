import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wallet", label: "Wallet" },
  { href: "/market", label: "Market" },
  { href: "/watchlists", label: "Watchlists" },
  { href: "/orders", label: "Orders" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/abian", label: "Abian" },
  { href: "/alrajhi", label: "Al Rajhi" },
  { href: "/ipo", label: "IPO" },
  { href: "/assistant", label: "Assistant" },
  { href: "/settings", label: "Settings" },
];

export default function Nav({ user, unreadCount }: { user: { fullName: string } | null; unreadCount?: number }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href={user ? "/dashboard" : "/"} className="font-semibold text-emerald-700 shrink-0">
          Derayah Demo
        </Link>
        {user ? (
          <>
            <nav className="hidden lg:flex items-center gap-3 text-sm text-zinc-600 overflow-x-auto">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-emerald-700 whitespace-nowrap">
                  {l.label}
                </Link>
              ))}
              <Link href="/notifications" className="hover:text-emerald-700 whitespace-nowrap relative">
                Notifications
                {!!unreadCount && (
                  <span className="ml-1 inline-flex items-center justify-center text-[10px] bg-red-600 text-white rounded-full h-4 min-w-4 px-1">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </nav>
            <div className="flex items-center gap-3 text-sm shrink-0">
              <span className="text-zinc-500 hidden sm:inline">{user.fullName}</span>
              <form action={logoutAction}>
                <button className="text-zinc-600 hover:text-red-600" type="submit">
                  Log out
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 text-sm shrink-0">
            <Link href="/login" className="text-zinc-600 hover:text-emerald-700">Log in</Link>
            <Link href="/signup" className="rounded bg-emerald-700 text-white px-3 py-1.5 hover:bg-emerald-800">Sign up</Link>
          </div>
        )}
      </div>
    </header>
  );
}
