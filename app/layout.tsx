import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { BottomNav } from "@/components/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Train Tracker Purwokerto",
  description:
    "Perkiraan posisi kereta api real-time di peta untuk kereta yang melintasi Stasiun Purwokerto (PWT). Posisi diestimasi dari jadwal, bukan GPS.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1565C0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <div className="flex-1 flex flex-col pb-[calc(56px+env(safe-area-inset-bottom))] sm:pb-0 sm:pt-14">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
