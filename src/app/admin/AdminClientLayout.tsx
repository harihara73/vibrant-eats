"use client";

import { useAdmin } from "@/context/AdminContext";
import NewOrderPopup from "@/components/NewOrderPopup";
import { usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const { showNotification, newOrder, dismissNotification, hasOldPendingOrders, hasExpiredTimers } = useAdmin();
  const pathname = usePathname();

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
