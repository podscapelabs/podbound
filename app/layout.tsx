import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://podbound.net"),
  title: "PodBound | Field Archives",
  description: "The official PodBound website and controlled playtesting Field.",
  openGraph: { title: "PodBound™", description: "Forecast. Adapt. Grow.", type: "website", locale: "en_CA" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header />{children}<Footer /></body></html>;
}
