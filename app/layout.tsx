import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { BeatstoreMenu } from "@/src/ui/BeatstoreMenu";

export const metadata: Metadata = {
  title: "RCL",
  description: "Retrocycles League — leaderboard, mazing, and hub for learning and competing.",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <BeatstoreMenu />
        {children}
        <Script defer src="/_vercel/insights/script.js" />
      </body>
    </html>
  );
}
