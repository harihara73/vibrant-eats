import { AdminProvider } from "@/context/AdminContext";
import { Inter } from "next/font/google";
import "./admin.css";
import AdminClientLayout from "./AdminClientLayout";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VibrantEats Admin | Manager Portal",
  description: "Manage your restaurant operations with ease.",
  manifest: "/admin-manifest.json",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className}>
      <AdminProvider>
        <AdminClientLayout>
          {children}
        </AdminClientLayout>
      </AdminProvider>
    </div>
  );
}
