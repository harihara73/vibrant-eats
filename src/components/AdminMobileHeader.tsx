"use client";

import { Menu, X, Power, PowerOff, Loader2 } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import Link from "next/link";
import TopInstallButton from "./TopInstallButton";

export default function AdminMobileHeader({ title }: { title?: string }) {
  const { toggleSidebar, isSidebarOpen, isLive, toggleLiveStatus, statusLoading, hasExpiredTimers } = useAdmin();

  return (
    <header className="admin-mobile-header">
      <div className="mobile-header-left">
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          style={{ position: 'relative' }}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          {!isSidebarOpen && hasExpiredTimers && (
            <span style={{ 
              position: 'absolute', 
              top: '0', 
              right: '0', 
              width: '10px', 
              height: '10px', 
              background: 'var(--danger)', 
              borderRadius: '50%',
              border: '2px solid white'
            }} className="animate-pulse" />
          )}
        </button>
        <Link href="/admin/dashboard" className="mobile-brand">
          <span className="brand-logo">V<span>E</span></span>
          <span className="brand-text">{title || "Admin"}</span>
        </Link>
      </div>
      
      <div className="mobile-header-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <TopInstallButton />
        <button 
          className={`status-toggle-btn ${isLive ? 'live' : 'shutdown'}`}
          onClick={toggleLiveStatus}
          disabled={statusLoading}
          title={isLive ? "Click to Shutdown Restaurant" : "Click to go Live"}
        >
          {statusLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isLive ? (
            <Power size={14} />
          ) : (
            <PowerOff size={14} />
          )}
          <span>{isLive ? 'Live' : 'Shutdown'}</span>
          {isLive && <span className="dot animate-pulse"></span>}
        </button>
      </div>
    </header>
  );
}
