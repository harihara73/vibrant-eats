"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminMobileHeader from "@/components/AdminMobileHeader";
import { MapPin, Save, Navigation, Loader2, CheckCircle2, AlertCircle, Package, X, UtensilsCrossed, Plus } from "lucide-react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 16, color: "#94a3b8", fontWeight: 700 }}>Loading Map...</div>,
});

const RADIUS_OPTIONS = [5, 10, 15, 20];
const DEFAULT_CHARGES: Record<number, number> = { 5: 15, 10: 25, 15: 35, 20: 50 };

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Restaurant info
  const [restaurantName, setRestaurantName] = useState("VibrantEats Restaurant");
  const [restaurantLat, setRestaurantLat] = useState(17.4348);
  const [restaurantLng, setRestaurantLng] = useState(82.227);

  // Delivery settings
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(5);
  const [charges, setCharges] = useState<Record<number, number>>(DEFAULT_CHARGES);
  const [deliveryDiscount, setDeliveryDiscount] = useState(0);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(data => {
        if (data.restaurantName) setRestaurantName(data.restaurantName);
        if (data.restaurantLat) setRestaurantLat(data.restaurantLat);
        if (data.restaurantLng) setRestaurantLng(data.restaurantLng);
        if (data.deliveryRadiusKm) setDeliveryRadiusKm(data.deliveryRadiusKm);
        if (data.deliveryDiscount != null) setDeliveryDiscount(data.deliveryDiscount);
        if (data.deliveryCharges) {
          const raw: Record<string, number> = typeof data.deliveryCharges === "object" ? data.deliveryCharges : {};
          const parsed: Record<number, number> = { ...DEFAULT_CHARGES };
          Object.entries(raw).forEach(([k, v]) => { parsed[Number(k)] = Number(v); });
          setCharges(parsed);
        }
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const detectRestaurantGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      setRestaurantLat(pos.coords.latitude);
      setRestaurantLng(pos.coords.longitude);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const deliveryChargesObj: Record<string, number> = {};
      RADIUS_OPTIONS.forEach(r => { deliveryChargesObj[String(r)] = charges[r]; });

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantName,
          restaurantLat,
          restaurantLng,
          deliveryRadiusKm,
          deliveryCharges: deliveryChargesObj,
          deliveryDiscount,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const d = await res.json();
        setError(d.error || "Failed to save");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const getEffectiveCharge = (km: number) => {
    const base = charges[km] ?? 0;
    if (!deliveryDiscount) return base;
    return Math.round(base * (1 - deliveryDiscount / 100));
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <AdminMobileHeader title="Delivery Settings" />

        <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#1e1b4b", margin: 0, letterSpacing: "-0.04em" }}>
              🏪 Restaurant & Delivery Settings
            </h1>
            <p style={{ color: "#64748b", fontWeight: 600, marginTop: "0.25rem" }}>
              Configure restaurant location, delivery zones, categories and food types.
            </p>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
              <Loader2 size={36} color="#1e1b4b" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Restaurant Info Card */}
              <div style={cardStyle}>
                <SectionTitle icon="🏪" label="Restaurant Identity" />
                <div style={{ marginTop: "1rem" }}>
                  <label style={labelStyle}>Restaurant Name</label>
                  <input
                    value={restaurantName}
                    onChange={e => setRestaurantName(e.target.value)}
                    style={inputStyle}
                    placeholder="e.g. VibrantEats Kitchen"
                  />
                </div>
              </div>

              {/* Restaurant Location Card */}
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <SectionTitle icon="📍" label="Restaurant Location (Pin on Map)" />
                  <button onClick={detectRestaurantGPS} style={ghostBtnStyle}>
                    <Navigation size={14} />
                    Use My GPS
                  </button>
                </div>

                <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Latitude</label>
                    <input value={restaurantLat} onChange={e => setRestaurantLat(parseFloat(e.target.value) || 0)} style={inputStyle} type="number" step="0.0001" />
                  </div>
                  <div>
                    <label style={labelStyle}>Longitude</label>
                    <input value={restaurantLng} onChange={e => setRestaurantLng(parseFloat(e.target.value) || 0)} style={inputStyle} type="number" step="0.0001" />
                  </div>
                </div>

                <MapPicker
                  lat={restaurantLat}
                  lng={restaurantLng}
                  onChange={(lat, lng) => { setRestaurantLat(lat); setRestaurantLng(lng); }}
                />
              </div>

              {/* Delivery Zone Card */}
              <div style={cardStyle}>
                <SectionTitle icon="🛵" label="Delivery Radius" />
                <p style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, marginBottom: "1rem" }}>
                  Select the maximum distance for delivery.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
                  {RADIUS_OPTIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setDeliveryRadiusKm(r)}
                      style={{
                        padding: "1rem 0.5rem",
                        borderRadius: "1rem",
                        border: deliveryRadiusKm === r ? "2.5px solid #1e1b4b" : "2px solid #e2e8f0",
                        background: deliveryRadiusKm === r ? "#1e1b4b" : "white",
                        color: deliveryRadiusKm === r ? "#fbbf24" : "#475569",
                        fontWeight: 900,
                        fontSize: "1rem",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontSize: "1.4rem" }}>{r} km</span>
                      <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>radius</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Charges Card */}
              <div style={cardStyle}>
                <SectionTitle icon="💰" label="Delivery Charges per Zone" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginTop: "1rem" }}>
                  {RADIUS_OPTIONS.map(r => (
                    <div key={r} style={{ background: "#f8fafc", borderRadius: "0.875rem", padding: "1rem 1.25rem", border: deliveryRadiusKm >= r ? "1.5px solid #c7d2fe" : "1.5px solid #e2e8f0", opacity: deliveryRadiusKm >= r ? 1 : 0.45 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: 800, color: "#1e1b4b", fontSize: "0.9rem" }}>Up to {r} km</span>
                        {deliveryDiscount > 0 && (
                          <span style={{ fontSize: "0.7rem", background: "#dcfce7", color: "#166534", fontWeight: 900, padding: "0.15rem 0.4rem", borderRadius: "0.3rem" }}>
                            ₹{getEffectiveCharge(r)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "1.2rem", color: "#64748b", fontWeight: 800 }}>₹</span>
                        <input
                          type="number"
                          value={charges[r] ?? DEFAULT_CHARGES[r]}
                          onChange={e => setCharges(prev => ({ ...prev, [r]: parseInt(e.target.value) || 0 }))}
                          style={{ ...inputStyle, marginBottom: 0 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                 {/* Delivery Discount Card */}
              <div style={cardStyle}>
                <SectionTitle icon="🏷️" label="Delivery Charge Discount" />
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "1rem" }}>
                  {[0, 10, 25, 50, 100].map(d => (
                    <button
                      key={d}
                      onClick={() => setDeliveryDiscount(d)}
                      style={{
                        padding: "0.6rem 1rem",
                        borderRadius: "2rem",
                        border: deliveryRadiusKm === d ? "2px solid #1e1b4b" : "2px solid #e2e8f0",
                        background: deliveryDiscount === d ? "#1e1b4b" : "white",
                        color: deliveryDiscount === d ? "#fbbf24" : "#475569",
                        fontWeight: 800,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                    >
                      {d === 0 ? "None" : d === 100 ? "FREE" : `${d}% OFF`}
                    </button>
                  ))}
              </div>
            </div>
          </div>

              {/* Status messages */}
              {error && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "1rem", padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "center", color: "#991b1b", fontWeight: 700 }}>
                  <AlertCircle size={20} /> {error}
                </div>
              )}
              {saved && (
                <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "1rem", padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "center", color: "#166534", fontWeight: 700 }}>
                  <CheckCircle2 size={20} /> Settings saved successfully!
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                  color: "#fbbf24",
                  border: "none",
                  borderRadius: "1.25rem",
                  padding: "1.25rem",
                  fontWeight: 900,
                  fontSize: "1.1rem",
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                }}
              >
                {saving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
                {saving ? "Saving..." : "Save All Settings"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-layout { display: flex; min-height: 100vh; background: #f8fafc; }
        .admin-main { flex: 1; overflow: auto; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      <span style={{ fontSize: "1.2rem" }}>{icon}</span>
      <span style={{ fontSize: "1rem", fontWeight: 900, color: "#1e1b4b" }}>{label}</span>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "1.5rem",
  padding: "1.5rem",
  boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  border: "1px solid #f1f5f9",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 900,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "0.875rem",
  border: "2px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: "0.95rem",
  fontWeight: 700,
  color: "#1e1b4b",
  outline: "none",
  boxSizing: "border-box",
  marginBottom: "0.5rem",
};

const ghostBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  background: "white",
  border: "1.5px solid #e2e8f0",
  borderRadius: "0.75rem",
  padding: "0.5rem 0.875rem",
  fontSize: "0.8rem",
  fontWeight: 800,
  color: "#1e1b4b",
  cursor: "pointer",
};

const tagStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  background: "#f1f5f9",
  color: "#1e1b4b",
  padding: "0.4rem 0.75rem",
  borderRadius: "0.75rem",
  fontSize: "0.85rem",
  fontWeight: 800,
  border: "1.5px solid #e2e8f0",
};

const tagDeleteStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  color: "#94a3b8",
};
