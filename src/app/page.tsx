"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingBasket, 
  MapPin, 
  Search, 
  Plus, 
  Minus, 
  X,
  ChevronRight,
  Navigation,
  User,
  History,
  LogOut,
  ArrowRight,
  ShieldCheck,
  PowerOff,
  Clock,
  Pencil,
  Globe,
  Link as LinkIcon
} from "lucide-react";
import Link from "next/link";
import LoginModal from "@/components/LoginModal";
import ProfileModal from "@/components/ProfileModal";
import TopInstallButton from "@/components/TopInstallButton";
import dynamic from "next/dynamic";
import { haversineDistance, estimateDeliveryMinutes } from "@/lib/distance";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { 
  ssr: false,
  loading: () => <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '1rem', color: '#94a3b8', fontWeight: 600 }}>Loading Map...</div>
});

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  discount: number;
  dietaryType: string;
}


interface Location {
  lat: number;
  lng: number;
}

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [address, setAddress] = useState("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showCheckoutMap, setShowCheckoutMap] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCartPrompt, setShowCartPrompt] = useState(false);
  const [isAnimatingCart, setIsAnimatingCart] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", extraPhone: "" });
  const [locationLoading, setLocationLoading] = useState(false);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState("Restaurant Shutdown, come again");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [restaurantCoords, setRestaurantCoords] = useState({ lat: 17.4348, lng: 82.2270 });
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(5);
  const [deliveryCharges, setDeliveryCharges] = useState<Record<number, number>>({ 5: 15, 10: 25, 15: 35, 20: 50 });
  const [deliveryDiscount, setDeliveryDiscount] = useState(0);
  const [addressEditIndex, setAddressEditIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { 
    cart, 
    addToCart, 
    updateQuantity, 
    total, 
    subtotal, 
    totalDiscount, 
    clearCart 
  } = useCart();

  const cartMap = useMemo(() => {
    const map: Record<string, any> = {};
    cart.forEach(item => { map[item._id] = item; });
    return map;
  }, [cart]);

  useEffect(() => {
    if (session?.user) {
        setCustomerInfo({ 
            name: session.user.name || "", 
            phone: (session.user as any).phone || "",
            extraPhone: ""
        });
        if ((session.user as any).address) {
            setAddress((session.user as any).address);
        }

        // Auto-open modal if phone is missing (e.g. after Google Login)
        if (!(session.user as any).phone) {
            setIsLoginModalOpen(true);
        }
    }
  }, [session]);

  useEffect(() => {
    const fetchAllData = () => {
      // Fetch Restaurant Status
      fetch("/api/admin/settings")
        .then(res => {
          if (!res.ok) return null;
          return res.json();
        })
        .then(data => {
          if (data && typeof data.isLive === 'boolean') {
            setIsRestaurantOpen(prev => {
              // If this is the FIRST fetch after a refresh, do not reload
              if (prev === null) return data.isLive;

              // If the status CHANGED (either open->closed or closed->open), reload once
              if (prev !== data.isLive) {
                window.location.reload();
              }
              return data.isLive;
            });
            if (data.shutdownMessage) setStatusMessage(data.shutdownMessage);
            // Pick up restaurant location
            if (data.restaurantLat) setRestaurantCoords({ lat: data.restaurantLat, lng: data.restaurantLng });
            if (data.deliveryRadiusKm) setDeliveryRadiusKm(data.deliveryRadiusKm);
            // Load delivery charges
            if (data.deliveryCharges) {
              const raw = data.deliveryCharges as Record<string, number>;
              const parsed: Record<number, number> = {};
              Object.entries(raw).forEach(([k, v]) => { parsed[Number(k)] = Number(v); });
              setDeliveryCharges(parsed);
            }
            if (data.deliveryDiscount != null) setDeliveryDiscount(data.deliveryDiscount);
            if (data.categories && data.categories.length > 0) setDynamicCategories(data.categories);
          } else {
            // Default to live if API fails or returns no data
            setIsRestaurantOpen(true);
          }
        })
        .catch(err => {
          console.warn("Status fetch error (defaulting to Live):", err);
          setIsRestaurantOpen(true);
        });

      // Fetch Menu Items
      fetch("/api/menu")
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          const menuItems = Array.isArray(data) ? data : [];
          setItems(menuItems);
          if (menuItems.length === 0) {
            console.warn("Menu is empty or API returned invalid format");
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          setItems([]);
          setLoading(false);
          // Only show fatal error if it's the initial load
          if (items.length === 0) {
             setStatusMessage(`⚠️ Menu connection error: ${err.message}. Please check database status.`);
          }
        });
    };

    fetchAllData();
    
    // Automatic Status Check every 5 seconds
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddToCart = (item: MenuItem) => {
    if (!isRestaurantOpen) {
      alert("Store is currently closed. We are not accepting new orders.");
      return;
    }
    addToCart(item);
    setIsAnimatingCart(true);
    setShowCartPrompt(true);
    setTimeout(() => setIsAnimatingCart(false), 500);
    setTimeout(() => setShowCartPrompt(false), 4000);
  };

  const handleGetLocation = (silent = false) => {
    if ("geolocation" in navigator) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationLoading(false);
          if (!silent) alert("GPS Coordinates Captured! Our rider will find you exactly.");
        },
        (error) => {
          setLocationLoading(false);
          if (!silent) alert("Could not get location. Please enter your address manually.");
        }
      );
    }
  };

  // Recompute delivery distance whenever the user's location changes
  const deliveryCalc = useMemo(() => {
    if (!location) return { info: null, error: "", charge: 0 };
    
    const dist = haversineDistance(restaurantCoords.lat, restaurantCoords.lng, location.lat, location.lng);
    const mins = estimateDeliveryMinutes(dist);
    const info = { distanceKm: dist, minutes: mins };
    
    let error = "";
    let charge = 0;
    
    if (dist > deliveryRadiusKm) {
      error = `⚠️ You are ${dist.toFixed(1)} km away. We only deliver within ${deliveryRadiusKm} km.`;
    } else {
      // Find which tier applies
      const activeTier = [5, 10, 15, 20].find(t => dist <= t) ?? 20;
      const base = deliveryCharges[activeTier] ?? 0;
      charge = deliveryDiscount > 0 ? Math.round(base * (1 - deliveryDiscount / 100)) : base;
    }
    
    return { info, error, charge };
  }, [location, restaurantCoords, deliveryRadiusKm, deliveryCharges, deliveryDiscount]);

  const deliveryInfo = deliveryCalc.info;
  const distanceError = deliveryCalc.error;
  const deliveryChargeAmount = deliveryCalc.charge;

  const handlePlaceOrder = async () => {
    if (!isRestaurantOpen) {
      alert("Store is currently closed. Cannot place order.");
      return;
    }
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Please provide your name and phone number!");
      return;
    }
    if (!address) {
      alert("Please select a delivery address from your book or add one!");
      return;
    }
    if (!location) {
      alert("Please allow GPS location to help our riders find you!");
      return;
    }
    if (distanceError) {
      alert(distanceError);
      return;
    }

    const orderData = {
      customerId: (session?.user as any)?.id || null,
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      extraPhone: customerInfo.extraPhone,
      address: address,
      coordinates: location || { lat: 0, lng: 0 },
      items: cart.map(item => ({
        menuItem: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal,
      total: total + deliveryChargeAmount,
      deliveryCharge: deliveryChargeAmount,
      status: "pending"
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const newOrder = await res.json();
        clearCart();
        setIsCheckingOut(false);
        setIsCartOpen(false);
        router.push(`/order-tracking/${newOrder._id}`);
      }
    } catch (err) {
      alert("Failed to place order.");
    }
  };

  return (
    <div className="page-root">
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccess={() => console.log("Logged in!")}
      />


      <nav className="navbar">
        <div className="nav-logo">Vibrant<span>Eats</span></div>
        <div className="nav-actions">
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <TopInstallButton />
              <div className="account-pill">
                <span className="user-name">{session?.user?.name?.split(' ')[0] || "User"}</span>
                <div className="pill-actions">
                  <button 
                    className="btn-icon-gourmet" 
                    onClick={() => setIsProfileModalOpen(true)}
                    title="Profile Settings"
                  >
                    <User size={18} />
                  </button>
                  <button 
                    className="btn-icon-gourmet" 
                    onClick={() => router.push('/my-orders')}
                    title="My Orders"
                  >
                    <History size={18} />
                  </button>
                  <button 
                    className="btn-icon-gourmet danger" 
                    onClick={() => signOut()}
                    title="Sign Out"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="nav-guest-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <TopInstallButton />
              <button className="login-btn" onClick={() => setIsLoginModalOpen(true)}>
                <User size={18} />
                Login
              </button>
            </div>
          )}

          <button className="location-bar" onClick={() => handleGetLocation(false)}>
            <MapPin size={18} color="var(--accent)" />
            <span>{location ? "GPS Active" : "Deliver to Me"}</span>
          </button>
          
          <motion.button 
            className="cart-trigger" 
            onClick={() => setIsCartOpen(true)}
            animate={isAnimatingCart ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <ShoppingBasket size={30} />
            {cart.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="cart-count"
              >
                {cart.length}
              </motion.span>
            )}
            <AnimatePresence>
               {isAnimatingCart && (
                 <motion.span 
                   initial={{ opacity: 0, y: 0 }}
                   animate={{ opacity: 1, y: -40 }}
                   exit={{ opacity: 0 }}
                   className="plus-one"
                 >+1</motion.span>
               )}
            </AnimatePresence>
          </motion.button>
        </div>
      </nav>

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>

        <motion.div key="main-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', flex: 1 }}>
          {/* Premium Sticky Cart Bar */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div
            initial={{ opacity: 0, y: -32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -32 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="cart-float-bar"
            onClick={() => setIsCartOpen(true)}
          >
            {/* Glow pulse behind icon */}
            <div className="cart-bar-icon-wrap">
              <div className="cart-bar-glow" />
              <ShoppingBasket size={28} className="cart-bar-icon" />
              <span className="cart-bar-badge">{cart.reduce((a,i)=>a+i.quantity,0)}</span>
            </div>

            <div className="cart-bar-info">
              <span className="cart-bar-label">Your Cart</span>
              <span className="cart-bar-items">
                {cart.length} {cart.length === 1 ? 'item' : 'items'} &nbsp;&middot;&nbsp; {cart.map(i => i.name.split(' ')[0]).join(', ')}
              </span>
            </div>

            <div className="cart-bar-right">
              <span className="cart-bar-price">₹{Math.round(total)}</span>
              <button className="cart-bar-btn">
                View Cart
                <ChevronRight size={17} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <header className="hero">
        <div className="hero-content">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-title"
          >
            {session?.user?.name ? (
              <>Hi, {session.user.name.split(' ')[0]}! <br />Delicious Food is <span>coming.</span></>
            ) : (
              <>Delicious Food <br />is <span>coming.</span></>
            )}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Ordered directly from the restaurant. No middleman, no extra commission.
          </motion.p>
          <motion.div 
            className="hero-search-wrapper"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="gourmet-search">
              <Search size={22} className="search-icon" color="var(--accent)" />
              <input 
                type="text" 
                placeholder="Search for your favorite dish..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="search-pill-btn">Search</button>
            </div>
          </motion.div>
        </div>
      </header>

      <AnimatePresence>
        {isRestaurantOpen === false && (
          <motion.div 
            key="shutdown"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="shutdown-section"
          >
            <div className="shutdown-card">
              <div className="shutdown-icon">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <PowerOff size={32} />
                </motion.div>
              </div>
              <div className="shutdown-info">
                <h2 className="shutdown-title">Kitchen is Offline</h2>
                <p className="shutdown-text">{statusMessage}</p>
              </div>
              <div className="shutdown-footer">
                <Clock size={16} />
                <span>Check back soon!</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Grid */}
      <main className="menu-section">
        <div className="section-header">
           <h2>Popular Dishes</h2>
           <p>Selected gourmet treats for you</p>
        </div>

        {/* Category Navigation */}
        <div className="category-nav-wrapper">
          <div className="category-scroll">
            {["All", ...dynamicCategories].map(cat => (
              <button 
                key={cat} 
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="filter-controls">
            <button 
              className={`veg-toggle ${isVegOnly ? 'active' : ''}`}
              onClick={() => setIsVegOnly(!isVegOnly)}
            >
              <div className="veg-indicator" />
              <span>Veg Only</span>
            </button>
          </div>
        </div>

        <div className="menu-container">
          {loading ? (
            <div className="loading-state">
              <p>Preparing the menu...</p>
            </div>
          ) : (
            dynamicCategories.filter(cat => selectedCategory === "All" || selectedCategory === cat).map(category => {
              const categoryItems = items
                .filter(item => item.category === category)
                .filter(item => !isVegOnly || item.dietaryType === "Veg")
                .filter(item => {
                  if (!searchQuery) return true;
                  const query = searchQuery.toLowerCase();
                  return item.name.toLowerCase().includes(query) || 
                         item.description.toLowerCase().includes(query);
                })
                .sort((a, b) => a.name.localeCompare(b.name));

              if (categoryItems.length === 0) return null;

              return (
                <section key={category} className="category-section">
                  <div className="category-header-wrap">
                    <h2 className="category-section-title">{category}</h2>
                    <div className="category-title-line" />
                  </div>
                  
                  <div className="customer-menu-grid">
                    {categoryItems.map(item => {
                      const cartItem = cartMap[item._id];
                      return (
                        <motion.div 
                          key={item._id} 
                          className={`customer-menu-card ${!item.isAvailable ? 'out-of-stock' : ''}`}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                        >
                          <div className="item-image">
                             {item.image && <img src={item.image} alt={item.name} loading="lazy" />}
                            {item.discount > 0 && <span className="discount-tag">{item.discount}% OFF</span>}
                            <div className="dietary-badge" style={{ borderColor: item.dietaryType === 'Veg' ? '#22c55e' : '#ef4444' }}>
                              <div className="dietary-circle" style={{ backgroundColor: item.dietaryType === 'Veg' ? '#22c55e' : '#ef4444' }} />
                            </div>
                            {!item.isAvailable && <div className="out-of-stock-overlay">Out of Stock</div>}
                          </div>
                          <div className="item-info">
                            <div className="item-header">
                              <div>
                                <div className="item-category-tag">{item.category}</div>
                                <h3>{item.name}</h3>
                              </div>
                              <span className="item-price">₹{item.price}</span>
                            </div>
                            <p className="item-desc">{item.description}</p>
                          <div className="item-footer">
                            {!item.isAvailable || !isRestaurantOpen ? (
                              <button className="add-btn disabled" disabled>
                                <PowerOff size={16} />
                                {isRestaurantOpen ? 'Unavailable' : 'Closed'}
                              </button>
                            ) : cartItem ? (
                              <div className="quantity-controls">
                                <button onClick={() => updateQuantity(item._id, -1)}>
                                  <Minus size={16} />
                                </button>
                                <span>{cartItem.quantity}</span>
                                <button onClick={() => updateQuantity(item._id, 1)}>
                                  <Plus size={16} />
                                </button>
                              </div>
                            ) : (
                              <button className="add-btn" onClick={() => handleAddToCart(item)}>
                                <Plus size={18} />
                                Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  </div>
                </section>
              );
            })
          )}

          {!loading && searchQuery && items.length > 0 && !items.some(item => {
              const query = searchQuery.toLowerCase();
              const nameMatches = item.name.toLowerCase().includes(query);
              const descMatches = item.description.toLowerCase().includes(query);
              const categoryMatch = selectedCategory === "All" || item.category === selectedCategory;
              const vegMatch = !isVegOnly || item.dietaryType === "Veg";
              return (nameMatches || descMatches) && categoryMatch && vegMatch;
          }) && (
            <div className="no-results-state">
              <div className="no-results-icon">
                <Search size={48} color="#94a3b8" />
              </div>
              <h3>No dishes found</h3>
              <p>We couldn't find anything matching "{searchQuery}". Try a different term or check your spelling.</p>
              <button className="btn-secondary" onClick={() => setSearchQuery("")}>
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Cart Drawer */}
      <AnimatePresence>
      {isCartOpen && (
        <div className="drawer-overlay" onClick={() => setIsCartOpen(false)}>
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="cart-drawer" 
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="drawer-header">
              {isCheckingOut ? (
                <button className="back-to-cart-btn" onClick={() => setIsCheckingOut(false)}>
                  <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                  Back
                </button>
              ) : (
                <div className="drawer-title-group">
                  <div className="drawer-cart-icon">
                    <ShoppingBasket size={24} />
                    {cart.length > 0 && <span className="drawer-icon-badge">{cart.reduce((a,i)=>a+i.quantity,0)}</span>}
                  </div>
                  <div>
                    <h2>Your Cart</h2>
                    <p className="drawer-subtitle">{cart.length} {cart.length===1?'item':'items'} ready to order</p>
                  </div>
                </div>
              )}
              {isCheckingOut && <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Delivery Details</h2>}
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <div className="drawer-content">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <ShoppingBasket size={56} color="#e2e8f0" />
                  <p>Your cart is empty</p>
                  <button className="btn-primary" onClick={() => setIsCartOpen(false)} disabled={!isRestaurantOpen}>
                    {isRestaurantOpen ? 'Browse Menu' : 'Store is Closed'}
                  </button>
                </div>
              ) : (
                <>
                  {!isCheckingOut ? (
                    <div className="cart-items">
                      {cart.map(item => (
                        <div key={item._id} className="cart-item">
                          <div className="cart-item-img-wrap">
                            <ShoppingBasket size={18} />
                          </div>
                          <div className="cart-item-info">
                            <span className="cart-item-name">{item.name}</span>
                            <span className="cart-item-price">₹{Math.round(item.price * item.quantity)}</span>
                          </div>
                          <div className="cart-qty-controls">
                            <button className="cart-qty-btn" onClick={() => updateQuantity(item._id, -1)}>
                              <Minus size={13} strokeWidth={3} />
                            </button>
                            <span className="cart-qty-num">{item.quantity}</span>
                            <button className="cart-qty-btn" onClick={() => updateQuantity(item._id, 1)}>
                              <Plus size={13} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="checkout-form-wrap animate-slide-up">
                      <div className="checkout-form">
                        <div className="gourmet-input-group">
                          <label>Recipient Name</label>
                          <input 
                            className="input-gourmet"
                            type="text" 
                            placeholder="e.g. John Doe"
                            value={customerInfo.name}
                            onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                            style={{ padding: '0.875rem 1rem', fontSize: '0.95rem' }}
                          />
                        </div>

                        <div className="gourmet-input-group">
                          <label>Phone Number</label>
                          <input 
                            className="input-gourmet"
                            type="tel" 
                            placeholder="e.g. 98765 43210"
                            value={customerInfo.phone}
                            onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                            style={{ padding: '0.875rem 1rem', fontSize: '0.95rem' }}
                          />
                        </div>

                        <div className="gourmet-input-group">
                          <label>Alternate Phone (Optional)</label>
                          <input 
                            className="input-gourmet"
                            type="tel" 
                            placeholder="e.g. 98765 43210"
                            value={customerInfo.extraPhone}
                            onChange={e => setCustomerInfo({...customerInfo, extraPhone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                            style={{ padding: '0.875rem 1rem', fontSize: '0.95rem' }}
                          />
                        </div>

                        <div className="gourmet-input-group">
                          <label>Delivery Address</label>
                          {(session?.user as any)?.addresses?.length > 0 ? (
                            <div className="address-selector-grid">
                              {(session?.user as any)?.addresses?.map((addr: any, idx: number) => {
                                const addrText = typeof addr === 'string' ? addr : addr.text;
                                return (
                                    <button 
                                      key={idx}
                                      className={`address-option ${address === addrText ? 'selected' : ''}`}
                                      style={{ position: 'relative', overflow: 'hidden' }}
                                      onClick={() => {
                                        setAddress(addrText);
                                        if (typeof addr !== 'string' && addr.lat && addr.lng) {
                                          setLocation({ lat: addr.lat, lng: addr.lng });
                                        }
                                      }}
                                    >
                                      <div className="option-indicator" />
                                      <div className="option-text-group" style={{ flex: 1 }}>
                                        <span className="option-text">{addrText}</span>
                                        {typeof addr !== 'string' && addr.lat && <span className="option-gps-tag">GPS Pinned</span>}
                                      </div>
                                      <div 
                                        className="edit-addr-action"
                                        onClick={(e) => {
                                           e.stopPropagation();
                                           setAddressEditIndex(idx);
                                           setIsProfileModalOpen(true);
                                        }}
                                        style={{ background: '#f8fafc', padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', color: '#64748b' }}
                                      >
                                         <Pencil size={14} />
                                      </div>
                                    </button>
                                );
                              })}
                              <button 
                                type="button"
                                className="btn-add-new-addr"
                                onClick={() => setIsProfileModalOpen(true)}
                              >
                                <Plus size={16} />
                                Add New Address
                              </button>
                            </div>
                          ) : (
                            <textarea 
                              className="input-gourmet-area"
                              placeholder="House No, Street, Landmark..." 
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              required
                            />
                          )}
                        </div>

                        <div className="location-actions-v2">
                          <div className="location-toggles">
                            <button 
                              type="button"
                              className={`geo-tool-btn ${location ? 'success' : ''} ${locationLoading ? 'loading' : ''}`} 
                              onClick={() => handleGetLocation(false)}
                              disabled={locationLoading}
                            >
                              {locationLoading ? (
                                <Navigation size={18} className="animate-spin" />
                              ) : location ? (
                                <ShieldCheck size={18} />
                              ) : (
                                <Navigation size={18} />
                              )}
                              <span>Current GPS</span>
                            </button>

                            <button 
                              type="button"
                              className={`geo-tool-btn ${showCheckoutMap ? 'active' : ''}`}
                              onClick={() => setShowCheckoutMap(!showCheckoutMap)}
                            >
                              <MapPin size={18} />
                              <span>{showCheckoutMap ? 'Hide Map' : 'Pick on Map'}</span>
                            </button>
                          </div>

                          <AnimatePresence>
                            {showCheckoutMap && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="checkout-map-wrap"
                              >
                                <MapPicker 
                                  lat={location?.lat || restaurantCoords.lat} 
                                  lng={location?.lng || restaurantCoords.lng} 
                                  onChange={(lat, lng) => setLocation({ lat, lng })}
                                />
                                <div className="checkout-coords">
                                  LAT: {location?.lat?.toFixed(4)} | LNG: {location?.lng?.toFixed(4)}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Delivery Distance Info Banner */}
                          {deliveryInfo && !distanceError && (
                            <div style={{
                              background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                              border: '1.5px solid #86efac',
                              borderRadius: '1rem',
                              padding: '0.875rem 1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '1rem',
                              marginTop: '0.5rem',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>🏍️</span>
                                <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Within Delivery Range</div>
                                  <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700 }}>Your order can be delivered!</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#166534' }}>{deliveryInfo.distanceKm.toFixed(1)} km</div>
                                  <div style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 700 }}>DISTANCE</div>
                                </div>
                                <div style={{ width: '1px', background: '#86efac' }} />
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#166534' }}>~{deliveryInfo.minutes} min</div>
                                  <div style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 700 }}>ETA</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Out of Delivery Range Error */}
                          {distanceError && (
                            <div style={{
                              background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                              border: '1.5px solid #fca5a5',
                              borderRadius: '1rem',
                              padding: '0.875rem 1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              marginTop: '0.5rem',
                            }}>
                              <span style={{ fontSize: '1.5rem' }}>🚫</span>
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#991b1b' }}>Outside Delivery Zone</div>
                                <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 700 }}>{distanceError.replace('⚠️ ', '')}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="drawer-footer">
                <div className="bill-details">
                  <div className="bill-row">
                    <span>Subtotal</span>
                    <span>₹{Math.round(subtotal)}</span>
                  </div>
                  <div className="bill-row discount">
                    <span>Discount</span>
                    <span>-₹{Math.round(totalDiscount)}</span>
                  </div>
                  {isCheckingOut && deliveryChargeAmount >= 0 && (
                    <div className="bill-row" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        🛵 Delivery
                        {deliveryDiscount > 0 && <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', fontWeight: 900, padding: '0.1rem 0.3rem', borderRadius: '0.3rem' }}>{deliveryDiscount}% OFF</span>}
                      </span>
                      <span style={{ color: deliveryChargeAmount === 0 ? '#16a34a' : 'inherit' }}>
                        {deliveryChargeAmount === 0 ? 'FREE' : `₹${deliveryChargeAmount}`}
                      </span>
                    </div>
                  )}
                  <div className="bill-row grand-total">
                    <span>Total Amount</span>
                    <span>₹{Math.round(total + (isCheckingOut ? deliveryChargeAmount : 0))}</span>
                  </div>
                </div>
                
                {isCheckingOut ? (
                  <button 
                    className="checkout-btn" 
                    onClick={handlePlaceOrder} 
                    disabled={!isRestaurantOpen || !!distanceError}
                    style={distanceError ? { background: '#ef4444', opacity: 0.7, cursor: 'not-allowed' } : {}}
                  >
                    {!isRestaurantOpen ? 'Ordering Disabled' : distanceError ? '🚫 Outside Delivery Zone' : 'Place Order (COD)'}
                  </button>
                ) : (
                  <button className="checkout-btn" onClick={() => {
                    if (!isRestaurantOpen) return;
                    setIsCheckingOut(true);
                    handleGetLocation(true);
                  }} disabled={!isRestaurantOpen}>
                    {isRestaurantOpen ? 'Proceed to Checkout' : 'Store is Closed'}
                    {isRestaurantOpen && <ChevronRight size={20} />}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
      </AnimatePresence>
        <footer className="site-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">Vibrant<span>Eats</span></div>
              <p>Experience gourmet flavors delivered directly to your doorstep with zero middleman commission.</p>
            </div>
            <div className="footer-staff">
              <h4>Staff & Management</h4>
              <nav className="staff-links">
                <Link href="/admin/dashboard" className="staff-link">
                  <ShieldCheck size={16} />
                  Admin Portal
                </Link>
                <Link href="/delivery" className="staff-link">
                  <Globe size={16} />
                  Partner Portal
                </Link>
              </nav>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} VibrantEats. Built with Excellence by harihara73.</p>
          </div>
        </footer>
          </motion.div>
      </div>

      <style jsx>{`
        .page-root {
          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
        }

        .site-footer {
          background: #020617;
          color: white;
          padding: 4rem 4% 2rem;
          margin-top: auto;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 4rem;
          margin-bottom: 4rem;
        }

        .footer-logo {
          font-size: 1.75rem;
          font-weight: 950;
          letter-spacing: -0.05em;
          margin-bottom: 1.5rem;
        }
        .footer-logo span { color: var(--accent); }
        
        .footer-brand p {
          color: #94a3b8;
          line-height: 1.6;
          font-size: 1.05rem;
          max-width: 400px;
          font-weight: 500;
        }

        .footer-staff h4 {
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          color: #64748b;
          font-weight: 900;
          margin-bottom: 1.5rem;
        }

        .staff-links {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .staff-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #f1f5f9;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .staff-link:hover {
          color: var(--accent);
          transform: translateX(5px);
        }

        .github-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.875rem 1.5rem;
          border-radius: 1.25rem;
          color: white;
          font-weight: 800;
          font-size: 0.95rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .github-link-btn:hover {
          background: white;
          color: #020617;
          transform: translateY(-3px);
          box-shadow: 0 10px 25px -5px rgba(255,255,255,0.15);
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          justify-content: center;
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .footer-content { grid-template-columns: 1fr; gap: 3rem; text-align: center; }
          .footer-brand p { margin: 0 auto 1.5rem; }
          .staff-links { align-items: center; }
          .github-link-btn { justify-content: center; }
        }

        .navbar {
          position: sticky;
          top: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 4%;
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          z-index: 100;
          gap: 0.5rem;
        }

        /* Drawer header premium */
        .drawer-title-group {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          flex: 1;
          min-width: 0;
        }
        .drawer-cart-icon {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 1.1rem;
          background: linear-gradient(135deg, #1e1b4b, #312e81);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fbbf24;
          flex-shrink: 0;
          box-shadow: 0 6px 20px rgba(30,27,75,0.3);
        }
        .drawer-icon-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #dc2626;
          color: white;
          font-size: 0.7rem;
          font-weight: 900;
          min-width: 20px;
          height: 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          padding: 0 3px;
        }
        .drawer-title-group h2 {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--secondary);
          margin: 0;
        }
        .drawer-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
          margin: 0;
        }

        .nav-logo {
          font-size: 1.6rem;
          font-weight: 900;
          color: var(--secondary);
          letter-spacing: -0.04em;
          flex-shrink: 0;
        }
        .nav-logo span { color: var(--primary); }

        .nav-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-shrink: 0;
        }

        .user-name {
          font-weight: 800;
          font-size: 0.875rem;
          color: var(--secondary);
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pill-actions {
          display: flex;
          gap: 0.4rem;
        }

        .login-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          border: 2px solid var(--border);
          padding: 0.6rem 1.25rem;
          border-radius: var(--radius-full);
          font-weight: 800;
          font-size: 0.9rem;
          color: var(--secondary);
        }
        .login-btn:hover { border-color: var(--primary); color: var(--primary); }

        .location-bar {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 1.25rem;
          background: var(--bg-alt);
          border-radius: var(--radius-full);
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--secondary);
          border: 1px solid transparent;
        }
        .location-bar:hover { border-color: var(--accent); background: white; }
        @media (max-width: 768px) {
          .location-bar span { display: none; }
          .location-bar { padding: 0.6rem; border-radius: 50%; width: 42px; height: 42px; justify-content: center; }
        }

        .cart-trigger {
          position: relative;
          background: var(--secondary);
          color: white;
          padding: 0.85rem 1.1rem;
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px -5px rgba(30, 27, 75, 0.3);
        }
        .cart-count {
          position: absolute;
          top: -7px;
          right: -7px;
          background: var(--accent);
          color: var(--secondary);
          font-size: 0.75rem;
          min-width: 24px;
          height: 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          border: 2px solid white;
        }

        .hero {
          padding: 8rem 4% 7rem;
          background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
          text-align: center;
          position: relative;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 70% 30%, rgba(251, 191, 36, 0.08), transparent 45%);
          pointer-events: none;
        }
        .hero-content {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        :global(.hero-title) {
          font-size: clamp(3.5rem, 9vw, 5.5rem) !important;
          line-height: 0.95 !important;
          margin-bottom: 2rem !important;
          color: #ffffff !important;
          font-weight: 950 !important;
          letter-spacing: -0.05em !important;
          text-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
        }
        :global(.hero-title span) { 
          color: var(--accent) !important; 
          display: inline-block !important;
          background: linear-gradient(135deg, var(--accent) 0%, #f59e0b 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
        }
        
        :global(.hero p) {
          font-size: 1.35rem !important;
          color: rgba(255, 255, 255, 0.8) !important;
          max-width: 620px !important;
          margin: 0 auto 3.5rem !important;
          font-weight: 500 !important;
          line-height: 1.5 !important;
          letter-spacing: -0.01em !important;
        }

        .hero-search-wrapper {
          max-width: 680px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.6rem;
          border-radius: 2.25rem;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        .gourmet-search {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0 0.5rem 0 1.5rem;
          background: white;
          border-radius: 1.75rem;
        }
        .search-icon { color: #94a3b8; flex-shrink: 0; }
        .gourmet-search input {
          flex: 1;
          border: none;
          font-size: 1.05rem;
          padding: 1.25rem 0;
          font-weight: 600;
          color: var(--secondary) !important;
          background: transparent;
          outline: none;
        }
        .search-pill-btn {
          background: var(--primary);
          color: white;
          padding: 0.85rem 2rem;
          border-radius: 1.5rem;
          font-weight: 800;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }
        .search-pill-btn:hover { background: var(--primary-dark); transform: scale(1.02); }

        .menu-section {
          padding: 3rem 4% 5rem;
          width: 100%;
        }
        .section-header { margin-bottom: 2.5rem; text-align: center; }
        .section-header h2 { font-size: 2.5rem; margin-bottom: 0.5rem; letter-spacing: -0.04em; }
        .section-header p { color: var(--text-muted); font-size: 1rem; font-weight: 500; }

        .category-nav-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }

        .category-scroll {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          padding: 0.5rem 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
          mask-image: linear-gradient(to right, black 85%, transparent);
        }
        .category-scroll::-webkit-scrollbar { display: none; }

        .category-pill {
          white-space: nowrap;
          padding: 0.85rem 1.75rem;
          background: white;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-lg);
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--text-muted);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: var(--shadow-sm);
        }
        .category-pill:hover { 
          border-color: var(--primary); 
          color: var(--primary); 
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .category-pill.active { 
          background: var(--secondary); 
          border-color: var(--secondary); 
          color: white; 
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.4); 
          transform: translateY(-2px) scale(1.05);
        }

        .filter-controls { flex-shrink: 0; }
        
        .veg-toggle {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          background: white;
          border: 1.5px solid var(--border);
          border-radius: 1.25rem;
          font-weight: 800;
          font-size: 0.9rem;
          color: var(--text-muted);
          transition: all 0.3s ease;
        }
        .veg-toggle.active { border-color: #22c55e; color: #166534; background: #f0fdf4; }
        
        .veg-indicator {
          width: 14px;
          height: 14px;
          border: 2px solid #22c55e;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .veg-indicator::after {
          content: '';
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
        }

        .dietary-badge {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          width: 24px;
          height: 24px;
          background: white;
          border: 2px solid;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .dietary-circle {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .item-category-tag {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
        }

        .category-section {
          margin-bottom: 5rem;
          scroll-margin-top: 100px;
        }
        .category-header-wrap {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 3rem;
        }
        .category-section-title {
          font-size: 2rem;
          font-weight: 900;
          color: var(--secondary);
          white-space: nowrap;
          letter-spacing: -0.02em;
        }
        .category-title-line {
          height: 2px;
          flex: 1;
          background: linear-gradient(to right, var(--border), transparent);
          border-radius: 2px;
        }

        .customer-menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2.5rem;
        }

        .customer-menu-card {
          background: white;
          border-radius: var(--radius-xl);
          overflow: hidden;
          border: 1px solid var(--border);
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          height: 100%;
          box-shadow: var(--shadow-sm);
        }
        .customer-menu-card:hover {
          transform: translateY(-12px);
          box-shadow: var(--shadow-premium);
          border-color: var(--accent);
        }

        .item-image { 
          height: 240px; 
          position: relative; 
          background: var(--bg-subtle); 
          flex-shrink: 0;
          overflow: hidden;
        }
        .item-image img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .customer-menu-card:hover .item-image img {
          transform: scale(1.1);
        }
        
        .discount-tag {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #ef4444;
          color: white;
          padding: 0.35rem 0.75rem;
          border-radius: 0.75rem;
          font-weight: 900;
          font-size: 0.8rem;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          z-index: 5;
          letter-spacing: 0.02em;
          border: 1px solid rgba(255,255,255,0.2);
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        
        .item-info { 
          padding: 2rem; 
          flex: 1; 
          display: flex; 
          flex-direction: column;
          gap: 1rem;
        }
        .item-header h3 { 
          font-size: 1.4rem; 
          font-weight: 800; 
          color: var(--secondary); 
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
          line-height: 1.2;
          min-height: 3.4rem; /* Standardizes title area */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .item-price { font-size: 1.5rem; color: var(--secondary); font-weight: 900; }
        .item-desc { 
          color: var(--text-muted); 
          font-size: 0.95rem; 
          line-height: 1.5; 
          font-weight: 500; 
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 4.3rem; /* Standardizes description area */
        }

        .item-footer {
          margin-top: auto;
          padding-top: 1rem;
        }

        .add-btn {
          background: var(--secondary);
          color: white;
          width: 100%;
          padding: 1rem;
          border-radius: var(--radius-lg);
          font-weight: 800;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.3s ease;
        }
        .add-btn:hover { background: #000; transform: translateY(-2px); }

        .quantity-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-alt);
          padding: 0.65rem 1.25rem;
          border-radius: var(--radius-lg);
          width: 100%;
        }
        .quantity-controls span { font-weight: 900; font-size: 1.25rem; color: var(--secondary); }
        .quantity-controls button { color: var(--secondary); }

        /* Persistent Cart Bar */
        .persistent-cart-bar {
          position: fixed;
          top: 5.5rem;
          left: 50%;
          transform: translateX(-50%);
          z-index: 990;
          background: rgba(30, 27, 75, 0.96);
          backdrop-filter: blur(10px);
          color: white;
          padding: 0.875rem 1.5rem;
          border-radius: 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.25);
          cursor: pointer;
          width: 94%;
          max-width: 480px;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .bar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        /* Responsive Fixes consolidated at the bottom */
        .badge-count {
          position: absolute;
          top: -6px;
          right: -6px;
          background: var(--accent);
          color: var(--secondary);
          font-size: 0.75rem;
          font-weight: 900;
          padding: 0.2rem 0.45rem;
          border-radius: 1rem;
          border: 2px solid rgba(30,27,75,0.96);
        }
        .bar-price-info { display: flex; flex-direction: column; gap: 0.1rem; }
        .bar-total { font-weight: 900; font-size: 1.2rem; line-height: 1; }
        .bar-label { font-size: 0.7rem; color: rgba(255,255,255,0.5); letter-spacing: 0.06em; text-transform: uppercase; }
        .bar-action {
          background: var(--primary);
          border: none;
          color: white;
          padding: 0.7rem 1.25rem;
          border-radius: 1.25rem;
          font-weight: 800;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Close and misc */
        .close-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--bg-alt);
          color: var(--secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .close-btn:hover { background: var(--secondary); color: white; }

        .empty-cart {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 1rem;
          color: var(--text-muted);
          gap: 1rem;
          text-align: center;
        }
        .empty-cart p { font-size: 1.1rem; font-weight: 600; }

        .plus-one {
          position: absolute;
          top: -10px;
          right: -10px;
          font-size: 0.875rem;
          font-weight: 900;
          color: var(--accent);
          pointer-events: none;
        }

        .item-footer {
          display: flex;
          justify-content: flex-end;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          color: var(--text-muted);
          gap: 1rem;
          text-align: center;
        }

        .no-results-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6rem 2rem;
          text-align: center;
          gap: 1.5rem;
          background: white;
          border-radius: var(--radius-xl);
          border: 1px dashed var(--border);
          margin: 2rem 0;
        }
        .no-results-icon {
          width: 80px;
          height: 80px;
          background: var(--bg-alt);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }
        .no-results-state h3 {
          font-size: 1.75rem;
          color: var(--secondary);
          margin: 0;
        }
        .no-results-state p {
          color: var(--text-muted);
          max-width: 400px;
          margin: 0;
          line-height: 1.6;
          font-size: 1.05rem;
        }

        /* Cart Drawer Design */
        .drawer-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          z-index: 2000;
          display: flex;
          justify-content: flex-end;
        }
        :global(.cart-drawer) {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          width: 480px !important;
          max-width: 100vw !important;
          height: 100vh !important;
          height: 100svh !important;
          display: grid !important;
          grid-template-rows: auto 1fr auto !important;
          box-shadow: -30px 0 80px rgba(0,0,0,0.18) !important;
          overflow: hidden !important;
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          z-index: 2001 !important;
        }
        /* HEADER — always visible, never scrolls */
        :global(.drawer-header) {
          padding: 1.5rem 2rem !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          background: white !important;
          border-bottom: 1px solid var(--border) !important;
          z-index: 2 !important;
        }
        .drawer-header h2 { font-size: 1.75rem; }

        /* CONTENT — only this section scrolls up/down */
        :global(.drawer-content) {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 0 !important;
          background: white !important;
          min-height: 0 !important;
        }
        .drawer-content::-webkit-scrollbar { width: 5px; }
        .drawer-content::-webkit-scrollbar-track { background: var(--border); border-radius: 3px; }
        .drawer-content::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }
        .drawer-content::-webkit-scrollbar-thumb:hover { background: var(--secondary); }

        /* Cart items list */
        .cart-items {
          padding: 0.75rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .cart-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: 1rem;
          padding: 0.875rem 1rem;
          transition: box-shadow 0.2s ease;
        }
        .cart-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }

        .cart-item-img-wrap {
          width: 36px;
          height: 36px;
          border-radius: 0.625rem;
          background: #fff9eb;
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cart-item-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .cart-item-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cart-item-price {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--primary);
        }

        /* Compact, uniform quantity controls inside drawer */
        .cart-qty-controls {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-shrink: 0;
          background: var(--bg-alt);
          border-radius: 0.75rem;
          padding: 0.25rem;
        }
        .cart-qty-btn {
          width: 28px;
          height: 28px;
          border-radius: 0.5rem;
          background: white;
          border: 1px solid var(--border);
          color: var(--secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
          padding: 0;
        }
        .cart-qty-btn:hover { background: var(--secondary); color: white; border-color: var(--secondary); }
        .cart-qty-btn:active { transform: scale(0.88); }
        .cart-qty-num {
          font-size: 0.9rem;
          font-weight: 900;
          color: var(--secondary);
          min-width: 22px;
          text-align: center;
          line-height: 1;
        }


        .checkout-form-wrap {
          padding: 1rem 1.5rem;
        }

        .checkout-form .form-header { margin-bottom: 1.5rem; }
        .form-header h3 { font-size: 1.5rem; margin-bottom: 0.25rem; }
        .form-header p { color: var(--text-muted); font-weight: 500; font-size: 0.9rem; }

        .gourmet-input-group { margin-bottom: 1.25rem; }
        .gourmet-input-group label {
          display: block;
          font-weight: 800;
          font-size: 0.75rem;
          color: var(--secondary);
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.05rem;
        }

        .input-gourmet-area {
          width: 100%;
          min-height: 80px;
          padding: 0.875rem;
          background: var(--bg-alt);
          border: 2px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 0.95rem;
          font-weight: 600;
          resize: none;
          font-family: inherit;
        }
        .input-gourmet-area:focus { border-color: var(--accent); background: white; }

        .address-selector-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .address-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-alt);
          border: 2px solid var(--border);
          border-radius: 1rem;
          text-align: left;
          width: 100%;
          cursor: pointer;
          transition: all 0.2s;
        }
        .address-option:hover { border-color: var(--accent); background: white; }
        .address-option.selected { 
          border-color: var(--primary); 
          background: #fffbeb; 
          box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.1), 0 10px 20px -5px rgba(251, 191, 36, 0.2); 
        }
        .option-indicator {
          width: 22px;
          height: 22px;
          border: 2.5px solid #d1d5db;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          background: white;
        }
        .selected .option-indicator { 
          border-color: var(--primary); 
          border-width: 3px;
        }
        .selected .option-indicator::after {
          content: '';
          position: absolute;
          inset: 3px;
          background: var(--primary);
          border-radius: 50%;
          transform: scale(1.1);
          box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
        }
        .option-text { 
          font-size: 0.95rem; 
          font-weight: 750; 
          color: var(--secondary); 
          line-height: 1.4;
        }
        .btn-add-new-addr {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: transparent;
          border: 2px dashed var(--border);
          border-radius: 1rem;
          color: var(--text-muted);
          font-weight: 800;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .btn-add-new-addr:hover { border-color: var(--accent); color: var(--accent); }

        :global(.shutdown-section) {
          position: relative !important;
          width: 100% !important;
          background: #fffcf0 !important;
          border-top: 1px solid #fef3c7 !important;
          border-bottom: 1px solid #fef3c7 !important;
          z-index: 10 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 2.5rem 4% !important;
          backdrop-filter: none !important;
        }

        .shutdown-card {
          width: 100%;
          max-width: 1200px;
          background: white;
          padding: 1.5rem 2rem;
          border-radius: 2rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          border: 1px solid #f1f5f9;
        }

        .shutdown-info {
          flex: 1;
        }

        .shutdown-icon {
          width: 64px;
          height: 64px;
          background: #fef2f2;
          color: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .shutdown-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: #1e1b4b;
          margin-bottom: 0.1rem;
          text-align: left;
        }

        .shutdown-text {
          font-size: 1rem;
          color: #64748b;
          margin-bottom: 0;
          font-weight: 600;
          text-align: left;
        }

        .shutdown-footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #94a3b8;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .shutdown-card {
            flex-direction: column;
            text-align: center;
            padding: 2rem;
          }
          .shutdown-info { text-align: center; }
          .shutdown-title, .shutdown-text { text-align: center; }
          .shutdown-footer { margin-top: 1rem; }
        }

        .shutdown-card {
          width: 90%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 4rem 2rem;
          border-radius: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .shutdown-icon {
          width: 100px;
          height: 100px;
          background: #fef2f2;
          color: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.15);
        }

        .shutdown-title {
          font-size: 2.25rem;
          font-weight: 950;
          letter-spacing: -0.05em;
          color: #1e1b4b;
          margin-bottom: 1rem;
          text-align: center;
          width: 100%;
        }

        .shutdown-text {
          font-size: 1.1rem;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          font-weight: 600;
          text-align: center;
          width: 100%;
        }

        .shutdown-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #f1f5f9;
          color: #64748b;
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 2.5rem;
          border: 1px solid #e2e8f0;
        }

        .shutdown-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding-top: 2rem;
          border-top: 1px dashed #e2e8f0;
          color: #94a3b8;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        /* OUT OF STOCK STYLES */
        .customer-menu-card.out-of-stock {
          opacity: 0.75;
          filter: grayscale(0.5);
          cursor: not-allowed;
        }

        .out-of-stock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          backdrop-filter: blur(2px);
        }

        .add-btn.disabled {
          background: #f1f5f9;
          color: #94a3b8;
          border-color: #e2e8f0;
          cursor: not-allowed;
          box-shadow: none;
        }

        .geo-primary-btn {
          width: 100%;
          padding: 0.875rem;
          background: #fff9eb;
          color: #92400e;
          border: 2px dashed #fcd34d;
          border-radius: var(--radius-md);
          font-weight: 800;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 0.5rem;
          transition: all 0.3s ease;
        }
        .geo-primary-btn.success { background: #f0fdf4; color: #166534; border-color: #4ade80; border-style: solid; }

        /* FOOTER — always visible, never scrolls */
        :global(.drawer-footer) {
          padding: 1.5rem 2rem !important;
          background: white !important;
          border-top: 1px solid var(--border) !important;
          z-index: 10 !important;
          box-shadow: 0 -15px 45px rgba(0,0,0,0.06) !important;
        }
        .bill-row { display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-weight: 600; color: var(--text-muted); font-size: 0.875rem; }
        .bill-row.discount span:last-child { color: #16a34a; font-weight: 800; }
        .bill-row.grand-total { 
          margin-top: 0.75rem; 
          padding-top: 0.75rem;
          border-top: 2px solid var(--border);
          font-size: 1.25rem; font-weight: 900; color: var(--secondary); 
          margin-bottom: 1rem;
        }

        .checkout-btn {
          width: 100%;
          padding: 1.15rem;
          background: var(--primary);
          color: white;
          border-radius: 1.1rem;
          font-weight: 900;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          box-shadow: 0 10px 20px -5px var(--primary-glow);
          margin-top: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .checkout-btn:hover { background: var(--primary-dark); transform: translateY(-2px); }

        /* Back to cart button */
        .back-to-cart-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--bg-alt);
          border: none;
          color: var(--secondary);
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-weight: 800;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .back-to-cart-btn:hover { background: var(--secondary); color: white; }

        /* Loading spinner */
        .spin-slow {
          animation: spin 1.5s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .location-actions-v2 { display: flex; flex-direction: column; gap: 1rem; margin-top: 0.5rem; }
        .location-toggles { display: flex; gap: 0.75rem; }
        .geo-tool-btn {
          flex: 1;
          padding: 0.875rem;
          border-radius: 1.25rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #1e1b4b;
          font-weight: 800;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          transition: all 0.2s;
          cursor: pointer;
        }
        .geo-tool-btn:hover { border-color: #fbbf24; background: white; }
        .geo-tool-btn.active { background: #1e1b4b; color: #fbbf24; border-color: #1e1b4b; }
        .geo-tool-btn.success { background: #dcfce7; color: #166534; border-color: #bbf7d0; }

        .checkout-map-wrap {
          border-radius: 1.5rem;
          overflow: hidden;
          background: white;
          border: 1px solid #e2e8f0;
          position: relative;
          min-height: 400px;
          flex-shrink: 0;
        }
        .checkout-coords {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(30, 27, 75, 0.9);
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 1rem;
          font-size: 0.7rem;
          font-weight: 900;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .option-text-group { display: flex; flex-direction: column; align-items: flex-start; gap: 0.2rem; }
        .option-gps-tag {
          font-size: 0.65rem;
          font-weight: 900;
          background: #dcfce7;
          color: #166534;
          padding: 0.1rem 0.4rem;
          border-radius: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ======================================
           RESPONSIVE — CONSOLIDATED
           ====================================== */

        /* Tablet (≤ 1024px) */
        @media (max-width: 1024px) {
          .customer-menu-grid { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
          .item-image { height: 220px; }
        }

        /* Mobile large (≤ 768px) */
        @media (max-width: 768px) {
          .navbar { padding: 0.75rem 3.5%; gap: 0.4rem; }
          .nav-logo { font-size: 1.25rem; }
          .user-name { display: none; }

          .hero { padding: 5rem 4% 4rem; }
          .hero-title { font-size: 2.5rem !important; color: #ffffff !important; }
          .hero p { font-size: 1.1rem !important; margin-bottom: 2.5rem !important; color: rgba(255,255,255,0.8) !important; }

          .menu-section { padding: 2rem 4% 4rem; }
          .section-header h2 { font-size: 2rem; }
          .category-nav-wrapper { flex-direction: column; align-items: flex-start; gap: 0.75rem; margin-bottom: 1.5rem; }
          .category-scroll { width: 100%; mask-image: linear-gradient(to right, black 80%, transparent); }
          .filter-controls { align-self: flex-end; }

          .customer-menu-grid { grid-template-columns: 1fr; gap: 1.5rem; }
          .item-image { height: 220px; }
          .item-info { padding: 1.5rem; }
          .item-header h3 { font-size: 1.25rem; min-height: auto; }
          .item-desc { font-size: 0.9rem; min-height: auto; }
          .category-section-title { font-size: 1.6rem; }
          .category-section { margin-bottom: 3.5rem; }
          .category-pill { padding: 0.65rem 1.25rem; font-size: 0.85rem; }

          /* Cart drawer: full-width bottom sheet on mobile */
          :global(.cart-drawer) {
            width: 100vw !important;
            max-width: 100vw !important;
            border-radius: 1.75rem 1.75rem 0 0 !important;
            height: 92dvh !important;
            top: auto !important;
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            box-shadow: 0 -20px 60px rgba(0,0,0,0.2) !important;
          }
        }

        /* Mobile small (≤ 480px) */
        @media (max-width: 480px) {
          .hero-title { font-size: 2.25rem; color: #ffffff !important; }
          .item-header h3 { font-size: 1.35rem; }
          .item-info { padding: 1.25rem; }
          .section-header h2 { font-size: 1.75rem; }
          .hero { padding: 4rem 5% 3.5rem; }
          .location-toggles { flex-direction: column; }
          .checkout-btn { font-size: 0.95rem; padding: 1rem; }
        }

        /* Extra small (≤ 360px) */
        @media (max-width: 360px) {
          .nav-logo { font-size: 1.1rem; }
          .hero-title { font-size: 2rem; color: #ffffff !important; }
          .hero p { font-size: 0.95rem; }
        }
      `}</style>
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => {
          setIsProfileModalOpen(false);
          setAddressEditIndex(null);
        }}
        initialEditIndex={addressEditIndex}
      />
    </div>
  );
}
