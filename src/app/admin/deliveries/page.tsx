"use client";
 
 import { useState, useEffect } from "react";
 import AdminSidebar from "@/components/AdminSidebar";
 import AdminMobileHeader from "@/components/AdminMobileHeader";
 import { 
   Bike, 
   MapPin, 
   Phone, 
   Package, 
   CheckCircle2, 
   Clock,
   ExternalLink,
   Loader2,
   AlertTriangle,
   RefreshCw,
   User,
   Trash2
 } from "lucide-react";
 import { useAdmin } from "@/context/AdminContext";
 import StatusCountdown from "@/components/StatusCountdown";
 import { motion, AnimatePresence } from "framer-motion";
 
 interface Order {
   _id: string;
   customerName: string;
   customerPhone: string;
   address: string;
   items: any[];
   total: number;
   status: string;
   outForDeliveryAt?: string;
   deliveryBoyId?: string;
   deliveryBoyName?: string;
 }
 
 interface TeamMember {
   _id: string;
   name: string;
 }
 
 export default function DeliveriesPage() {
   const [orders, setOrders] = useState<Order[]>([]);
   const [team, setTeam] = useState<TeamMember[]>([]);
   const [loading, setLoading] = useState(true);
   const [reassigningId, setReassigningId] = useState<string | null>(null);
   const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
   const [cancelReason, setCancelReason] = useState("");
   
   const { expiredOrderIds, markOrderAsExpired, clearExpiredOrder } = useAdmin();
 
   useEffect(() => {
     fetchOrders();
     fetchTeam();
     const interval = setInterval(fetchOrders, 4000);
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
         // Show ONLY out-for-delivery orders here
         setOrders(data.filter(o => o.status === 'out-for-delivery'));
       }
     } catch (err) {
       console.error("Failed to fetch deliveries");
     } finally {
       setLoading(false);
     }
   };
 
   const markAsDelivered = async (id: string) => {
     clearExpiredOrder(id);
     try {
       const res = await fetch(`/api/orders/${id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ status: "delivered" }),
       });
       if (res.ok) {
         setOrders(prev => prev.filter(o => o._id !== id));
       }
     } catch (err) {
       console.error("Failed to update status");
     }
   };
 
   const handleDeleteOrder = async (id: string) => {
     try {
       const res = await fetch(`/api/orders/${id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ status: "cancelled", cancellationReason: cancelReason }),
       });
       if (res.ok) {
         setOrders(prev => prev.filter(o => o._id !== id));
         clearExpiredOrder(id);
         setDeletingOrderId(null);
         setCancelReason("");
       } else {
         const data = await res.json();
         alert(data.error || "Failed to cancel order");
       }
     } catch (err) {
       console.error("Cancellation error:", err);
       alert("Network error occurred.");
     }
   };
 
   const reassignOrder = async (orderId: string, boyId: string, boyName: string) => {
     setReassigningId(orderId);
     try {
       const res = await fetch(`/api/orders/${orderId}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
           status: "ready-to-pickup",
           deliveryBoyId: boyId, 
           deliveryBoyName: boyName 
         }),
       });
       if (res.ok) {
         // Remove from Tracking page because it is no longer 'out-for-delivery' 
         // until the new partner accepts it.
         setOrders(prev => prev.filter(o => o._id !== orderId));
       }
     } catch (err) {
       console.error("Reassignment failed");
     } finally {
       setReassigningId(null);
     }
   };
 
   if (loading && orders.length === 0) {
     return (
       <div className="admin-layout">
         <AdminSidebar />
         <main className="main-content">
           <AdminMobileHeader />
           <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
             <Loader2 className="animate-spin" size={48} color="var(--primary)" />
             <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading live deliveries...</p>
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
             <h1>Delivery Tracking</h1>
             <p>Monitor orders currently on the road.</p>
           </div>
           <div className="live-indicator">
             <span className="dot animate-pulse"></span>
             Live Tracking
           </div>
         </div>
 
         <div className="admin-grid">
           <AnimatePresence>
             {orders.map((order) => {
               const isExpired = expiredOrderIds.includes(order._id);
               
               return (
                 <motion.div 
                   key={order._id}
                   layout
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className={`stat-card ${isExpired ? 'card-expired-urgent' : ''}`}
                   style={{ 
                     border: isExpired ? '2px solid #ef4444' : '1px solid var(--border)',
                     borderLeft: `5px solid ${isExpired ? '#ef4444' : '#10b981'}` 
                   }}
                 >
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <div className="stat-icon-wrap" style={{ background: isExpired ? '#fef2f2' : '#f0fdf4', color: isExpired ? '#ef4444' : '#10b981' }}>
                         <Bike size={20} />
                       </div>
                       <div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{order.customerName}</h3>
                            <button 
                              className="delete-action-btn"
                              onClick={() => setDeletingOrderId(order._id)}
                              title="Cancel & Archive Order"
                              style={{ padding: '0.2rem', color: 'var(--danger)', opacity: 0.7 }}
                            >
                              <Trash2 size={16} />
                            </button>
                         </div>
                         <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {order._id.slice(-6).toUpperCase()}</p>
                       </div>
                     </div>
                     
                     {order.outForDeliveryAt && (
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                         <div className={isExpired ? "badge-expired-pulse" : ""}>
                            <StatusCountdown 
                              startTime={order.outForDeliveryAt} 
                              durationMinutes={20} 
                              onExpire={() => markOrderAsExpired(order._id)}
                            />
                         </div>
                         <span style={{ fontSize: '0.65rem', fontWeight: 900, color: isExpired ? '#ef4444' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                           {isExpired ? "EXPIRED" : "Delivery Deadline"}
                         </span>
                       </div>
                     )}
                   </div>
 
                   {isExpired && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       style={{ 
                         background: '#fef2f2', 
                         color: '#991b1b', 
                         padding: '0.75rem', 
                         borderRadius: '0.75rem', 
                         marginBottom: '1rem',
                         fontSize: '0.8rem',
                         fontWeight: 700,
                         display: 'flex',
                         alignItems: 'center',
                         gap: '0.5rem',
                         border: '1px solid #fee2e2'
                       }}
                     >
                       <AlertTriangle size={16} className="animate-bounce" />
                       <span>Delivery is overdue! Contact delivery partner.</span>
                     </motion.div>
                   )}
 
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                     <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem' }}>
                       <MapPin size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                       <span style={{ fontWeight: 600 }}>{order.address}</span>
                     </div>
                     <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem' }}>
                       <Phone size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                       <a href={`tel:${order.customerPhone}`} style={{ color: '#3b82f6', fontWeight: 800, textDecoration: 'none' }}>
                         {order.customerPhone}
                       </a>
                     </div>
                   </div>
 
                   <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <User size={14} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned To</span>
                         </div>
                         <div style={{ position: 'relative' }}>
                            <select 
                               className="reassign-select"
                               style={{ 
                                  background: 'white', 
                                  border: '1px solid var(--border)', 
                                  padding: '0.2rem 0.5rem', 
                                  borderRadius: '0.5rem', 
                                  fontSize: '0.75rem', 
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  outline: 'none',
                                  width: '100px'
                               }}
                               value={order.deliveryBoyId || ""}
                               onChange={(e) => {
                                  const member = team.find(m => m._id === e.target.value);
                                  if (member) reassignOrder(order._id, member._id, member.name);
                               }}
                               disabled={reassigningId === order._id}
                            >
                               <option disabled value="">Change Partner</option>
                               {team.map(m => (
                                  <option key={m._id} value={m._id}>{m.name}</option>
                               ))}
                            </select>
                         </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                         <span style={{ color: 'var(--primary)' }}>{order.deliveryBoyName || "Unassigned"}</span>
                         <span>₹{order.total}</span>
                      </div>
                   </div>
 
                   <button 
                     className="btn-success" 
                     style={{ width: '100%', padding: '1rem' }}
                     onClick={() => markAsDelivered(order._id)}
                   >
                     <CheckCircle2 size={18} /> Mark as Delivered
                   </button>
 
                   {/* Deletion Overlay for Tracking */}
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
                              <h3>Archive Order?</h3>
                              <p>Move this delivery record to history.</p>

                              <div style={{ marginTop: '1.25rem', textAlign: 'left' }}>
                                 <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Reason for Cancellation (Optional)</label>
                                 <textarea 
                                    className="form-input"
                                    placeholder="e.g., Driver couldn't reach, Fake info..."
                                    style={{ width: '100%', height: '80px', padding: '0.75rem', borderRadius: '0.75rem', resize: 'none', background: '#f8fafc', border: '1px solid var(--border)', fontSize: '0.85rem', wordBreak: 'break-all' }}
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                 />
                              </div>

                              <div className="confirm-actions">
                                 <button className="confirm-btn delete" onClick={() => handleDeleteOrder(order._id)}>Confirm Cancellation</button>
                                 <button className="confirm-btn cancel" onClick={() => { setDeletingOrderId(null); setCancelReason(""); }}>Nevermind</button>
                              </div>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </motion.div>
               );
             })}
           </AnimatePresence>
 
           {orders.length === 0 && !loading && (
             <div style={{ gridColumn: '1 / -1', padding: '6rem 2rem', textAlign: 'center', background: 'white', borderRadius: '1.25rem', border: '2px dashed var(--border)' }}>
               <div style={{ 
                 width: 64, 
                 height: 64, 
                 background: '#f8fafc', 
                 borderRadius: '50%', 
                 display: 'flex', 
                 alignItems: 'center', 
                 justifyContent: 'center',
                 margin: '0 auto 1.5rem',
                 color: 'var(--text-muted)'
               }}>
                 <Bike size={32} />
               </div>
               <h2 style={{ color: 'var(--text-muted)', fontWeight: 800 }}>No Active Deliveries</h2>
               <p>When delivery partners pick up orders, they will appear here for monitoring.</p>
             </div>
           )}
         </div>
       </main>
     </div>
   );
 }
