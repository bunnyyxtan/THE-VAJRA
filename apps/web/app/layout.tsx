import type { Metadata, Viewport } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VAJRA — Signed payment requests, settled on Monad",
    template: "%s · VAJRA",
  },
  description:
    "VAJRA is a payment-request instrument on Monad Mainnet. The recipient signs the terms, the payer sends the exact amount, and settlement is final onchain — with a receipt anyone can verify.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0912" },
    { media: "(prefers-color-scheme: light)", color: "#F8F6F2" },
  ],
};

/**
 * Sets data-theme before first paint so neither appearance flashes.
 * Stored choice wins; otherwise the system preference; default dark.
 */
const themeScript = `(function(){try{var t=localStorage.getItem("vajra-theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}}catch(e){t="dark";}document.documentElement.dataset.theme=t;})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${manrope.variable} ${plexMono.variable}`}>
        <Providers>
          <SiteHeader />
          {children}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
