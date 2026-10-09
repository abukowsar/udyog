import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const hind = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-hind", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-jakarta", display: "swap" });

export const metadata: Metadata = {
  title: { default: "উদ্যোগ (UDYOG) — উপজেলাভিত্তিক তরুণ উদ্যোক্তা কর্মসূচি", template: "%s — উদ্যোগ (UDYOG)" },
  description: "উদ্যোগ (UDYOG): উপজেলাভিত্তিক তরুণ উদ্যোক্তা অনুসন্ধান, চিহ্নিতকরণ ও অর্থায়ন কর্মসূচি — বাংলাদেশ ব্যাংক। Upazila-Driven Youth Opportunity for Growth.",
  icons: { icon: "/assets/udyog-mark.png" }
};

export const viewport: Viewport = { themeColor: "#173d7a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${hind.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
