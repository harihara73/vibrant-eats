"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChefHat, 
  Bike, 
  ChevronLeft,
  Loader2,
  PackageCheck
} from "lucide-react";
import { motion } from "framer-motion";
import StatusCountdown from "@/components/StatusCountdown";

interface Order {
  _id: string;
  status: string;
  customerName: string;
  total: number;
  address: string;
  items: any[];
  createdAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  outForDeliveryAt?: string;
}

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const statusSteps = [
    { label: "Pending", icon: Clock, value: "pending" },
    { label: "Accepted", icon: CheckCircle2, value: "accepted" },
    { label: "Preparing", icon: ChefHat, value: "preparing" },
    { label: "Ready", icon: PackageCheck, value: "ready-to-pickup" },
    { label: "Out for Delivery", icon: Bike, value: "out-for-delivery" },
    { label: "Delivered", icon: Package, value: "delivered" },
  ];

  const [isTimerExpired, setIsTimerExpired] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        if (data.status !== order?.status) {
          setIsTimerExpired(false);
        }
        setOrder(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [id, order?.status]);

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    return statusSteps.findIndex(step => step.value === order.status);
  };

  const getOrderPrepTime = (order: Order) => {
    if (!order.items || order.items.length === 0) return 10;
    const times = order.items.map((item: any) => {
      if (typeof item.menuItem === 'object' && item.menuItem !== null) {
        return item.menuItem.preparationTime || 10;
      }
      return 10;
    });
    return Math.max(...times);
  };

  if (loading) {
    return (
      <div className="tracking-container centered">
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        <p>Locating your flavors...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="tracking-container centered">
        <h2>Order Not Found</h2>
        <p>We couldn't find an order with this ID. Please check your link.</p>
        <button className="btn-primary" onClick={() => router.push('/')}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="tracking-container">
      <nav className="tracking-nav">
        <button onClick={() => router.push('/')} className="back-btn">
          <ChevronLeft size={20} />
          <span>Back to Menu</span>
        </button>
        <div className="nav-logo">Vibrant<span>Eats</span></div>
      </nav>

      <main className="tracking-main">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="order-status-card"
        >
          <div className="status-header">
            <div>
              <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
              <p>Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <span className="live-pill">Live Updates</span>
          </div>

          <div className="progress-stepper">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= getCurrentStepIndex();
              const isActive = index === getCurrentStepIndex();

              return (
                <div key={step.value} className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="step-line"></div>
                  <div className="step-icon-wrapper">
                    <Icon size={20} />
                  </div>
                  <span className="step-label">{step.label}</span>
                  
                  {/* Timer Display for Active Step */}
                  {isActive && (
                    <div style={{ marginTop: '0.5rem', transform: 'scale(1.1)' }}>
                      {step.value === 'accepted' && order.acceptedAt && (
                        <StatusCountdown 
                          startTime={order.acceptedAt} 
                          durationMinutes={1} 
                          onExpire={() => setIsTimerExpired(true)} 
                        />
                      )}
                      {step.value === 'preparing' && order.preparingAt && (
                        <StatusCountdown 
                          startTime={order.preparingAt} 
                          durationMinutes={getOrderPrepTime(order)} 
                          onExpire={() => setIsTimerExpired(true)} 
                        />
                      )}
                      {step.value === 'out-for-delivery' && order.outForDeliveryAt && (
                        <StatusCountdown 
                          startTime={order.outForDeliveryAt} 
                          durationMinutes={20} 
                          onExpire={() => setIsTimerExpired(true)} 
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="status-message">
            {order.status === 'pending' && "Hang tight! The restaurant is reviewing your order."}
            {order.status === 'accepted' && (
              isTimerExpired 
                ? "Restaurant is starting preparation soon!" 
                : "Great news! Your order has been accepted."
            )}
            {order.status === 'preparing' && (
              isTimerExpired 
                ? "Almost there! Your food is taking a little longer to be perfect." 
                : "The chefs are busy crafting your delicious meal!"
            )}
            {order.status === 'ready-to-pickup' && "Your food is ready and waiting for a delivery partner!"}
            {order.status === 'out-for-delivery' && "Your food is on the way! Watch the door."}
            {order.status === 'delivered' && "Enjoy your meal! Hope you love it."}
            {order.status === 'rejected' && "Unfortunately, the restaurant couldn't fulfill this order."}
          </div>
        </motion.div>

        <div className="order-details-grid">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="details-card delivery-info"
          >
            <h4>Delivery Location</h4>
            <div className="info-row">
              <MapPin size={20} color="var(--primary)" />
              <p>{order.address}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="details-card items-summary"
          >
            <h4>Order Summary</h4>
            <div className="items-list">
              {order.items.map((item, i) => (
                <div key={i} className="item-row">
                  <span>{item.quantity}x {item.name}</span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="total-row">
                <span>Total Amount Paid (COD)</span>
                <span>₹{order.total}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <style jsx>{`
        .tracking-container {
          min-height: 100vh;
          background: #f8fafc;
          padding: 0 1.5rem 5rem;
        }
        .tracking-container.centered {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: var(--text-muted);
        }
        
        .tracking-nav {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem 0;
        }
        .nav-logo { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
        .nav-logo span { color: var(--primary); }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--text-muted);
          font-weight: 600;
          cursor: pointer;
        }

        .tracking-main {
          max-width: 800px;
          margin: 0 auto;
        }

        .order-status-card {
          background: white;
          padding: 2.5rem;
          border-radius: 2rem;
          box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.05);
          margin-bottom: 2rem;
          text-align: center;
        }
        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          text-align: left;
          margin-bottom: 3rem;
        }
        .status-header h3 { font-size: 1.5rem; font-weight: 800; }
        .status-header p { color: var(--text-muted); }
        .live-pill {
          background: #fef2f2;
          color: var(--primary);
          padding: 0.4rem 0.8rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .live-pill::before {
          content: "";
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        .progress-stepper {
          display: flex;
          justify-content: space-between;
          position: relative;
          margin-bottom: 3rem;
        }
        .step-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .step-icon-wrapper {
          width: 48px;
          height: 48px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          transition: all 0.3s ease;
          margin-bottom: 0.75rem;
          border: 2px solid white;
        }
        .step-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; }
        
        .step-line {
          position: absolute;
          top: 24px;
          left: -50%;
          width: 100%;
          height: 3px;
          background: #f1f5f9;
          z-index: -1;
        }
        .step-item:first-child .step-line { display: none; }

        /* Icon States */
        .step-item.completed .step-icon-wrapper { background: #dcfce7; color: #166534; }
        .step-item.completed .step-line { background: #10b981; }
        .step-item.active .step-icon-wrapper { 
          background: var(--primary); 
          color: white; 
          transform: scale(1.2);
          box-shadow: 0 0 20px rgba(255, 75, 43, 0.3);
        }
        .step-item.active .step-label { color: var(--primary); }

        .status-message {
          font-weight: 600;
          color: var(--text-main);
          font-size: 1.125rem;
        }

        .order-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .details-card {
          background: white;
          padding: 1.5rem;
          border-radius: 1.5rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
        }
        .details-card h4 { margin-bottom: 1rem; font-weight: 700; color: var(--text-muted); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .info-row { display: flex; gap: 1rem; align-items: flex-start; }
        .info-row p { font-weight: 600; font-size: 0.95rem; line-height: 1.5; }

        .items-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .item-row { display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 500; }
        .total-row { 
          margin-top: 0.75rem; 
          padding-top: 0.75rem; 
          border-top: 1px dashed var(--border);
          display: flex;
          justify-content: space-between;
          font-weight: 800;
          color: var(--text-main);
        }

        @media (max-width: 640px) {
          .tracking-container { padding: 0 1rem 3rem; }
          .tracking-nav { padding: 1.5rem 0; }
          .nav-logo { font-size: 1.25rem; }
          
          .order-status-card { padding: 1.5rem; border-radius: 1.5rem; margin-bottom: 1.5rem; }
          .status-header { margin-bottom: 2rem; flex-direction: column; gap: 1rem; }
          .status-header h3 { font-size: 1.25rem; }
          
          .progress-stepper { 
            flex-direction: column; 
            align-items: flex-start; 
            gap: 1.5rem; 
            margin-bottom: 2rem;
            padding-left: 0.5rem;
          }
          .step-item { 
            flex-direction: row; 
            gap: 1rem; 
            width: 100%; 
            justify-content: flex-start;
          }
          .step-icon-wrapper { width: 36px; height: 36px; margin-bottom: 0; }
          .step-icon-wrapper :global(svg) { width: 16px; height: 16px; }
          .step-label { font-size: 0.85rem; display: block; }
          
          .step-line { 
            left: 18px; 
            top: -1.5rem; 
            width: 2px; 
            height: 1.5rem; 
          }
          .step-item.active .step-icon-wrapper { transform: scale(1.1); }
          
          .order-details-grid { grid-template-columns: 1fr; gap: 1rem; }
          .details-card { padding: 1.25rem; border-radius: 1.25rem; }
          .status-message { font-size: 1rem; }
        }
      `}</style>
    </div>
  );
}
