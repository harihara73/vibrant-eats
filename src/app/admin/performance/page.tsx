"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminMobileHeader from "@/components/AdminMobileHeader";
import { 
  TrendingUp, 
  Bike, 
  Calendar, 
  Award, 
  ChevronRight,
  Loader2,
  Trophy,
  DollarSign,
  X,
  Clock,
  MapPin,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PerformanceReport {
  _id: string;
  name: string;
  totalOrders: number;
  totalEarnings: number;
  lastDelivery: string;
}

export default function PerformancePage() {
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Drill-down State
  const [selectedBoy, setSelectedBoy] = useState<PerformanceReport | null>(null);
  const [detailedOrders, setDetailedOrders] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchPerformance();
  }, [selectedDate]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/performance?date=${selectedDate}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error("Failed to fetch performance");
    } finally {
      setLoading(false);
    }
  };

  const handleBoyClick = async (boy: PerformanceReport) => {
    setSelectedBoy(boy);
    setDetailLoading(true);
    try {
       const res = await fetch(`/api/admin/performance/details?id=${boy._id}&date=${selectedDate}`);
       if (res.ok) {
         const data = await res.json();
         setDetailedOrders(data);
       }
    } catch (err) {
       console.error("Failed to fetch boy details");
    } finally {
       setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="main-content">
          <AdminMobileHeader />
          <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Calculating daily stats...</p>
          </div>
        </main>
      </div>
    );
  }

  const topPerformer = reports[0];

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="main-content">
        <AdminMobileHeader />
        
        <div className="dashboard-header">
          <div>
            <h1>Team Performance</h1>
            <p>Daily tracking of your delivery partners.</p>
          </div>
          <div className="date-picker-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
             <Calendar size={18} color="var(--primary)" style={{ position: 'absolute', left: '1rem', pointerEvents: 'none' }} />
             <input 
               type="date" 
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="performance-date-input"
               style={{
                 background: 'white',
                 padding: '0.6rem 1rem 0.6rem 2.75rem',
                 borderRadius: '2rem',
                 border: '1px solid var(--border)',
                 fontWeight: 800,
                 fontSize: '0.9rem',
                 color: 'var(--text-main)',
                 cursor: 'pointer',
                 outline: 'none',
                 transition: 'all 0.3s ease'
               }}
             />
          </div>
        </div>

        {/* Hero Card for Top Performer */}
        {topPerformer && (
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="stat-card" 
             style={{ 
               background: 'linear-gradient(135deg, #1e1b4b, #312e81)', 
               color: 'white', 
               padding: '2rem', 
               marginBottom: '2rem',
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               overflow: 'hidden',
               position: 'relative'
             }}
          >
             <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                   <div style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '0.5rem', borderRadius: '0.75rem' }}>
                      <Trophy size={20} color="#fbbf24" />
                   </div>
                   <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fbbf24' }}>Top Performer Today</span>
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>{topPerformer.name}</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Completed {topPerformer.totalOrders} deliveries on this day!</p>
             </div>
             
             <div style={{ textAlign: 'right', position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>₹{topPerformer.totalEarnings.toLocaleString()}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.7 }}>Revenue Handled</div>
             </div>

             <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }}>
                <Award size={180} />
             </div>
          </motion.div>
        )}

        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {reports.map((boy, i) => (
            <motion.div 
               key={boy._id}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
               whileHover={{ y: -5, cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
               onClick={() => handleBoyClick(boy)}
               className="stat-card"
               style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', transition: 'box-shadow 0.3s ease' }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <div style={{ width: 44, height: 44, background: '#f8fafc', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', color: 'var(--primary)' }}>
                        {boy.name.charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{boy.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Member since 2024</span>
                     </div>
                  </div>
                  <div style={{ background: '#f0fdf4', color: '#166534', padding: '0.25rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                     ACTIVE
                  </div>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        <Bike size={14} /> Total Orders
                     </div>
                     <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{boy.totalOrders}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        <DollarSign size={14} /> Revenue
                     </div>
                     <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>₹{boy.totalEarnings}</div>
                  </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Last delivery: {new Date(boy.lastDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <ChevronRight size={18} color="var(--border)" />
               </div>
            </motion.div>
          ))}

          {reports.length === 0 && !loading && (
            <div style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', background: 'white', borderRadius: '1.5rem', border: '2px dashed var(--border)' }}>
               <TrendingUp size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
               <h3 style={{ color: 'var(--text-muted)' }}>No performance data found</h3>
               <p>Select another date or check back after deliveries are completed.</p>
            </div>
          )}
        </div>
      </main>

      {/* Detail Drill-down Modal */}
      <AnimatePresence>
         {selectedBoy && (
            <div 
               style={{ 
                  position: 'fixed', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  zIndex: 2000, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  padding: '1rem'
               }}
            >
               <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedBoy(null)}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
               />
               
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  style={{ 
                     background: 'white', 
                     width: '100%', 
                     maxWidth: '600px', 
                     borderRadius: '2rem', 
                     overflow: 'hidden', 
                     position: 'relative', 
                     zIndex: 2,
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                     display: 'flex', 
                     flexDirection: 'column',
                     maxHeight: '85vh'
                  }}
               >
                  {/* Modal Header */}
                  <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 44, height: 44, background: 'var(--primary)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>
                           {selectedBoy.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                           <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{selectedBoy.name}</h3>
                           <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{detailedOrders.length} DELIVERIES COMPLETED ON {new Date(selectedDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                        </div>
                     </div>
                     <button onClick={() => setSelectedBoy(null)} style={{ background: 'white', border: '1px solid var(--border)', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <X size={20} />
                     </button>
                  </div>

                  {/* Modal Content */}
                  <div style={{ padding: '1.5rem 2rem', overflowY: 'auto' }}>
                     {detailLoading ? (
                        <div style={{ padding: '4rem 0', textAlign: 'center' }}>
                           <Loader2 className="animate-spin" size={32} color="var(--primary)" />
                           <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Fetching order details...</p>
                        </div>
                     ) : detailedOrders.length === 0 ? (
                        <div style={{ padding: '4rem 0', textAlign: 'center', opacity: 0.5 }}>
                           <TrendingUp size={48} color="var(--border)" style={{ margin: '0 auto 1rem' }} />
                           <p style={{ fontWeight: 800 }}>No delivery logs available.</p>
                        </div>
                     ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                           {detailedOrders.map((order, oi) => (
                              <div key={order._id} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                       <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>ORDER ID: #{order._id.slice(-6).toUpperCase()}</span>
                                       <h4 style={{ margin: '0.1rem 0 0 0', fontWeight: 900 }}>{order.customerName}</h4>
                                    </div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>₹{order.total}</div>
                                 </div>

                                 <div style={{ padding: '0.5rem 0.75rem', background: 'white', borderRadius: '0.75rem', border: '1px solid #eef2f6' }}>
                                    {order.items.map((item: any, ii: number) => (
                                       <div key={ii} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'flex', gap: '0.4rem' }}>
                                          <span style={{ color: 'var(--primary)' }}>{item.quantity}x</span>
                                          <span>{item.name}</span>
                                       </div>
                                    ))}
                                 </div>
                                 
                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '0.75rem 0', borderTop: '1px dashed var(--border)' }}>
                                    <div>
                                       <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Pickup</div>
                                       <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                          <Clock size={14} color="var(--text-muted)" /> {order.outForDeliveryAt ? new Date(order.outForDeliveryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                       </div>
                                    </div>
                                    <div>
                                       <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Delivery</div>
                                       <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981' }}>
                                          <CheckCircle2 size={14} /> {order.deliveredAt ? new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                       </div>
                                    </div>
                                 </div>

                                 {order.outForDeliveryAt && order.deliveredAt && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', opacity: 0.8 }}>
                                       Completed in {Math.round((new Date(order.deliveredAt).getTime() - new Date(order.outForDeliveryAt).getTime()) / 60000)} minutes
                                    </div>
                                 )}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  {/* Modal Footer */}
                  <div style={{ padding: '1.25rem 2rem', background: '#f8fafc', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
                     <button 
                        onClick={() => setSelectedBoy(null)} 
                        style={{ background: 'var(--secondary)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '1rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                     >
                        Close Details
                     </button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
