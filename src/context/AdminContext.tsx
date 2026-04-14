"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AdminContextType {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isLive: boolean;
  toggleLiveStatus: () => Promise<void>;
  statusLoading: boolean;
  newOrder: any;
  showNotification: boolean;
  dismissNotification: () => void;
  hasOldPendingOrders: boolean;
  hasExpiredTimers: boolean;
  expiredOrderIds: string[];
  markOrderAsExpired: (id: string) => void;
  clearExpiredOrder: (id: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [newOrder, setNewOrder] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notifiedOrderIds, setNotifiedOrderIds] = useState<string[]>([]);
  const [hasOldPendingOrders, setHasOldPendingOrders] = useState(false);
  const [expiredOrderIds, setExpiredOrderIds] = useState<string[]>([]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const markOrderAsExpired = (id: string) => {
    setExpiredOrderIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const clearExpiredOrder = (id: string) => {
    setExpiredOrderIds(prev => prev.filter(oid => oid !== id));
  };

  const hasExpiredTimers = expiredOrderIds.length > 0;

  const getOrderPrepTime = (order: any) => {
    if (!order.items || order.items.length === 0) return 10;
    return Math.max(...order.items.map((item: any) => {
      const itemData = typeof item.menuItem === 'object' ? item.menuItem : null;
      return itemData?.preparationTime || 10;
    }));
  };

  useEffect(() => {
    fetchStatus();
    
    // Poll for new orders every 8 seconds for a more responsive experience
    const interval = setInterval(checkForNewOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const checkForNewOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) return;
      const orders = await res.json();
      
      if (Array.isArray(orders) && orders.length > 0) {
        const now = Date.now();
        
        // 1. Detect New Pending Orders
        const newPendingOrders = orders.filter(order => 
          order.status === 'pending' && 
          !notifiedOrderIds.includes(order._id) &&
          (now - new Date(order.createdAt).getTime()) < 120000 
        );

        if (newPendingOrders.length > 0) {
          const orderToNotify = newPendingOrders[0];
          setNewOrder(orderToNotify);
          setShowNotification(true);
          setNotifiedOrderIds(prev => [...prev, ...newPendingOrders.map(o => o._id)]);
          
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
          } catch (e) {}
        }

        // 2. Sync Expired Timers (Single Source of Truth)
        const currentExpiredIds: string[] = [];
        orders.forEach((o: any) => {
          let isOverdue = false;
          if (o.status === 'accepted' && o.acceptedAt) {
            isOverdue = (now - new Date(o.acceptedAt).getTime()) > 60000; // 1 min limit to match UI
          } else if (o.status === 'preparing' && o.preparingAt) {
            const prepTimeMs = getOrderPrepTime(o) * 60000;
            isOverdue = (now - new Date(o.preparingAt).getTime()) > prepTimeMs;
          } else if (o.status === 'out-for-delivery' && o.outForDeliveryAt) {
            // Delivery limit is 20 minutes
            isOverdue = (now - new Date(o.outForDeliveryAt).getTime()) > 1200000;
          }
          
          if (isOverdue) {
            currentExpiredIds.push(o._id);
          }
        });
        
        setExpiredOrderIds(currentExpiredIds);

        // 3. Check for Old Pending Orders (> 30s)
        const oldPending = orders.some((o: any) => 
          o.status === 'pending' && (now - new Date(o.createdAt).getTime()) > 30000
        );
        setHasOldPendingOrders(oldPending);
      } else {
        setHasOldPendingOrders(false);
        setExpiredOrderIds([]);
      }
    } catch (err) {
      if (!(err instanceof TypeError && err.message === 'Failed to fetch')) {
        console.error("Failed to check for new orders:", err);
      }
    }
  };

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) return;
      const data = await res.json();
      if (data && typeof data.isLive === 'boolean') {
        setIsLive(data.isLive);
      }
    } catch (err) {
      console.warn("Failed to fetch restaurant status");
    } finally {
      setStatusLoading(false);
    }
  };

  const toggleLiveStatus = async () => {
    const newStatus = !isLive;
    setStatusLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsLive(data.isLive);
      }
    } catch (err) {
      console.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <AdminContext.Provider value={{ 
      isSidebarOpen, 
      setSidebarOpen, 
      toggleSidebar, 
      isLive, 
      toggleLiveStatus, 
      statusLoading,
      newOrder,
      showNotification,
      dismissNotification: () => setShowNotification(false),
      hasOldPendingOrders,
      hasExpiredTimers,
      expiredOrderIds,
      markOrderAsExpired,
      clearExpiredOrder
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
