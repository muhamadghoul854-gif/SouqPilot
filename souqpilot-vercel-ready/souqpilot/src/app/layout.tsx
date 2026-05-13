import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SouqPilot — Digital Marketplace",
  description: "Premium digital products: e-books, courses, and software. Instant secure delivery.",
  openGraph: {
    title: "SouqPilot",
    description: "Discover and purchase premium digital products",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
