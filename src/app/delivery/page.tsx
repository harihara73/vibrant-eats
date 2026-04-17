"use client";
 
 import { useState, useEffect } from "react";
 import { 
   Bike, 
   MapPin, 
   Phone, 
   Package, 
   CheckCircle2, 
   Loader2,
   Clock,
   ChevronRight,
   LogOut,
   User as UserIcon,
   Bell,
   Volume2,
   XCircle,
   RefreshCw,
   Navigation,
   Trophy,
   Map as MapIcon
 } from "lucide-react";
 import { motion, AnimatePresence } from "framer-motion";
 import { signOut, useSession } from "next-auth/react";
 import DeliveryRouteMap from "@/components/DeliveryRouteMap";
 import BottomInstallButton from "@/components/BottomInstallButton";
 import TopInstallButton from "@/components/TopInstallButton";
 import "./delivery.css";
 
 interface Order {
   _id: string;
   customerName: string;
   customerPhone: string;
   extraPhone?: string;
   address: string;
   items: any[];
   total: number;
   status: string;
   createdAt: string;
   deliveryBoyId?: string;
   coordinates: {
     lat: number;
     lng: number;
   };
 }
 
 export default function DeliveryApp() {
   const { data: session } = useSession();
   const [orders, setOrders] = useState<Order[]>([]);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<'available' | 'ongoing' | 'performance'>('available');
   const [updatingId, setUpdatingId] = useState<string | null>(null);
   
   const [performanceData, setPerformanceData] = useState<{ today: any; history: any[] }>({ today: { totalOrders: 0 }, history: [] });
   const [perfLoading, setPerfLoading] = useState(false);
   
   // Notification State
   const [newOrderAlert, setNewOrderAlert] = useState<{ message: string; type: 'pickup' | 'assigned' } | null>(null);
   const [lastOrderIds, setLastOrderIds] = useState<Set<string>>(new Set());
   const [audioEnabled, setAudioEnabled] = useState(false);
   
   // Route Map State
   const [settings, setSettings] = useState<any>(null);
   const [showRouteFor, setShowRouteFor] = useState<Order | null>(null);
 
   useEffect(() => {
     fetchSettings();
   }, []);
 
   const fetchSettings = async () => {
     try {
       const res = await fetch("/api/admin/settings");
       if (res.ok) {
         const data = await res.json();
         setSettings(data);
       }
     } catch (err) {
       console.error("Failed to fetch settings:", err);
     }
   };
 
   useEffect(() => {
     if (session?.user) {
       fetchOrders();
       const interval = setInterval(fetchOrders, 2000); // Reduced from 4s to 2s for snappier updates
       return () => clearInterval(interval);
     }
   }, [session]);
 
   useEffect(() => {
     if (activeTab === 'performance') {
       fetchPerformance();
     }
   }, [activeTab]);
 
   const fetchPerformance = async () => {
     setPerfLoading(true);
     try {
       const res = await fetch("/api/delivery/performance");
       if (res.ok) {
         const data = await res.json();
         setPerformanceData(data);
       }
     } catch (err) {
       console.error("Failed to fetch performance:", err);
     } finally {
       setPerfLoading(false);
     }
   };
 
   const fetchOrders = async () => {
     try {
       const res = await fetch("/api/orders", { cache: 'no-store' });
       
       if (res.status === 401) {
         console.error("Unauthorized: Delivery boy not logged in");
         setLoading(false);
         return;
       }
 
       if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
       
       const data = await res.json();
       if (Array.isArray(data)) {
         const userId = (session?.user as any)?.id?.toString();
         
         const deliveryRelevant = data.filter(o => 
           o.status === 'ready-to-pickup' || 
           (o.status === 'out-for-delivery' && o.deliveryBoyId?.toString() === userId)
         );
 
         // Notify Logic
         if (lastOrderIds.size > 0) {
           const currentIds = new Set(deliveryRelevant.map(o => o._id));
           const newOnes = deliveryRelevant.filter(o => !lastOrderIds.has(o._id));
           
           if (newOnes.length > 0) {
             const newest = newOnes[0];
             const isDirect = (newest.status === 'out-for-delivery' || newest.status === 'ready-to-pickup') && 
                              newest.deliveryBoyId?.toString() === userId;
             
             triggerNotification(
               isDirect ? "New Order Assigned to You!" : "New Order Ready for Pickup!",
               isDirect ? 'assigned' : 'pickup'
             );
           }
           setLastOrderIds(currentIds);
         } else {
           setLastOrderIds(new Set(deliveryRelevant.map(o => o._id)));
         }
 
         setOrders(deliveryRelevant);
       }
     } catch (err) {
       console.error("Delivery fetch error:", err);
     } finally {
       setLoading(false);
     }
   };
 
   const handleStatusUpdate = async (id: string, newStatus: string, extraData: any = {}) => {
     setUpdatingId(id);
     try {
       const res = await fetch(`/api/orders/${id}`, {
         method: "PATCH",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ status: newStatus, ...extraData }),
       });
       
       if (res.ok) {
         // Optimistic local update
         setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus, ...extraData } : o));
         // Instant refresh from server to ensure perfect sync
         fetchOrders();
       } else {
         const errorData = await res.json();
         alert(errorData.error || "Action failed. Are you logged in?");
       }
     } catch (err) {
       alert("Network connection lost. Please try again.");
     } finally {
       setUpdatingId(null);
     }
   };
 
   const triggerNotification = (message: string, type: 'pickup' | 'assigned') => {
     setNewOrderAlert({ message, type });
     if (audioEnabled) {
       const audio = new Audio("/notification.mp3");
       audio.play().catch(e => console.log("Audio play blocked"));
     }
     // Auto hide after 5 seconds
     setTimeout(() => setNewOrderAlert(null), 5000);
   };
 
   const userId = (session?.user as any)?.id?.toString();
   const availableOrders = orders.filter(o => 
     o.status === 'ready-to-pickup' && (!o.deliveryBoyId || o.deliveryBoyId?.toString() === userId)
   );
   const ongoingOrders = orders.filter(o => 
     o.status === 'out-for-delivery' && o.deliveryBoyId?.toString() === (session?.user as any)?.id?.toString()
   );
 
   if (loading && orders.length === 0) {
     return (
       <div className="delivery-app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <div style={{ textAlign: 'center' }}>
           <Loader2 className="animate-spin" size={48} color="#3b82f6" />
           <p style={{ marginTop: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>Syncing with Kitchen...</p>
         </div>
       </div>
     );
   }
 
   return (
     <div className="delivery-app-container">
       {/* Premium Header */}
       <header className="delivery-header">
         <div className="header-content">
           <div className="delivery-logo">
             <Bike size={24} />
             <span>Vibrant</span>Delivery
           </div>
           <div className="header-actions">
             <TopInstallButton />
             <div className="user-profile">
               <UserIcon size={18} />
               <span>{session?.user?.name || "Delivery Staff"}</span>
             </div>
             <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
               <button 
                 className={`modern-status-badge ${audioEnabled ? 'active' : ''}`}
                 onClick={() => setAudioEnabled(!audioEnabled)}
                 style={{ 
                   background: audioEnabled ? '#f0fdf4' : '#f8fafc', 
                   color: audioEnabled ? '#16a34a' : 'var(--text-muted)', 
                   border: '1px solid var(--border)', 
                   padding: '0.4rem 0.8rem', 
                   borderRadius: '0.75rem', 
                   display: 'flex', 
                   alignItems: 'center', 
                   gap: '0.4rem', 
                   fontWeight: 800, 
                   fontSize: '0.75rem',
                   cursor: 'pointer'
                 }}
               >
                 <Volume2 size={16} /> {audioEnabled ? "Sound ON" : "Sound OFF"}
               </button>
               <button className="logout-btn" onClick={() => signOut({ callbackUrl: '/admin/login' })}>
                 <LogOut size={18} />
                 <span>Exit</span>
               </button>
             </div>
           </div>
         </div>
       </header>
 
       {/* Modern Tabs */}
       <div className="delivery-tabs">
         <div className="tab-switcher">
           <button 
             className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
             onClick={() => setActiveTab('available')}
           >
             Available ({availableOrders.length})
           </button>
           <button 
             className={`tab-btn ${activeTab === 'ongoing' ? 'active' : ''}`}
             onClick={() => setActiveTab('ongoing')}
           >
             Ongoing ({ongoingOrders.length})
           </button>
           <button 
             className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
             onClick={() => setActiveTab('performance')}
           >
             Performance
           </button>
         </div>
       </div>
 
       {/* Assignment/New Order Overlay Notification */}
       <AnimatePresence>
         {newOrderAlert && (
           <motion.div 
             initial={{ opacity: 0, y: -100 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.9 }}
             className="assignment-notification"
             style={{ 
               position: 'fixed', 
               top: '1rem', 
               left: '1rem', 
               right: '1rem', 
               zIndex: 2000,
               background: newOrderAlert.type === 'assigned' ? 'linear-gradient(135deg, #1e1b4b, #312e81)' : 'white',
               color: newOrderAlert.type === 'assigned' ? 'white' : 'var(--text-main)',
               padding: '1.25rem',
               borderRadius: '1.25rem',
               boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
               display: 'flex',
               alignItems: 'center',
               gap: '1rem',
               border: `1px solid ${newOrderAlert.type === 'assigned' ? 'transparent' : 'var(--border)'}`
             }}
           >
             <div style={{ background: newOrderAlert.type === 'assigned' ? '#4f46e5' : '#f0fdf4', padding: '0.75rem', borderRadius: '0.75rem' }}>
               <Bell size={24} color={newOrderAlert.type === 'assigned' ? 'white' : '#16a34a'} className="animate-bounce" />
             </div>
             <div style={{ flex: 1 }}>
               <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>{newOrderAlert.message}</h4>
               <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8, fontWeight: 600 }}>Check your list to view details.</p>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
 
       <main className="delivery-main">
         <AnimatePresence mode="wait">
           <motion.div
             key={activeTab}
             initial={{ opacity: 0, scale: 0.98 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 1.02 }}
             transition={{ duration: 0.2 }}
           >
             {activeTab === 'performance' ? (
               <div className="performance-view">
                 <div className="perf-summary-card">
                   <div className="perf-stat">
                     <span className="perf-label">Today's Deliveries</span>
                     <span className="perf-value">{performanceData.today.totalOrders}</span>
                   </div>
                   <div className="perf-icon-wrap">
                     <Trophy size={32} color="#fbbf24" />
                   </div>
                 </div>
 
                 <h3 className="section-title">Recent History</h3>
                 {perfLoading ? (
                   <div style={{ padding: '2rem', textAlign: 'center' }}>
                     <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                   </div>
                 ) : (
                   <div className="history-list">
                     {performanceData.history.length === 0 ? (
                       <p className="empty-history">No delivered orders found yet.</p>
                     ) : (
                       performanceData.history.map((hOrder) => (
                         <div key={hOrder._id} className="history-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div className="history-info" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                               <span className="history-id">#{hOrder._id.slice(-6).toUpperCase()}</span>
                               <span className="history-customer" style={{ fontSize: '0.9rem' }}>{hOrder.customerName}</span>
                            </div>
                            <div className="history-meta" style={{ textAlign: 'left', marginTop: '0.75rem', gridColumn: '1 / -1', borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Picked Up</span>
                                 <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{hOrder.outForDeliveryAt ? new Date(hOrder.outForDeliveryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                 <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Delivered</span>
                                 <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>{hOrder.deliveredAt ? new Date(hOrder.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                              </div>
                              {hOrder.outForDeliveryAt && hOrder.deliveredAt && (
                                 <div style={{ gridColumn: '1 / -1', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Clock size={12} /> Duration: {Math.round((new Date(hOrder.deliveredAt).getTime() - new Date(hOrder.outForDeliveryAt).getTime()) / 60000)} mins
                                 </div>
                              )}
                            </div>
                         </div>
                       ))
                     )}
                   </div>
                 )}
               </div>
             ) : (activeTab === 'available' ? availableOrders : ongoingOrders).length === 0 ? (
               <div className="empty-state">
                 <div className="empty-icon">
                   <Package size={32} />
                 </div>
                 <h3>All Caught Up!</h3>
                 <p>New orders will appear here automatically.</p>
               </div>
             ) : (
               (activeTab === 'available' ? availableOrders : ongoingOrders).map((order) => (
                 <div key={order._id} className="delivery-card">
                   <div className="card-header">
                     <div>
                       <div className="card-id">Order ID: {order._id.slice(-6).toUpperCase()}</div>
                       <div className="card-customer-name">{order.customerName}</div>
                     </div>
                     <div className="card-total">₹{order.total}</div>
                   </div>
 
                   <div className="card-details">
                     <div className="detail-row">
                       <div className="detail-icon"><MapPin size={16} /></div>
                       <p>{order.address}</p>
                     </div>
                     <div className="detail-row">
                       <div className="detail-icon"><Phone size={16} /></div>
                       <div>
                         <a href={`tel:${order.customerPhone}`} style={{ color: '#3b82f6', fontWeight: 800, textDecoration: 'none', fontSize: '0.95rem' }}>
                           {order.customerPhone}
                         </a>
                         {order.extraPhone && (
                           <div style={{ marginTop: '0.25rem' }}>
                             <a href={`tel:${order.extraPhone}`} style={{ color: '#64748b', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>
                               {order.extraPhone} <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Alt)</span>
                             </a>
                           </div>
                         )}
                       </div>
                     </div>
                     <div className="detail-row">
                       <div className="detail-icon"><Clock size={16} /></div>
                       <p>Ordered {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                     </div>
                   </div>
 
                   <div className="card-items" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Items to Deliver</div>
                      {order.items.map((item: any, idx: number) => (
                         <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, padding: '0.2rem 0' }}>
                            <span>{item.quantity}x {item.name}</span>
                         </div>
                      ))}
                   </div>
 
                   <div className="card-actions">
                     {activeTab === 'available' ? (
                       <>
                         {order.deliveryBoyId ? (
                           <div style={{ width: '100%' }}>
                             <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: 'white', padding: '0.75rem', borderRadius: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 800 }}>
                               <Bell size={16} className="animate-pulse" />
                               <span>Direct Offer: Sent Specifically to You</span>
                             </div>
                             <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
                               <button 
                                 className="action-btn btn-deliver"
                                 style={{ padding: '0.85rem', fontSize: '0.9rem' }}
                                 disabled={updatingId === order._id}
                                 onClick={() => handleStatusUpdate(order._id, 'out-for-delivery')}
                               >
                                 {updatingId === order._id ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> ACCEPT</>}
                               </button>
                               <button 
                                 className="action-btn"
                                 style={{ padding: '0.85rem', fontSize: '0.9rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}
                                 disabled={updatingId === order._id}
                                 onClick={() => handleStatusUpdate(order._id, 'ready-to-pickup', { deliveryBoyId: null, deliveryBoyName: null })}
                               >
                                 {updatingId === order._id ? <Loader2 className="animate-spin" size={20} /> : <><XCircle size={20} /> PASS</>}
                               </button>
                             </div>
                           </div>
                         ) : (
                           <button 
                             className="action-btn btn-pickup"
                             disabled={updatingId === order._id}
                             onClick={() => handleStatusUpdate(order._id, 'out-for-delivery')}
                           >
                             {updatingId === order._id ? <Loader2 className="animate-spin" size={20} /> : <><Bike size={20} /> PICK UP ORDER</>}
                           </button>
                         )}
                       </>
                     ) : (
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                         <button 
                           className="action-btn"
                           style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0' }}
                           onClick={() => {
                             if (!order?.coordinates?.lat || !order?.coordinates?.lng) {
                                 alert("Sorry, exact GPS coordinates are missing for this order, so the route map cannot be generated.");
                                 return;
                             }
                             setShowRouteFor(order);
                           }}
                         >
                           <Navigation size={20} /> ROUTE
                         </button>
                         <button 
                           className="action-btn btn-deliver"
                           disabled={updatingId === order._id}
                           onClick={() => {
                             const code = window.prompt("Enter 4-digit Delivery Confirmation Code from customer:");
                             if (code === null) return; // Cancelled
                             if (!code || code.length !== 4) {
                                 alert("Please enter a valid 4-digit code.");
                                 return;
                             }
                             handleStatusUpdate(order._id, 'delivered', { verificationCode: code });
                           }}
                         >
                           {updatingId === order._id ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> DONE</>}
                         </button>
                       </div>
                     )}
                   </div>
                 </div>
               ))
             )}
           </motion.div>
         </AnimatePresence>
       </main>
 
       {/* Route Map Modal */}
       {showRouteFor && settings && (
         <DeliveryRouteMap 
           restaurantLoc={{
             lat: settings.restaurantLat || 17.4348,
             lng: settings.restaurantLng || 82.2270,
             name: settings.restaurantName || "Restaurant"
           }}
           customerLoc={{
             lat: showRouteFor.coordinates.lat,
             lng: showRouteFor.coordinates.lng,
             name: showRouteFor.customerName,
             address: showRouteFor.address
           }}
           onClose={() => setShowRouteFor(null)}
         />
       )}
     </div>
   );
 }
