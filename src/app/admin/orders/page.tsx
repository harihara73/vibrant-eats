"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminMobileHeader from "@/components/AdminMobileHeader";
import { 
  Package, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Truck,
  ExternalLink,
  Play,
  Loader2,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OrderSimulator from "@/components/OrderSimulator";

import { useAdmin } from "@/context/AdminContext";
import StatusCountdown from "@/components/StatusCountdown";

interface Order {
  _id: string;
  customerName: string;
  customerPhone: string;
  extraPhone?: string;
  address: string;
  coordinates: { lat: number; lng: number };
  items: any[];
  total: number;
  status: string;
  createdAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  deliveryBoyId?: string;
}

interface TeamMember {
  _id: string;
  name: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentConfig, setAssignmentConfig] = useState<{ 
    orderId: string; 
    memberId: string; 
    memberName: string;
  } | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const { dismissNotification, expiredOrderIds, markOrderAsExpired, clearExpiredOrder } = useAdmin();

  // Helper to calculate prep time based on items
  const getOrderPrepTime = (order: Order) => {
    if (!order.items || order.items.length === 0) return 10;
    const times = order.items.map(item => {
      if (typeof item.menuItem === 'object' && item.menuItem !== null) {
        return item.menuItem.preparationTime || 10;
      }
      return 10;
    });
    return Math.max(...times);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    fetchTeam();
    const runFetch = async () => {
        const success = await fetchOrders();
        if (!success) {
            clearInterval(interval);
        }
    };

    runFetch();
    interval = setInterval(runFetch, 1000); // Reduced from 2s to 1s for "Instant" feel
    return () => clearInterval(interval);
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json();
      if (Array.isArray(data)) setTeam(data);
    } catch (err) {
      console.error("Failed to fetch team");
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
        return true;
      } else {
        setOrders([]);
        return false;
      }
    } catch (err) {
      console.error("Failed to fetch orders");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, extraData: any = {}) => {
    // Instant dismissal of any global notifications and local expired highlights
    dismissNotification();
    clearExpiredOrder(id);
    
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extraData }),
      });
      
      fetchOrders();
    } catch (err) {
      console.error("Failed to update status");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o._id !== id));
        setDeletingOrderId(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete order");
      }
    } catch (err) {
      console.error("Deletion error:", err);
      alert("Network error occurred.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "accepted": return "#3b82f6";
      case "preparing": return "#8b5cf6";
      case "ready-to-pickup": return "#f59e0b";
      case "out-for-delivery": return "#10b981";
      default: return "#64748b";
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="main-content">
          <AdminMobileHeader />
          <div className="loader-overlay" style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <p>Waiting for orders...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="main-content">
        <AdminMobileHeader />
        
        <div className="dashboard-header">
          <div>
            <h1>Live Orders</h1>
            <p>Real-time delivery requests — auto-updating.</p>
          </div>
          <div className="live-indicator">
            <span className="dot animate-pulse"></span>
            Live
          </div>
        </div>

        <div className="admin-grid">
          {Object.entries(
            orders
              .filter(o => ['pending', 'accepted', 'preparing', 'ready-to-pickup'].includes(o.status))
              .reduce((groups: { [key: string]: Order[] }, order) => {
              const phone = order.customerPhone;
              if (!groups[phone]) groups[phone] = [];
              groups[phone].push(order);
              return groups;
            }, {})
          ).map(([phone, customerOrders]) => {
            const customerName = customerOrders[0].customerName;
            const isGroup = customerOrders.length > 1;

            if (isGroup) {
              return (
                <div key={phone} className="customer-group-container">
                  <div className="customer-group-header">
                    <div className="customer-info-main">
                      <div className="customer-avatar">
                        {customerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="customer-name-phone">
                        <h3>{customerName}</h3>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Phone size={14} style={{ color: 'var(--text-muted)' }} /> {phone}
                        </p>
                      </div>
                    </div>
                    <div className="group-badge">
                      {customerOrders.length} ACTIVE ORDERS
                    </div>
                  </div>
                  
                  <div className="customer-orders-list">
                    {customerOrders.map((order) => (
                      <div 
                        key={order._id} 
                        className={`stat-card nested-order-card ${expiredOrderIds.includes(order._id) ? 'card-expired-urgent' : ''}`}
                        style={{ borderLeft: `5px solid ${getStatusColor(order.status)}` }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="stat-icon-wrap" style={{ background: '#f8fafc', padding: '0.5rem' }}>
                              <Package size={18} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Order ID: {order._id.slice(-6)}</h3>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button 
                              className="delete-action-btn"
                              onClick={() => setDeletingOrderId(order._id)}
                              title="Delete Fake Order"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                            <div 
                              style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 800, 
                                textTransform: 'uppercase', 
                                color: getStatusColor(order.status),
                                background: `${getStatusColor(order.status)}15`,
                                padding: '0.25rem 0.6rem',
                                borderRadius: '2rem'
                              }}
                            >
                              {order.status.replace(/-/g, ' ')}
                            </div>
                            
                            {/* Status Timers */}
                            {order.status === 'accepted' && order.acceptedAt && (
                              <StatusCountdown 
                                startTime={order.acceptedAt} 
                                durationMinutes={1} 
                                onExpire={() => markOrderAsExpired(order._id)}
                              />
                            )}
                            {order.status === 'preparing' && order.preparingAt && (
                              <StatusCountdown 
                                startTime={order.preparingAt} 
                                durationMinutes={getOrderPrepTime(order)} 
                                onExpire={() => markOrderAsExpired(order._id)}
                              />
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                            <MapPin size={14} className="text-muted" />
                            <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{order.address}</span>
                          </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Items</div>
                          {order.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                              <span>{item.quantity}x {item.name}</span>
                              <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0', fontWeight: 800 }}>
                            <span>Total</span>
                            <span>₹{order.total}</span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                          {order.status === 'pending' && (
                            <>
                              <button 
                                className="btn-success" 
                                style={{ fontSize: '0.8rem', padding: '0.625rem' }}
                                onClick={() => updateStatus(order._id, 'accepted')}
                              >
                                <CheckCircle2 size={16} /> Accept
                              </button>
                              <button 
                                className="btn-secondary" 
                                style={{ fontSize: '0.8rem', padding: '0.625rem', color: 'var(--danger)', borderColor: '#fecaca' }}
                                onClick={() => updateStatus(order._id, 'rejected')}
                              >
                                <XCircle size={16} /> Reject
                              </button>
                            </>
                          )}
                          
                          {order.status === 'accepted' && (
                            <button 
                              className="btn-primary" 
                              style={{ gridColumn: '1 / -1', fontSize: '0.8rem', padding: '0.625rem', background: '#8b5cf6' }}
                              onClick={() => updateStatus(order._id, 'preparing')}
                            >
                              <Play size={16} style={{ marginRight: '0.4rem' }} /> Start Preparing
                            </button>
                          )}

                          {order.status === 'preparing' && (
                            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <button 
                                className="btn-primary" 
                                style={{ fontSize: '0.8rem', padding: '0.625rem', background: '#f59e0b' }}
                                onClick={() => updateStatus(order._id, 'ready-to-pickup')}
                              >
                                <Package size={16} style={{ marginRight: '0.4rem' }} /> Food Ready to Pickup
                              </button>
                            </div>
                          )}

                          {['preparing', 'ready-to-pickup'].includes(order.status) && (
                            <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #efefef', paddingTop: '0.75rem' }}>
                               <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Handoff to Partner</label>
                               <select 
                                 className="handoff-select"
                                 style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                                 onChange={(e) => {
                                   const member = team.find(m => m._id === e.target.value);
                                   if (member) {
                                      setAssignmentConfig({ 
                                        orderId: order._id, 
                                        memberId: member._id, 
                                        memberName: member.name 
                                      });
                                      e.target.value = ""; // Reset dropdown immediately
                                   }
                                 }}
                                 value=""
                               >
                                 <option value="" disabled>Select Delivery Boy...</option>
                                 {team.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                               </select>
                            </div>
                          )}

                          {order.status === 'out-for-delivery' && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                              <Truck size={16} style={{ display: 'inline', marginRight: '0.4rem' }} /> Out for Delivery
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Nested Deletion Overlay */}
                  <AnimatePresence>
                    {customerOrders.some(o => o._id === deletingOrderId) && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="delete-confirmation-overlay"
                      >
                         <div className="confirm-box">
                            <AlertTriangle size={32} color="#dc2626" />
                            <h3>Delete Fake Order?</h3>
                            <p>This will permanently remove this order from your dashboard.</p>
                            <div className="confirm-actions">
                               <button className="confirm-btn delete" onClick={() => deletingOrderId && handleDeleteOrder(deletingOrderId)}>Delete Permanently</button>
                               <button className="confirm-btn cancel" onClick={() => setDeletingOrderId(null)}>Nevermind</button>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            // Fallback for single order
            const order = customerOrders[0];
            return (
              <div 
                key={order._id} 
                className={`stat-card ${expiredOrderIds.includes(order._id) ? 'card-expired-urgent' : ''}`}
                style={{ borderLeft: `5px solid ${getStatusColor(order.status)}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="stat-icon-wrap" style={{ background: '#f8fafc', padding: '0.5rem' }}>
                      <User size={18} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{order.customerName}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {order._id.slice(-6)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button 
                      className="delete-action-btn"
                      onClick={() => setDeletingOrderId(order._id)}
                      title="Delete Fake Order"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div 
                      style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        textTransform: 'uppercase', 
                        color: getStatusColor(order.status),
                        background: `${getStatusColor(order.status)}15`,
                        padding: '0.25rem 0.6rem',
                        borderRadius: '2rem'
                      }}
                    >
                      {order.status.replace(/-/g, ' ')}
                    </div>
                    
                    {/* Status Timers */}
                    {order.status === 'accepted' && order.acceptedAt && (
                      <StatusCountdown 
                        startTime={order.acceptedAt} 
                        durationMinutes={1} 
                        onExpire={() => markOrderAsExpired(order._id)}
                      />
                    )}
                    {order.status === 'preparing' && order.preparingAt && (
                      <StatusCountdown 
                        startTime={order.preparingAt} 
                        durationMinutes={getOrderPrepTime(order)} 
                        onExpire={() => markOrderAsExpired(order._id)}
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    <MapPin size={14} className="text-muted" />
                    <span style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{order.address}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    <Phone size={14} className="text-muted" />
                    <span>{order.customerPhone}</span>
                  </div>
                  {order.extraPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      <Phone size={14} className="text-muted" style={{ opacity: 0.5 }} />
                      <span>{order.extraPhone} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(Alt)</span></span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <Clock size={14} />
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Items</div>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <span>{item.quantity}x {item.name}</span>
                      <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #e2e8f0', fontWeight: 800 }}>
                    <span>Total</span>
                    <span>₹{order.total}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {order.status === 'pending' && (
                    <>
                      <button 
                        className="btn-success" 
                        style={{ fontSize: '0.8rem', padding: '0.625rem' }}
                        onClick={() => updateStatus(order._id, 'accepted')}
                      >
                        <CheckCircle2 size={16} /> Accept
                      </button>
                      <button 
                        className="btn-secondary" 
                        style={{ fontSize: '0.8rem', padding: '0.625rem', color: 'var(--danger)', borderColor: '#fecaca' }}
                        onClick={() => updateStatus(order._id, 'rejected')}
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </>
                  )}
                  
                  {order.status === 'accepted' && (
                    <button 
                      className="btn-primary" 
                      style={{ gridColumn: '1 / -1', fontSize: '0.8rem', padding: '0.625rem', background: '#8b5cf6' }}
                      onClick={() => updateStatus(order._id, 'preparing')}
                    >
                      <Play size={16} style={{ marginRight: '0.4rem' }} /> Start Preparing
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button 
                        className="btn-primary" 
                        style={{ fontSize: '0.8rem', padding: '0.625rem', background: '#f59e0b' }}
                        onClick={() => updateStatus(order._id, 'ready-to-pickup')}
                      >
                        <Package size={16} style={{ marginRight: '0.4rem' }} /> Food Ready to Pickup
                      </button>
                    </div>
                  )}

                  {['preparing', 'ready-to-pickup'].includes(order.status) && (
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #efefef', paddingTop: '0.75rem' }}>
                       <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'block' }}>Handoff to Partner</label>
                       <select 
                         className="handoff-select"
                         style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
                         onChange={(e) => {
                           const member = team.find(m => m._id === e.target.value);
                           if (member) {
                              setAssignmentConfig({ 
                                orderId: order._id, 
                                memberId: member._id, 
                                memberName: member.name 
                              });
                              e.target.value = ""; // Reset dropdown immediately
                           }
                         }}
                         value=""
                       >
                         <option value="" disabled>Select Delivery Boy...</option>
                         {team.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                       </select>
                    </div>
                  )}

                  {order.status === 'out-for-delivery' && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      <Truck size={16} style={{ display: 'inline', marginRight: '0.4rem' }} /> Out for Delivery
                    </div>
                  )}
                </div>

                {/* Single Deletion Overlay */}
                <AnimatePresence>
                  {deletingOrderId === order._id && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="delete-confirmation-overlay"
                    >
                       <div className="confirm-box">
                          <AlertTriangle size={32} color="#dc2626" />
                          <h3>Delete Fake Order?</h3>
                          <p>This will permanently remove this order from your dashboard.</p>
                          <div className="confirm-actions">
                             <button className="confirm-btn delete" onClick={() => handleDeleteOrder(order._id)}>Delete Permanently</button>
                             <button className="confirm-btn cancel" onClick={() => setDeletingOrderId(null)}>Nevermind</button>
                          </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {orders.length === 0 && !loading && (
            <div style={{ gridColumn: '1 / -1', padding: '6rem 2rem', textAlign: 'center', background: 'white', borderRadius: '1.25rem', border: '2px dashed var(--border)' }}>
              <Package size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h2 style={{ color: 'var(--text-muted)' }}>No live orders</h2>
              <p>When customers place orders, they will appear here.</p>
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              </div>
            </div>
          )}
        </div>

        {/* Premium Assignment Modal */}
        <AnimatePresence>
          {assignmentConfig && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ 
                position: 'fixed', 
                inset: 0, 
                background: 'rgba(15, 23, 42, 0.7)', 
                backdropFilter: 'blur(8px)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem'
              }}
              onClick={() => setAssignmentConfig(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                style={{ 
                  background: 'white', 
                  width: '100%', 
                  maxWidth: '400px', 
                  borderRadius: '1.5rem', 
                  padding: '2rem',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  textAlign: 'center'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', 
                  borderRadius: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1.5rem',
                  color: 'white',
                  boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                }}>
                  <Truck size={32} />
                </div>
                
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Confirm Assignment</h2>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2rem', lineHeight: 1.5 }}>
                  Are you sure you want to assign this order to <span style={{ color: '#4f46e5', fontWeight: 900 }}>{assignmentConfig.memberName}</span>? 
                  They will be notified immediately.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button 
                    className="btn-primary" 
                    style={{ background: 'linear-gradient(to right, #4f46e5, #3b82f6)', border: 'none', padding: '1rem', height: 'auto', fontSize: '1rem' }}
                    onClick={() => {
                      updateStatus(assignmentConfig.orderId, 'ready-to-pickup', { 
                        deliveryBoyId: assignmentConfig.memberId, 
                        deliveryBoyName: assignmentConfig.memberName 
                      });
                      setAssignmentConfig(null);
                    }}
                  >
                    Confirm Assignment
                  </button>
                  <button 
                    className="btn-secondary" 
                    style={{ border: 'none', background: '#f8fafc', color: 'var(--text-muted)', padding: '1rem', height: 'auto', fontSize: '1rem' }}
                    onClick={() => setAssignmentConfig(null)}
                  >
                    Nevermind
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
