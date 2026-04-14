"use client";

import React from "react";
import { ShoppingBasket, ExternalLink, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface NewOrderPopupProps {
  orderId: string;
  customerName: string;
  total: number;
  onClose: () => void;
}

export default function NewOrderPopup({ orderId, customerName, total, onClose }: NewOrderPopupProps) {
  const router = useRouter();

  const handleViewOrder = () => {
    router.push("/admin/orders");
    onClose();
  };

  return (
    <div className="new-order-popup">
      <div className="new-order-header">
        <div className="new-order-icon">
          <ShoppingBasket size={24} />
        </div>
        <div className="new-order-content">
          <h4>New Order Received!</h4>
          <p>From: {customerName || "Guest"}</p>
          <p style={{ color: "var(--primary)", fontWeight: 900 }}>Total: ₹{Math.round(total)}</p>
        </div>
        <button 
          onClick={onClose}
          style={{ marginLeft: "auto", color: "var(--text-muted)", cursor: "pointer" }}
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="new-order-actions">
        <button className="new-order-btn secondary" onClick={onClose}>
          Dismiss
        </button>
        <button className="new-order-btn primary" onClick={handleViewOrder}>
          <ExternalLink size={16} style={{ marginRight: "0.5rem", display: "inline" }} />
          View Live Orders
        </button>
      </div>
    </div>
  );
}
