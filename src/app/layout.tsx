import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/CartContext";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VibrantEats | Gourmet Food Delivered",
  description: "Experience the best local flavors delivered to your doorstep. Commission-free, directly from your favorite restaurants.",
};

import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.className} suppressHydrationWarning>
        <SessionProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
