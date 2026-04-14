"use client";

import { AdminProvider, useAdmin } from "@/context/AdminContext";
import NewOrderPopup from "@/components/NewOrderPopup";
import { Inter } from "next/font/google";
import "./admin.css";

const inter = Inter({ subsets: ["latin"] });

import { usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { showNotification, newOrder, dismissNotification, hasOldPendingOrders, hasExpiredTimers } = useAdmin();
  const pathname = usePathname();

  // Don't show popup if we are already on the orders page
  const isOrdersPage = pathname === "/admin/orders";

  const showReminder = hasOldPendingOrders || hasExpiredTimers;

  return (
    <div className="admin-container">
      {showReminder && (
        <div className="pending-reminder-banner">
          <div className="pulse-icon"></div>
          <AlertCircle size={18} />
          <span>
            {hasExpiredTimers 
              ? "URGENT: Some orders are running late! Action Required." 
              : "ACTION REQUIRED: You have orders pending for more than 30 seconds!"}
          </span>
          <div className="pulse-icon"></div>
        </div>
      )}
      
      {children}
      
      {showNotification && newOrder && (
        <NewOrderPopup 
          orderId={newOrder._id}
          customerName={newOrder.customerName}
          total={newOrder.total || 0}
          onClose={dismissNotification}
        />
      )}
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={inter.className}>
      <AdminProvider>
        <AdminLayoutContent>
          {children}
        </AdminLayoutContent>
      </AdminProvider>
    </div>
  );
}
