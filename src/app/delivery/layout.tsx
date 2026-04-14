import { Metadata } from "next";

export const metadata: Metadata = {
  title: "VibrantEats Delivery | Partner Portal",
  description: "Manage your delivery tasks effortlessly.",
  manifest: "/delivery-manifest.json",
};

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="delivery-pwa-scope">
      {children}
    </div>
  );
}
