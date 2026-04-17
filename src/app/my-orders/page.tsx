"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ChevronLeft, 
  MapPin, 
  ExternalLink,
  Loader2,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  UtensilsCrossed,
  XCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface Order {
  _id: string;
  status: string;
  total: number;
  items: any[];
  address: string;
  createdAt: string;
  cancellationReason?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:           { label: "Pending",           color: "#d97706", bg: "#fff9eb", icon: Clock },
  accepted:          { label: "Accepted",           color: "#2563eb", bg: "#eff6ff", icon: CheckCircle2 },
  preparing:         { label: "Preparing",          color: "#7c3aed", bg: "#f5f3ff", icon: UtensilsCrossed },
  "out-for-delivery":{ label: "Out for Delivery",   color: "#059669", bg: "#ecfdf5", icon: Truck },
  delivered:         { label: "Delivered",           color: "#16a34a", bg: "#f0fdf4", icon: CheckCircle2 },
  rejected:          { label: "Rejected",            color: "#dc2626", bg: "#fef2f2", icon: Clock },
  cancelled:         { label: "Cancelled by Restaurant", color: "#991b1b", bg: "#fef2f2", icon: XCircle },
};

export default function MyOrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
    if (status === "authenticated") {
      fetchOrders();
    }
  }, [status]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/customer/orders");
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="orders-loading-screen">
        <Loader2 size={44} className="spin" />
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <nav className="page-nav">
        <div className="nav-inner">
          <button onClick={() => router.push("/")} className="back-btn">
            <ChevronLeft size={20} />
            Back to Menu
          </button>
          <div className="nav-title">
            <ShoppingBag size={22} />
            <h1>My Orders</h1>
          </div>
        </div>
      </nav>

      <main className="orders-main">
        {orders.length === 0 ? (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="empty-icon">🍽️</div>
            <h2>No orders yet</h2>
            <p>Your previous orders will appear here once you've placed them.</p>
            <button className="cta-btn" onClick={() => router.push("/")}>
              Start Ordering
            </button>
          </motion.div>
        ) : (
          <div className="orders-list">
            {orders.map((order, index) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG["pending"];
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="order-card"
                >
                  <div className="card-top">
                    <div className="order-id-group">
                      <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                      <span className="order-date">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <span
                      className="status-badge"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      <StatusIcon size={14} />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="card-items">
                    {order.items.map((item, i) => (
                      <span key={i} className="item-chip">
                        {item.quantity}× {item.name}
                      </span>
                    ))}
                  </div>

                  {order.status === 'cancelled' && order.cancellationReason && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ 
                        background: '#fef2f2', 
                        padding: '1rem', 
                        borderRadius: '0.75rem', 
                        marginBottom: '1.25rem',
                        border: '1px solid #fee2e2',
                        fontSize: '0.85rem',
                        color: '#991b1b',
                        fontWeight: 600
                      }}
                    >
                      <div style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 900, marginBottom: '0.25rem', opacity: 0.7 }}>Reason for cancellation</div>
                      "{order.cancellationReason}"
                    </motion.div>
                  )}

                  <div className="card-bottom">
                    <div className="address-row">
                      <MapPin size={14} />
                      <span>{order.address.slice(0, 45)}{order.address.length > 45 ? "…" : ""}</span>
                    </div>
                    <div className="bottom-right">
                      <span className="order-total">₹{Math.round(order.total)}</span>
                      <button
                        className="track-btn"
                        onClick={() => router.push(`/order-tracking/${order._id}`)}
                      >
                        Track
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          background: #f8fafc;
          font-family: inherit;
        }

        .orders-loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 1rem;
          color: #64748b;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .page-nav {
          background: white;
          border-bottom: 1px solid #f1f5f9;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .nav-inner {
          max-width: 860px;
          margin: 0 auto;
          padding: 1.25rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #f1f5f9;
          border: none;
          color: #475569;
          padding: 0.6rem 1.25rem;
          border-radius: 2rem;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .back-btn:hover { background: #e2e8f0; }
        .nav-title {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: #1e1b4b;
        }
        .nav-title h1 { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; }

        .orders-main {
          max-width: 860px;
          margin: 0 auto;
          padding: 2rem 2rem 5rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 6rem 2rem;
        }
        .empty-icon {
          font-size: 4rem;
          width: 100px;
          height: 100px;
          background: #f1f5f9;
          border-radius: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .empty-state h2 { font-size: 1.75rem; color: #1e293b; margin-bottom: 0.75rem; font-weight: 800; }
        .empty-state p { color: #64748b; font-size: 1rem; margin-bottom: 2.5rem; max-width: 400px; }
        .cta-btn {
          background: #dc2626;
          color: white;
          border: none;
          padding: 1rem 2.5rem;
          border-radius: 1.25rem;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 10px 20px -5px rgba(220,38,38,0.3);
          transition: all 0.2s;
        }
        .cta-btn:hover { transform: translateY(-2px); }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .order-card {
          background: white;
          border-radius: 1.5rem;
          padding: 1.5rem;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s;
        }
        .order-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.07);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .order-id-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .order-id { font-weight: 900; font-size: 1.1rem; color: #1e1b4b; }
        .order-date { font-size: 0.8rem; color: #94a3b8; }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 1rem;
          border-radius: 2rem;
          font-size: 0.8rem;
          font-weight: 800;
          white-space: nowrap;
        }

        .card-items {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px dashed #f1f5f9;
        }
        .item-chip {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 2rem;
          padding: 0.35rem 0.875rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
        }

        .card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .address-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #94a3b8;
          font-size: 0.875rem;
          flex: 1;
          min-width: 0;
        }
        .address-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bottom-right {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }
        .order-total {
          font-size: 1.25rem;
          font-weight: 900;
          color: #1e1b4b;
        }
        .track-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #fef2f2;
          color: #dc2626;
          border: none;
          border-radius: 2rem;
          padding: 0.5rem 1.25rem;
          font-weight: 800;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .track-btn:hover { background: #dc2626; color: white; }

        @media (max-width: 640px) {
          .nav-inner { padding: 1rem 1.25rem; }
          .orders-main { padding: 1.25rem 1.25rem 5rem; }
          .card-bottom { flex-direction: column; align-items: flex-start; }
          .bottom-right { width: 100%; justify-content: space-between; }
        }
      `}</style>
    </div>
  );
}
