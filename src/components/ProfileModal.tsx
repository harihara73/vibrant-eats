"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { X, User, Mail, MapPin, Plus, Trash2, Loader2, CheckCircle2, ShieldCheck, Settings, Navigation, Home, Hash, Locate, Compass, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("./MapPicker"), { 
  ssr: false,
  loading: () => <div className="map-placeholder">Loading Map...</div>
});

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEditIndex?: number | null;
}

export default function ProfileModal({ isOpen, onClose, initialEditIndex = null }: ProfileModalProps) {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [doorNo, setDoorNo] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [selectedLat, setSelectedLat] = useState(12.9716); 
  const [selectedLng, setSelectedLng] = useState(77.5946);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      const savedAddresses = (session.user as any).addresses || [];
      const formatted = savedAddresses.map((addr: any) => 
        typeof addr === 'string' ? { text: addr, lat: null, lng: null } : addr
      );
      setAddresses(formatted);

      if (initialEditIndex !== null && formatted[initialEditIndex]) {
        handleEditClick(initialEditIndex, formatted);
      }
    }
  }, [session, isOpen, initialEditIndex]);

  const handleEditClick = (index: number, currentAddresses: any[] = addresses) => {
    const addr = currentAddresses[index];
    if (!addr) return;
    setEditingIndex(index);
    const isOldStyle = !addr.doorNo && addr.text;
    setDoorNo(addr.doorNo || "");
    setAddressLine(isOldStyle ? addr.text : (addr.addressLine || ""));
    setArea(addr.area || "");
    setLandmark(addr.landmark || "");
    setPincode(addr.pincode || "");
    
    if (addr.lat && addr.lng) {
      setSelectedLat(Number(addr.lat));
      setSelectedLng(Number(addr.lng));
      setShowMap(true);
    } else {
      setShowMap(false);
    }
    
    const formElement = document.querySelector('.v3-main-editor');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setDoorNo("");
    setAddressLine("");
    setArea("");
    setLandmark("");
    setPincode("");
    setShowMap(false);
  };

  const handleGetCurrentLocation = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSelectedLat(pos.coords.latitude);
          setSelectedLng(pos.coords.longitude);
          setGpsLoading(false);
          setShowMap(true);
        },
        () => {
          setGpsLoading(false);
          alert("Unable to retrieve location.");
        }
      );
    }
  };

  const handleAddAddress = () => {
    if (!doorNo || !addressLine || !area || !landmark || !pincode) {
        alert("Please fill all address fields.");
        return;
    }

    const addressText = `${doorNo}, ${addressLine}, ${area}, ${landmark} - ${pincode}`;

    const newAddrObj = {
      doorNo, addressLine, area, landmark, pincode,
      text: addressText,
      lat: showMap ? selectedLat : null,
      lng: showMap ? selectedLng : null
    };

    if (editingIndex !== null) {
      const updatedAddresses = [...addresses];
      updatedAddresses[editingIndex] = newAddrObj;
      setAddresses(updatedAddresses);
      setEditingIndex(null);
    } else {
      setAddresses([...addresses, newAddrObj]);
    }

    setDoorNo("");
    setAddressLine("");
    setArea("");
    setLandmark("");
    setPincode("");
    setShowMap(false);
    setSelectedLat(12.9716);
    setSelectedLng(77.5946);
  };

  const handleRemoveAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    let currentAddresses = [...addresses];

    const isPendingEntry = (doorNo || addressLine || area || landmark || pincode) && editingIndex === null;
    if (isPendingEntry) {
      if (!doorNo || !addressLine || !area || !landmark || !pincode) {
          setError("Please complete or clear the current address fields before saving.");
          return;
      }
      const addressText = `${doorNo}, ${addressLine}, ${area}, ${landmark} - ${pincode}`;
      const newAddrObj = {
        doorNo, addressLine, area, landmark, pincode,
        text: addressText,
        lat: showMap ? selectedLat : null,
        lng: showMap ? selectedLng : null
      };
      currentAddresses.push(newAddrObj);
    }

    if (editingIndex !== null) {
       const addressText = `${doorNo}, ${addressLine}, ${area}, ${landmark} - ${pincode}`;
       const updatedAddr = {
         doorNo, addressLine, area, landmark, pincode,
         text: addressText,
         lat: showMap ? selectedLat : null,
         lng: showMap ? selectedLng : null
       };
       currentAddresses[editingIndex] = updatedAddr;
    }

    setAddresses(currentAddresses);
    setDoorNo("");
    setAddressLine("");
    setArea("");
    setLandmark("");
    setPincode("");
    setShowMap(false);
    setSelectedLat(12.9716);
    setSelectedLng(77.5946);
    setEditingIndex(null);

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, addresses: currentAddresses }),
      });

      if (res.ok) {
        await update({ name, email, addresses: currentAddresses });
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update profile.");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        style={{ 
          background: '#ffffff', 
          opacity: 1, 
          zIndex: 10001,
          position: 'relative',
          width: '90vw',
          height: '90vh',
          maxWidth: '1440px',
          borderRadius: '3rem',
          boxShadow: '0 50px 100px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,1)',
        }}
        className="profile-modal-v3"
        onClick={e => e.stopPropagation()}
      >
        <button className="close-action" onClick={onClose}>
          <X size={22} />
        </button>

        <div className="modal-inner-v3">
          <header className="v3-main-header">
            <div className="v3-header-left">
              <div className="v3-icon-badge">
                <Settings className="spin-hover" size={28} />
              </div>
              <div className="v3-title-stack">
                <div className="v3-greeting">Welcome back, {name.split(' ')[0] || "Gourmet"}</div>
                <h2>Account Hub</h2>
              </div>
            </div>
            <div className="v3-header-right">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="v3-status-pill error">
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="v3-status-pill success">
                    <CheckCircle2 size={16} /> Saved
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          <div className="v3-dashboard-grid">
            <aside className="v3-side-panel">
              <section className="v3-section">
                <div className="v3-section-title">Personal Profile</div>
                <div className="v3-identity-card">
                  <div className="v3-mini-input-group">
                    <User size={16} />
                    <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="v3-mini-input-group">
                    <Mail size={16} />
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>
              </section>

              <section className="v3-section flex-1">
                <div className="v3-section-title">Saved Delivery Areas</div>
                <div className="v3-address-list">
                  <AnimatePresence initial={false}>
                    {addresses.map((addr, idx) => (
                      <motion.div 
                        key={idx} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`v3-addr-item ${editingIndex === idx ? 'active' : ''}`}
                      >
                         <div className="v3-addr-content">
                            <MapPin size={18} color={editingIndex === idx ? "var(--primary)" : "#94a3b8"} />
                            <div className="v3-addr-details">
                              <span className="v3-addr-text">{addr.text || addr}</span>
                              {addr.lat && <span className="v3-gps-tag">Geocoded</span>}
                            </div>
                         </div>
                         <div className="v3-addr-actions">
                            <button className="v3-action-btn edit" onClick={() => handleEditClick(idx)} title="Edit">
                                <Pencil size={14} />
                            </button>
                            <button className="v3-action-btn delete" onClick={() => handleRemoveAddress(idx)} title="Remove">
                                <Trash2 size={14} />
                            </button>
                         </div>
                      </motion.div>
                    ))}
                    {addresses.length === 0 && (
                      <div className="v3-empty-state">No locations saved yet</div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
            </aside>

            <main className="v3-main-editor">
               <div className="v3-editor-card">
                  <div className="v3-section-title split">
                    <div className="v3-title-label">
                      {editingIndex !== null ? <Pencil size={14} /> : <Plus size={14} />}
                      <span>{editingIndex !== null ? 'Modify Location' : 'Register New Location'}</span>
                    </div>
                    <div className="v3-header-actions">
                      {editingIndex !== null && (
                        <button className="v3-cancel-link" onClick={handleCancelEdit}>Cancel</button>
                      )}
                      <button 
                        className={`v3-header-save-btn ${(!doorNo || !addressLine || !area || !landmark || !pincode) ? 'disabled' : ''}`}
                        onClick={handleAddAddress}
                        disabled={!doorNo || !addressLine || !area || !landmark || !pincode}
                        title={editingIndex !== null ? 'Confirm Modifications' : 'Add to Collection'}
                      >
                        {editingIndex !== null ? <ShieldCheck size={18}/> : <CheckCircle2 size={18}/>}
                        {editingIndex !== null ? 'Confirm' : 'Add'}
                      </button>
                    </div>
                  </div>

                  <div className="v3-form-grid">
                    <div className="v3-field semi">
                      <label><Home size={12}/> Flat / Door No</label>
                      <input type="text" placeholder="e.g. 101" value={doorNo} onChange={e => setDoorNo(e.target.value)} />
                    </div>
                    <div className="v3-field semi">
                      <label><Hash size={12}/> Pincode</label>
                      <input type="text" placeholder="6-digit" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                    </div>
                    <div className="v3-field full">
                      <label><Locate size={12}/> Address Line</label>
                      <input type="text" placeholder="Street, Building name" value={addressLine} onChange={e => setAddressLine(e.target.value)} />
                    </div>
                    <div className="v3-field semi">
                      <label><MapPin size={12}/> Area</label>
                      <input type="text" placeholder="e.g. Madhapur" value={area} onChange={e => setArea(e.target.value)} />
                    </div>
                    <div className="v3-field semi">
                      <label><Compass size={12}/> Landmark</label>
                      <input type="text" placeholder="e.g. Near Park" value={landmark} onChange={e => setLandmark(e.target.value)} />
                    </div>
                  </div>

                  <div className="v3-map-section">
                    <div className="v3-map-header">
                      <span>Map Placement</span>
                      <div className="v3-map-tools">
                        <button className={`v3-map-btn ${showMap ? 'active' : ''}`} onClick={() => setShowMap(!showMap)}>
                          {showMap ? 'Hide Map' : 'Enable Pinning'}
                        </button>
                        <button className="v3-map-btn" onClick={handleGetCurrentLocation} disabled={gpsLoading}>
                          {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />} GPS
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showMap ? (
                        <motion.div key="map" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="v3-map-wrapper">
                          <MapPicker lat={selectedLat} lng={selectedLng} onChange={(la, ln) => { setSelectedLat(la); setSelectedLng(ln); }} />
                        </motion.div>
                      ) : (
                        <div key="placeholder" className="v3-map-placeholder" onClick={() => setShowMap(true)}>
                           <MapPin size={32} />
                           <p>Tap to Pin Exactly on Map</p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
               </div>
            </main>
          </div>

          <footer className="v3-final-footer">
             <button className="v3-save-all-btn" onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={24} /> : (
                  <>
                    <ShieldCheck size={20} />
                    Commit All Changes
                  </>
                )}
             </button>
          </footer>
        </div>
      </motion.div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .modal-inner-v3 {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }

        .v3-main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2.5rem 2.5rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          flex-shrink: 0;
          z-index: 10;
        }

        .v3-header-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .v3-icon-badge {
          width: 56px;
          height: 56px;
          background: #1e1b4b;
          color: #fbbf24;
          border-radius: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px rgba(30,27,75,0.2);
        }

        .v3-title-stack h2 {
          font-size: 2rem;
          font-weight: 950;
          color: #1e1b4b;
          margin: 0;
          letter-spacing: -0.05em;
        }

        .v3-greeting {
          font-size: 0.85rem;
          font-weight: 800;
          color: #fbbf24;
          background: #1e1b4b;
          padding: 0.15rem 0.6rem;
          border-radius: 0.5rem;
          display: inline-block;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .v3-status-pill {
          padding: 0.6rem 1.25rem;
          border-radius: 1rem;
          font-weight: 800;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .v3-status-pill.success { background: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }
        .v3-status-pill.error { background: #fef2f2; color: #dc2626; border: 1px solid #fee2e2; }

        .v3-dashboard-grid {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 2.5rem;
          flex: 1;
          overflow-y: auto;
          padding: 2.5rem;
          z-index: 1;
        }

        .v3-side-panel {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          min-height: 0;
        }

        .v3-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .v3-section.flex-1 { min-height: 0; }

        .v3-section-title {
          font-size: 0.75rem;
          font-weight: 900;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding-left: 0.25rem;
        }
        .v3-section-title.split {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          gap: 1rem;
        }
        .v3-title-label { display: flex; align-items: center; gap: 0.5rem; }
        .v3-title-label span { color: #1e1b4b; font-size: 0.9rem; font-weight: 800; }
        .v3-title-label svg { color: #fbbf24; }

        .v3-header-actions { display: flex; align-items: center; gap: 1rem; }

        .v3-header-save-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #1e1b4b;
          color: #fbbf24;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-weight: 800;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .v3-header-save-btn:hover:not(.disabled) { background: #fbbf24; color: #1e1b4b; transform: translateY(-1px); }
        .v3-header-save-btn.disabled { opacity: 0.3; cursor: not-allowed; }

        .v3-identity-card {
          background: #f8fafc;
          border-radius: 1.5rem;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border: 1px solid #e2e8f0;
        }

        .v3-mini-input-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: white;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }
        .v3-mini-input-group:focus-within { border-color: #fbbf24; box-shadow: 0 0 0 4px rgba(251,191,36,0.1); }
        .v3-mini-input-group input { border: none; outline: none; font-size: 0.9rem; font-weight: 600; color: #1e1b4b; flex: 1; }
        .v3-mini-input-group svg { color: #94a3b8; }

        .v3-address-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-right: 0.5rem;
          scrollbar-width: thin;
        }

        .v3-addr-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 1.25rem;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }
        .v3-addr-item:hover { border-color: #cbd5e1; transform: translateX(4px); }
        .v3-addr-item.active { border-color: #fbbf24; background: #fffbeb; box-shadow: 0 4px 12px rgba(251,191,36,0.1); }

        .v3-addr-content { display: flex; gap: 1rem; align-items: flex-start; flex: 1; }
        .v3-addr-details { display: flex; flex-direction: column; gap: 0.25rem; }
        .v3-addr-text { font-size: 0.85rem; font-weight: 600; color: #1e1b4b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .v3-gps-tag { font-size: 0.65rem; font-weight: 800; color: #16a34a; text-transform: uppercase; }

        .v3-addr-actions { display: flex; gap: 0.4rem; padding-left: 0.75rem; }
        .v3-action-btn { width: 32px; height: 32px; border-radius: 0.75rem; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .v3-action-btn.edit { background: #fff7ed; color: #c2410c; }
        .v3-action-btn.delete { background: #fef2f2; color: #dc2626; }
        .v3-action-btn:hover { transform: scale(1.1); }

        .v3-main-editor {
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .v3-editor-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 2rem;
          padding: 2rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.05);
          overflow-y: auto;
          scrollbar-width: thin;
        }

        .v3-cancel-link { background: transparent; border: none; color: #ef4444; font-size: 0.75rem; font-weight: 800; cursor: pointer; text-transform: uppercase; }

        .v3-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; flex-shrink: 0; }
        .v3-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .v3-field.full { grid-column: span 2; }
        .v3-field label { font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; display: flex; align-items: center; gap: 0.4rem; padding-left: 0.25rem; }
        .v3-field input { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.8rem 1rem; border-radius: 0.75rem; font-size: 0.9rem; font-weight: 600; color: #1e1b4b; transition: all 0.2s; }
        .v3-field input:focus { border-color: #fbbf24; background: white; outline: none; box-shadow: 0 0 0 4px rgba(251,191,36,0.1); }

        .v3-map-section { 
          flex: 1; 
          min-height: 400px; 
          display: flex; 
          flex-direction: column; 
          gap: 0.75rem; 
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }
        .v3-map-header { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; padding: 0 0.25rem; }
        .v3-map-tools { display: flex; gap: 0.5rem; }
        .v3-map-btn { padding: 0.4rem 0.8rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; background: white; font-size: 0.7rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: all 0.2s; }
        .v3-map-btn:hover { border-color: #fbbf24; color: #1e1b4b; }
        .v3-map-btn.active { background: #1e1b4b; color: #fbbf24; border-color: #1e1b4b; }

        .v3-map-wrapper { 
          flex: 1; 
          border-radius: 1.5rem; 
          overflow: hidden; 
          border: 1px solid #e2e8f0; 
          position: relative;
          z-index: 1;
        }
        
        /* Ensure Leaflet stays below modal header */
        .v3-map-wrapper :global(.leaflet-container) {
          z-index: 1 !important;
        }

        .v3-map-placeholder { flex: 1; min-height: 250px; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem; color: #94a3b8; cursor: pointer; transition: all 0.2s; }
        .v3-map-placeholder:hover { background: #f1f5f9; color: #1e1b4b; border-color: #fbbf24; }
        .v3-map-placeholder p { font-size: 0.85rem; font-weight: 700; }

        .v3-submit-btn { 
          width: 100%; 
          padding: 1.15rem; 
          background: #fbbf24; 
          color: #1e1b4b; 
          border: none; 
          border-radius: 1.25rem; 
          font-weight: 950; 
          font-size: 1rem; 
          cursor: pointer; 
          transition: all 0.3s; 
          box-shadow: 0 10px 20px rgba(251,191,36,0.2); 
          flex-shrink: 0;
        }
        .v3-submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(251,191,36,0.3); background: #f59e0b; }
        .v3-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .v3-final-footer { 
          padding: 1.5rem 2.5rem 2.5rem; 
          border-top: 1px solid #f1f5f9; 
          display: flex; 
          justify-content: center; 
          z-index: 10; 
          background: white;
          flex-shrink: 0;
        }
        .v3-save-all-btn { width: 50%; min-width: 300px; padding: 1.25rem; background: #1e1b4b; color: #fbbf24; border: none; border-radius: 1.5rem; font-weight: 950; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 15px 30px rgba(30,27,75,0.25); }
        .v3-save-all-btn:hover:not(:disabled) { transform: translateY(-3px) scale(1.02); background: black; }

        .v3-empty-state { padding: 3rem 1rem; text-align: center; color: #94a3b8; font-size: 0.85rem; font-weight: 600; border: 2px dashed #f1f5f9; border-radius: 1.5rem; }

        .close-action {
          position: absolute;
          top: 2rem;
          right: 2rem;
          background: white;
          border: 1px solid rgba(0,0,0,0.05);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1e1b4b;
          cursor: pointer;
          z-index: 100;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
          transition: all 0.3s;
        }
        .close-action:hover { background: #1e1b4b; color: white; transform: rotate(90deg); }

        @media (max-width: 1024px) {
          .modal-overlay { padding: 0.5rem; }
          .profile-modal-v3 { border-radius: 2rem; width: 95vw; height: 95vh; }
          .modal-inner-v3 { padding: 0; }
          .v3-main-header { padding: 1.5rem 1.5rem 1rem; }
          .v3-dashboard-grid { 
            display: flex; 
            flex-direction: column; 
            padding: 1.5rem; 
            gap: 2.5rem; 
            overflow-y: auto; 
          }
          .v3-side-panel { min-height: auto; flex-shrink: 0; }
          .v3-main-editor { min-height: auto; flex-shrink: 0; }
          .v3-editor-card { padding: 1rem; box-shadow: none; border: none; height: auto; overflow: visible; }
          .v3-map-section { min-height: 320px; }
          .v3-address-list { max-height: none; }
          .v3-final-footer { padding: 1rem 1.5rem 2rem; background: white; box-shadow: 0 -10px 30px rgba(0,0,0,0.05); }
          .v3-save-all-btn { width: 100%; min-width: auto; }
          .close-action { top: 1.25rem; right: 1.25rem; width: 36px; height: 36px; }
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-hover:hover { animation: spin 4s linear infinite; }
      `}</style>
    </div>
  );
}
