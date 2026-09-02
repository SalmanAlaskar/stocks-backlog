// Minimal, consistent line icons (18x18, stroke=currentColor) — no external icon library.
type IconProps = { className?: string };
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const IconDashboard = ({ className }: IconProps) => (
  <svg {...base} className={className}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
);
export const IconWallet = ({ className }: IconProps) => (
  <svg {...base} className={className}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><circle cx="16" cy="14" r="1.4" /></svg>
);
export const IconMarket = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M4 19V10" /><path d="M11 19V5" /><path d="M18 19v-7" /></svg>
);
export const IconStar = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" /></svg>
);
export const IconOrders = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M5 6h14" /><path d="M5 12h14" /><path d="M5 18h9" /></svg>
);
export const IconPortfolio = ({ className }: IconProps) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5V12l6 3.2" /></svg>
);
export const IconLayers = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M12 3l8 4.5-8 4.5-8-4.5z" /><path d="M4 12l8 4.5 8-4.5" /><path d="M4 16.5L12 21l8-4.5" /></svg>
);
export const IconBank = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M3 9.5L12 4l9 5.5" /><rect x="4" y="10.5" width="16" height="8.5" rx="1" /><path d="M8 10.5v8.5M12 10.5v8.5M16 10.5v8.5" /></svg>
);
export const IconTrendingUp = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>
);
export const IconChat = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M4 5h16v11H9l-5 4z" /></svg>
);
export const IconSettings = ({ className }: IconProps) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="3.2" /><path d="M12 3v3M12 18v3M4.5 7l2.5 1.5M17 15.5l2.5 1.5M4.5 17l2.5-1.5M17 8.5l2.5-1.5M3 12h3M18 12h3" /></svg>
);
export const IconBell = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M6 16V10a6 6 0 0112 0v6l1.5 2.5h-15z" /><path d="M10 20a2 2 0 004 0" /></svg>
);
export const IconLogout = ({ className }: IconProps) => (
  <svg {...base} className={className}><path d="M10 17l-5-5 5-5" /><path d="M5 12h11" /><path d="M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" /></svg>
);
