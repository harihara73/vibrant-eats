"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingBag, 
  LogOut,
  History,
  X,
  Power,
  PowerOff,
  Loader2,
  Bike,
  TrendingUp,
  Users,
  Settings
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useAdmin } from "@/context/AdminContext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen, isLive, toggleLiveStatus, statusLoading, hasExpiredTimers } = useAdmin();

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Live Orders", href: "/admin/orders", icon: ShoppingBag },
    { name: "Delivery Tracking", href: "/admin/deliveries", icon: Bike },
    { name: "Team Performance", href: "/admin/performance", icon: TrendingUp },
    { name: "Manage Crew", href: "/admin/team", icon: Users },
    { name: "Menu Items", href: "/admin/menu", icon: UtensilsCrossed },
    { name: "Order History", href: "/admin/history", icon: History },
    { name: "Delivery Settings", href: "/admin/settings", icon: Settings },
  ];

  const handleLinkClick = () => {
    // Close sidebar on mobile after clicking a link
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay show" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <Link href="/admin/dashboard" className="sidebar-brand" onClick={handleLinkClick}>
            <div className="sidebar-brand-logo">V<span>E</span></div>
            <span className="sidebar-brand-text">Vibrant<span>Eats</span></span>
          </Link>
          <button 
            className="mobile-close-btn" 
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${pathname === item.href ? "active" : ""}`}
              onClick={handleLinkClick}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <item.icon size={20} />
                {item.name === "Live Orders" && hasExpiredTimers && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '-6px', 
                    right: '-6px', 
                    width: '12px', 
                    height: '12px', 
                    background: 'var(--danger)', 
                    border: '2px solid var(--admin-sidebar)', 
                    borderRadius: '50%',
                    boxShadow: '0 0 12px var(--danger)',
                    zIndex: 2
                  }} className="animate-pulse" />
                )}
              </div>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-status-wrap">
            <button 
              className={`status-toggle-btn sidebar-btn ${isLive ? 'live' : 'shutdown'}`}
              onClick={toggleLiveStatus}
              disabled={statusLoading}
            >
              {statusLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isLive ? (
                <Power size={16} />
              ) : (
                <PowerOff size={16} />
              )}
              <span>{isLive ? 'Restaurant Live' : 'Restaurant Closed'}</span>
            </button>
          </div>
          <button className="logout-btn" onClick={() => signOut({ callbackUrl: '/admin/login' })}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
