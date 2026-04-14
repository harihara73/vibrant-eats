"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminMobileHeader from "@/components/AdminMobileHeader";
import { 
  ShoppingBag, 
  Users, 
  DollarSign, 
  TrendingUp,
  Loader2,
  Calendar,
  ArrowUpRight,
  Package
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface Stats {
  totalRevenue: string;
  activeOrders: string;
  totalCustomers: string;
  dailyGrowth: string;
}

interface Order {
  _id: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

interface RevenueData {
  date: string;
  amount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      
      if (res.ok) {
        setStats(data.stats || null);
        setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);
        setRevenueData(Array.isArray(data.revenueData) ? data.revenueData : []);
      } else if (res.status === 401) {
        setError("Unauthorized: Your session has expired. Please log in again.");
      } else {
        setError(data.error || "Failed to fetch dashboard data. Database may be unreachable.");
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data");
      setError("Network error: Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: "Total Revenue", value: stats.totalRevenue, icon: DollarSign, color: "#ef4444", trend: "+12%" },
    { label: "Active Orders", value: stats.activeOrders, icon: ShoppingBag, color: "#3b82f6", trend: "Live" },
    { label: "Total Customers", value: stats.totalCustomers, icon: Users, color: "#10b981", trend: "+5%" },
    { label: "Daily Growth", value: stats.dailyGrowth, icon: TrendingUp, color: "#f59e0b", trend: "Today" },
  ] : [];

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="main-content">
          <AdminMobileHeader />
          <div className="loader-overlay" style={{ height: '70vh', background: 'transparent' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            <p>Loading your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <main className="main-content">
          <AdminMobileHeader />
          <div className="error-banner">
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button onClick={fetchDashboardData} className="btn-primary" style={{marginTop: '1rem'}}>
              Try Again
            </button>
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
            <h1>Admin Dashboard</h1>
            <p>Overview of your restaurant's performance</p>
          </div>
          <div className="stat-trend" style={{padding: '0.5rem 1rem'}}>
            <Calendar size={18} />
            <span style={{marginLeft: '0.5rem'}}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="stats-grid">
          {statCards.map((card, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-header">
                <div 
                  className="stat-icon-wrap" 
                  style={{ background: `${card.color}15`, color: card.color }}
                >
                  <card.icon size={24} />
                </div>
                <div className="stat-trend">{card.trend}</div>
              </div>
              <div>
                <div className="stat-label">{card.label}</div>
                <div className="stat-value">{card.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', display: 'grid' }}>
          <div className="table-container" style={{ padding: '1.5rem', marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Revenue Overview</h2>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Last 7 Days</div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="var(--primary)" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="table-container" style={{ marginBottom: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Recent Activity</h2>
              <Link href="/admin/orders" className="stat-trend" style={{ textDecoration: 'none' }}>View All</Link>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order._id}>
                      <td style={{ fontWeight: 600 }}>{order.customerName}</td>
                      <td>₹{order.total}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.625rem', 
                          borderRadius: '2rem', 
                          fontSize: '0.75rem', 
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          background: order.status === 'delivered' ? '#f0fdf4' : '#fff7ed',
                          color: order.status === 'delivered' ? '#166534' : '#9a3412'
                        }}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No recent orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .loader-overlay {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: var(--text-muted);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }
        .header-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-main);
        }

        .stat-card-premium {
          background: white;
          padding: 1.5rem;
          border-radius: 1.25rem;
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 1.25rem;
          position: relative;
          overflow: hidden;
        }
        .stat-icon-wrapper {
          width: 54px;
          height: 54px;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-info {
          flex: 1;
        }
        .stat-label-text {
          font-size: 0.875rem;
          color: var(--text-muted);
          display: block;
          margin-bottom: 0.25rem;
        }
        .stat-value-text {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0;
        }
        .stat-trend {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
          border-radius: 2rem;
          background: #f8fafc;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        .card {
          background: white;
          border-radius: 1.25rem;
          padding: 1.75rem;
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
          height: 100%;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        .card-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }
        .card-subtitle {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
        .chart-legend {
          display: flex;
          gap: 1rem;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
        }

        .chart-container {
          min-height: 300px;
        }
        .empty-chart {
          height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          gap: 1rem;
          border: 2px dashed var(--border);
          border-radius: 1rem;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .activity-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
        }
        .activity-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .activity-icon {
          width: 40px;
          height: 40px;
          background: #f1f5f9;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        .activity-details {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .customer-name {
          font-weight: 600;
          font-size: 0.935rem;
        }
        .order-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .activity-amount {
          font-weight: 700;
          color: var(--text-main);
        }
        .activity-status {
          font-size: 0.625rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 0.2rem 0.5rem;
          border-radius: 0.375rem;
        }
        .status-pending { background: #fff7ed; color: #9a3412; }
        .status-delivered { background: #f0fdf4; color: #166534; }
        .status-preparing { background: #f5f3ff; color: #5b21b6; }

        .btn-text {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0;
        }
        .btn-text:hover {
          text-decoration: underline;
        }

        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .error-alert-banner {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          padding: 1rem 1.5rem;
          border-radius: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          color: #991b1b;
          box-shadow: var(--shadow);
        }
        .error-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          font-size: 0.875rem;
        }
        .btn-retry {
          background: white;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.4rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-retry:hover {
          background: #fef2f2;
        }
      `}</style>
    </div>
  );
}
