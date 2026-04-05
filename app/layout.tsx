import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const SITE = "https://puregym-dashboard.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Unofficial PureGym Dashboard",
    template: "%s · PureGym Dashboard",
  },
  description:
    "Personal, unofficial PureGym dashboard: visit history, live gym occupancy, classes, and membership details. Credentials stay in your browser.",
  applicationName: "Unofficial PureGym Dashboard",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: SITE,
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: SITE,
    siteName: "Unofficial PureGym Dashboard",
    title: "Unofficial PureGym Dashboard",
    description:
      "Visit history, live occupancy, and membership details — unofficial fan-made dashboard. Your credentials never leave your device.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unofficial PureGym Dashboard",
    description:
      "Visit history, live occupancy, and membership details — unofficial fan-made dashboard.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
