import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/CartContext";
import PWAInstall from "@/components/PWAInstall";

const outfit = Outfit({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#1e1b4b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "VibrantEats | Gourmet Food Delivered",
  description: "Experience the best local flavors delivered to your doorstep. Commission-free, directly from your favorite restaurants.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VibrantEats",
  },
};

import { SessionProvider } from "next-auth/react";
import { PWAProvider } from "@/context/PWAContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.className} suppressHydrationWarning>
        <SessionProvider>
          <PWAProvider>
            <CartProvider>
              {children}
              <PWAInstall />
            </CartProvider>
          </PWAProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
