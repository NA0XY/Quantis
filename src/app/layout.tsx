import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://app.quantis.workers.dev"
);

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Quantis",
  title: {
    default: "Quantis | Crypto Algo Trading Simulator",
    template: "%s | Quantis",
  },
  description:
    "Build, backtest, and run crypto algorithmic trading strategies with Quantis, a real-time crypto algo-trading simulator for live market experiments.",
  keywords: [
    "Quantis",
    "crypto algorithmic trading simulator",
    "crypto algo trading",
    "backtesting crypto strategies",
    "trading bot simulator",
    "crypto trading dashboard",
    "Binance market simulator",
    "paper trading crypto",
  ],
  authors: [{ name: "Quantis" }],
  creator: "Quantis",
  publisher: "Quantis",
  category: "finance",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Quantis",
    title: "Quantis | Crypto Algo Trading Simulator",
    description:
      "Build, backtest, and run crypto algorithmic trading strategies with real-time market data and a neo-brutalist trading workspace.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Quantis crypto algorithmic trading simulator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quantis | Crypto Algo Trading Simulator",
    description:
      "Build, backtest, and run crypto algorithmic trading strategies with real-time market data.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <body>
        {children}
      </body>
    </html>
  );
}
