"use client";
 
import { usePWA } from "@/context/PWAContext";
import { Download } from "lucide-react";
import { usePathname } from "next/navigation";
 
export default function TopInstallButton() {
  const { isInstallable, install } = usePWA();
  const pathname = usePathname();
 
  if (!isInstallable) return null;
 
  // Determine label based on path
  let label = "Install App";
  if (pathname.startsWith('/admin')) label = "Install Admin App";
  if (pathname.startsWith('/delivery')) label = "Install Delivery App";
  const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/delivery');
 
  return (
    <button
      onClick={install}
      className={isAdmin ? "ve-pwa-install-pill" : "nav-install-btn customer-theme"}
      title={label}
      style={isAdmin ? { margin: 0, padding: '0.5rem 1rem !important', fontSize: '0.75rem !important', width: 'auto !important' } : {}}
    >
      <Download size={isAdmin ? 14 : 16} />
      <span className="install-btn-text">{label}</span>
    </button>
  );
}
