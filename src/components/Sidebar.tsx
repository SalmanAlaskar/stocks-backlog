"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(auth)/actions";
import {
  IconDashboard,
  IconWallet,
  IconMarket,
  IconStar,
  IconOrders,
  IconPortfolio,
  IconLayers,
  IconBank,
  IconTrendingUp,
  IconChat,
  IconSettings,
  IconBell,
  IconLogout,
} from "@/components/icons";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/wallet", label: "Wallet", icon: IconWallet },
  { href: "/market", label: "Market", icon: IconMarket },
  { href: "/watchlists", label: "Watchlists", icon: IconStar },
  { href: "/orders", label: "Orders", icon: IconOrders },
  { href: "/portfolio", label: "Portfolio", icon: IconPortfolio },
  { href: "/abian", label: "Abian", icon: IconLayers },
  { href: "/alrajhi", label: "Al Rajhi", icon: IconBank },
  { href: "/ipo", label: "IPO", icon: IconTrendingUp },
  { href: "/assistant", label: "Assistant", icon: IconChat },
  { href: "/settings", label: "Settings", icon: IconSettings },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export default function Sidebar({ user, unreadCount }: { user: { fullName: string } | null; unreadCount?: number }) {
  const pathname = usePathname();

  if (!user) {
    return (
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="font-semibold text-emerald-400">Derayah Demo</Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-zinc-300 hover:text-emerald-300">Log in</Link>
            <Link href="/signup" className="rounded-xl bg-emerald-600 text-white px-3 py-1.5 hover:bg-emerald-500">Sign up</Link>
          </div>
        </div>
      </header>
    );
  }

  const allLinks = [...LINKS, { href: "/notifications", label: "Notifications", icon: IconBell }];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 h-screen sticky top-0 bg-zinc-900 border-r border-zinc-800">
        <div className="h-14 flex items-center px-5 border-b border-zinc-800">
          <Link href="/dashboard" className="font-semibold text-emerald-400 tracking-tight">Derayah Demo</Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {allLinks.map((l) => {
            const active = isActive(pathname, l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm relative ${
                  active ? "bg-zinc-800 text-emerald-400" : "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
                }`}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-emerald-500" />}
                <Icon className="shrink-0" />
                <span className="flex-1">{l.label}</span>
                {l.href === "/notifications" && !!unreadCount && (
                  <span className="inline-flex items-center justify-center text-[10px] bg-red-600 text-white rounded-full h-4 min-w-4 px-1">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center justify-between gap-2 px-2">
            <span className="text-sm text-zinc-300 truncate">{user.fullName}</span>
            <form action={logoutAction}>
              <button className="text-zinc-400 hover:text-red-400 p-1" type="submit" title="Log out">
                <IconLogout />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="font-semibold text-emerald-400 shrink-0">Derayah Demo</Link>
          <div className="flex items-center gap-3 text-sm shrink-0">
            <span className="text-zinc-400 hidden sm:inline">{user.fullName}</span>
            <form action={logoutAction}>
              <button className="text-zinc-300 hover:text-red-400 p-1" type="submit" title="Log out">
                <IconLogout />
              </button>
            </form>
          </div>
        </div>
        <nav className="flex items-center gap-1 px-3 pb-2 overflow-x-auto text-sm text-zinc-300">
          {allLinks.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap ${active ? "bg-zinc-800 text-emerald-400" : "hover:bg-zinc-800/60"}`}
              >
                {l.label}
                {l.href === "/notifications" && !!unreadCount && (
                  <span className="ml-1 inline-flex items-center justify-center text-[10px] bg-red-600 text-white rounded-full h-4 min-w-4 px-1">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
