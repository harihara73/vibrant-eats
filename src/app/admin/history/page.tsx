"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminMobileHeader from "@/components/AdminMobileHeader";
import { 
  History as HistoryIcon, 
  Search, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Download,
  Loader2,
  Clock,
  User,
  ArrowUpRight
} from "lucide-react";

interface Order {
  _id: string;
  customerName: string;
  total: number;
  status: string;
  updatedAt: string;
  items: any[];
  outForDeliveryAt?: string;
  deliveredAt?: string;
}

export default function AdminHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/history");
      const data = await res.json();
      
      if (res.ok && Array.isArray(data)) {
        setOrders(data);
      } else {
        setError("Failed to fetch order history.");
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to fetch history");
      setError("Network error: Could not reach the server.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalHistoricalRevenue = orders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + o.total, 0);

  if (loading && orders.length === 0) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="main-content centered">
          <AdminMobileHeader />
          <div className="loader-overlay" style={{ height: '70vh', background: 'transparent' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <p>Loading historical records...</p>
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

        <div className="dashboard-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1>Order History</h1>
            <p>Archive of all completed and cancelled orders.</p>
          </div>
          <div className="stat-trend" style={{ padding: '0.75rem 1.25rem', background: 'white' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lifetime Revenue</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--success)' }}>₹{totalHistoricalRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="table-container" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
            <input 
              type="text" 
              placeholder="Search by customer or order ID..." 
              className="form-input" 
              style={{ paddingLeft: '2.75rem', fontSize: '0.875rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Order Info</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Timing</th>
                  <th style={{ textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>#{order._id.slice(-6)}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '24px', height: '24px', background: 'var(--admin-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                          {order.customerName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{order.customerName}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.625rem', 
                        borderRadius: '2rem', 
                        fontSize: '0.7rem', 
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: order.status === 'delivered' ? '#f0fdf4' : '#fff1f2',
                        color: order.status === 'delivered' ? '#166534' : '#991b1b'
                      }}>
                        {order.status === 'delivered' ? 'Completed' : 'Cancelled'}
                      </span>
                      {order.status !== 'delivered' && (order as any).cancellationReason && (
                        <div style={{ fontSize: '0.6rem', color: '#991b1b', marginTop: '0.4rem', fontStyle: 'italic', maxWidth: '120px' }}>
                           "{ (order as any).cancellationReason }"
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800 }}>₹{order.total}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {order.outForDeliveryAt ? (
                          <div style={{ color: 'var(--text-muted)' }}>
                            <span style={{ fontWeight: 700 }}>P:</span> {new Date(order.outForDeliveryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : <div style={{ color: '#ccc' }}>P: --:--</div>}
                        {order.deliveredAt ? (
                          <div style={{ color: 'var(--success)', fontWeight: 700 }}>
                            <span>D:</span> {new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : <div style={{ color: '#ccc' }}>D: --:--</div>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <Calendar size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        {new Date(order.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      <div style={{ opacity: 0.5 }}>
                        <HistoryIcon size={40} style={{ margin: '0 auto 1rem' }} />
                        <p>No historical records found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
