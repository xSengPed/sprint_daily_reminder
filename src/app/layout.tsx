import type { Metadata, Viewport } from "next";
import { HolidaysProvider } from "@/lib/holidays";
import { StoreProvider } from "@/lib/store";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Reminder · Zeny & LedgerX",
  description: "จัดการ daily standup ของ 2 squad ในที่เดียว",
};

export const viewport: Viewport = {
  themeColor: "#7c5cff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <StoreProvider>
          <HolidaysProvider>{children}</HolidaysProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
