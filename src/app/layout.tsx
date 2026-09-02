import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/notifications";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Derayah Demo | TASI Trading Prototype",
  description: "Prototype trading app for TASI-listed stocks, styled after the Derayah Wallet.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const unreadCount = user ? await getUnreadCount(user.id) : 0;
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-50">
        <div className="lg:flex">
          <Sidebar user={user ? { fullName: user.fullName } : null} unreadCount={unreadCount} />
          <main className="flex-1 min-w-0 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
