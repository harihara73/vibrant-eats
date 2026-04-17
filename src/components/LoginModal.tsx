"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { X, Phone, ShieldCheck, Loader2, ArrowRight, Zap, User, Mail, MapPin, Home, Hash, Locate, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState<"email" | "otp" | "profile">("email");
  const [loginEmail, setLoginEmail] = useState("");

  // Detect if user is logged in via Google but missing a phone number
  useEffect(() => {
    if (isOpen && status === "authenticated" && session?.user) {
        const user = session.user as any;
        if (!user.phone && step !== "profile") {
            setStep("profile");
            setLoginEmail(user.email || "");
            setName(user.name || "");
            setIsNewUser(true); // Treat as new if profile is incomplete
        }
    }
  }, [isOpen, status, session, step]);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [doorNo, setDoorNo] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");

  // Auto-capture GPS when entering profile step
  const triggerGpsCapture = () => {
    if (!("geolocation" in navigator)) return;
    
    setIsGpsLoading(true);
    setGpsError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsGpsLoading(false);
      },
      (error) => {
        setIsGpsLoading(false);
        let msg = "Could not capture GPS.";
        if (error.code === 1) msg = "Location permission denied.";
        else if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
            msg = "GPS requires HTTPS on mobile.";
        }
        setGpsError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useState(() => {
    // We'll use this in handleVerifyOtp when moving to profile step
    return;
  });

  // Effect to trigger capture when step changes to profile
  useEffect(() => {
      if (step === "profile" && !coords && !isGpsLoading) {
          triggerGpsCapture();
      }
  }, [step, coords, isGpsLoading]);

  // Note: We'll use step change in handleVerifyOtp to trigger this reliably

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
        setError("Please enter a valid email address");
        return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail }),
      });
      
      const data = await res.json();

      if (res.ok) {
        setStep("otp");
        setIsNewUser(data.isNewUser);
        if (data.devCode) {
            setDevCode(data.devCode);
        }
      } else {
        setError(data.error || "Failed to send OTP. Try again.");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log(`[CLIENT] Attempting signIn with Email: ${loginEmail}, OTP: ${otp}`);
      const res = await signIn("email-login", {
        email: loginEmail,
        otp,
        redirect: false,
      });
      console.log(`[CLIENT] signIn response:`, res);

      if (res?.error) {
        setError("Invalid code. Please try again.");
      } else {
        if (isNewUser) {
            setStep("profile");
            triggerGpsCapture();
        } else {
            onSuccess();
            onClose();
        }
      }
    } catch (err) {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !doorNo || !addressLine || !area || !landmark || !pincode) {
        setError("Please fill all fields to complete your profile.");
        return;
    }

    setLoading(true);
    setError("");

    const fullAddress = {
        doorNo,
        addressLine,
        area,
        landmark,
        pincode,
        text: `${doorNo}, ${addressLine}, ${area}, ${landmark} - ${pincode}`,
        lat: coords?.lat,
        lng: coords?.lng
    };

    try {
        const res = await fetch("/api/user/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                name, 
                phone, 
                addresses: [fullAddress] 
            }),
        });

        if (res.ok) {
            await update({ 
                name, 
                phone,
                email: loginEmail,
                addresses: [fullAddress] 
            });
            onSuccess();
            onClose();
        } else {
            const data = await res.json();
            setError(data.error || "Failed to save profile.");
        }
    } catch (err) {
        setError("Something went wrong while saving profile.");
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-root">
      <AnimatePresence>
        {isOpen && (
          <div className="modal-overlay-outer">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop"
              onClick={onClose}
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="modal-container"
            >
              <div className="premium-modal-card">
                {/* Close Button Top Right */}
                <button className="abs-close-btn" onClick={onClose}>
                  <X size={20} />
                </button>

                <div className="modal-inner">
                  {/* Progress Indicator */}
                  <div className="progress-bar-wrap">
                    <div className={`progress-dot ${step === 'email' || step === 'otp' || step === 'profile' ? 'active' : ''}`} />
                    <div className={`progress-dot ${step === 'otp' || step === 'profile' ? 'active' : ''}`} />
                    <div className={`progress-dot ${step === 'profile' ? 'active' : ''}`} />
                  </div>

                  <div className="modal-body-scroll">
                    <div className="body-content">
                      <header className="auth-header">
                        <div className="brand-icon-circle">
                          {step === "email" && <Mail size={28} />}
                          {step === "otp" && <ShieldCheck size={28} />}
                          {step === "profile" && <User size={28} />}
                        </div>
                        <h2 className="premium-title">
                          {step === "email" && "Welcome"}
                          {step === "otp" && "Verification"}
                          {step === "profile" && "Profile Details"}
                        </h2>
                        <p className="premium-subtitle">
                          {step === "email" && "Enter your email address to begin."}
                          {step === "otp" && `We've sent a code to ${loginEmail}`}
                          {step === "profile" && "Help us personalize your gourmet experience."}
                        </p>
                      </header>

                      {error && (
                        <div className="premium-error-toast">
                          {error}
                        </div>
                      )}

                      <form onSubmit={
                          step === "email" ? handleSendOtp : 
                          step === "otp" ? handleVerifyOtp : 
                          handleSaveProfile
                      } className="auth-form">
                        {step === "email" && (
                          <>
                            <div className="premium-input-group">
                              <label>Email Address</label>
                              <div className="premium-input-wrapper">
                                <Mail size={20} style={{ marginRight: '1rem', color: '#94a3b8' }} />
                                <input 
                                  className="premium-field"
                                  type="email" 
                                  placeholder="name@example.com" 
                                  value={loginEmail}
                                  onChange={e => setLoginEmail(e.target.value)}
                                  required
                                  autoFocus
                                />
                              </div>
                            </div>

                            <div className="auth-divider">
                              <span>OR</span>
                            </div>

                            <button 
                              type="button" 
                              className="google-signin-btn"
                              onClick={() => signIn("google")}
                              disabled={loading}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '0.75rem' }}>
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                              Continue with Google
                            </button>
                          </>
                        )}

                        {step === "otp" && (
                          <div className="premium-input-group">
                            <label>OTP Code</label>
                            <input 
                              className="premium-field centered-otp"
                              type="text" 
                              placeholder="0 0 0 0 0 0" 
                              value={otp}
                              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              required
                              autoFocus
                            />
                            
                            {devCode && (
                                <div className="dev-mode-autofill">
                                  <div className="dev-text">
                                    <span className="dev-badge">{process.env.NODE_ENV === 'development' ? 'DEV CODE' : 'TEST CODE'}</span>
                                    <span className="dev-val">{devCode}</span>
                                  </div>
                                  <button 
                                      type="button" 
                                      onClick={() => setOtp(devCode)}
                                      className="dev-fill-btn"
                                  >
                                      <Zap size={14} /> Quick Fill
                                  </button>
                                </div>
                            )}
                          </div>
                        )}

                        {step === "profile" && (
                            <div className="profile-fields-stack">
                              {/* GPS Status Indicator */}
                              <div className={`gps-indicator-bar ${coords ? 'active' : isGpsLoading ? 'loading' : 'failed'}`}>
                                {isGpsLoading ? (
                                  <><Loader2 className="animate-spin" size={14} /> <span>Capturing...</span></>
                                ) : coords ? (
                                  <><ShieldCheck size={14} /> <span>Location Secured</span></>
                                ) : (
                                  <div className="gps-request-row">
                                    <div className="gps-text">
                                      <Locate size={14} /> 
                                      <span>{gpsError || "Enable GPS for accuracy"}</span>
                                    </div>
                                    <button 
                                      type="button" 
                                      onClick={(e) => { e.preventDefault(); triggerGpsCapture(); }}
                                      className="gps-action-btn"
                                    >
                                      Enable
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="field-row">
                                <label>Full Name</label>
                                <div className="icon-field-wrap">
                                  <User size={18} />
                                  <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required autoFocus />
                                </div>
                              </div>
                              
                              <div className="field-row">
                                <label>Phone Number</label>
                                <div className="icon-field-wrap">
                                  <Phone size={18} />
                                  <input type="tel" placeholder="00000 00000" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} required />
                                </div>
                              </div>

                              <div className="multi-field-row">
                                <div className="field-row">
                                  <label>Door No</label>
                                  <div className="icon-field-wrap">
                                    <Home size={18} />
                                    <input type="text" placeholder="101" value={doorNo} onChange={e => setDoorNo(e.target.value)} required />
                                  </div>
                                </div>
                                <div className="field-row">
                                  <label>Pincode</label>
                                  <div className="icon-field-wrap">
                                    <Hash size={18} />
                                    <input type="text" placeholder="6-digit" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
                                  </div>
                                </div>
                              </div>

                              <div className="field-row">
                                <label>Street / Address Line</label>
                                <div className="icon-field-wrap">
                                  <Locate size={18} />
                                  <input type="text" placeholder="Building, Society Name" value={addressLine} onChange={e => setAddressLine(e.target.value)} required />
                                </div>
                              </div>

                              <div className="multi-field-row">
                                <div className="field-row">
                                  <label>Area</label>
                                  <div className="icon-field-wrap">
                                    <MapPin size={18} />
                                    <input type="text" placeholder="Locality" value={area} onChange={e => setArea(e.target.value)} required />
                                  </div>
                                </div>
                                <div className="field-row">
                                  <label>Landmark</label>
                                  <div className="icon-field-wrap">
                                    <Compass size={18} />
                                    <input type="text" placeholder="Near Park" value={landmark} onChange={e => setLandmark(e.target.value)} required />
                                  </div>
                                </div>
                              </div>
                            </div>
                        )}

                        <div className="auth-submit-area">
                          <button type="submit" className="gourmet-submit-btn" disabled={loading}>
                            {loading ? (
                              <Loader2 className="animate-spin" size={20} />
                            ) : (
                              <>
                                <span>
                                  {step === "email" && "Send Access Code"}
                                  {step === "otp" && "Verify Access"}
                                  {step === "profile" && "Complete Sign Up"}
                                </span>
                                <ArrowRight size={20} />
                              </>
                            )}
                          </button>
                        </div>
                      </form>

                      <footer className="auth-footer">
                        {step === "otp" && (
                            <button className="text-btn" onClick={() => setStep("email")}>
                              Correction? Change email address
                            </button>
                        )}
                        {step === "profile" && (
                            <p className="fine-print">Used for faster deliveries and special offers.</p>
                        )}
                      </footer>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .modal-root {
          position: relative;
          z-index: 9999;
        }
        .modal-overlay-outer {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .modal-backdrop {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(8, 10, 24, 0.85);
          backdrop-filter: blur(8px);
        }
        .modal-container {
          position: relative;
          width: 100%;
          max-width: 480px;
          margin: 1.5rem;
          z-index: 10001;
        }
        .premium-modal-card {
          background: white;
          border-radius: 2rem;
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
          overflow: hidden;
          position: relative;
        }
        .abs-close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          width: 40px; height: 40px;
          background: #f8fafc;
          border: none;
          border-radius: 50%;
          color: #94a3b8;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s;
        }
        .abs-close-btn:hover { background: #0f172a; color: white; transform: rotate(90deg); }

        .modal-inner {
          display: flex;
          flex-direction: column;
          max-height: 85vh;
        }

        .progress-bar-wrap {
          display: flex;
          gap: 0.5rem;
          padding: 1.5rem 2.5rem 0;
        }
        .progress-dot {
          width: 24px; height: 4px;
          border-radius: 2px;
          background: #f1f5f9;
          transition: all 0.4s ease;
        }
        .progress-dot.active {
          width: 48px;
          background: #dc2626;
        }

        .modal-body-scroll {
          overflow-y: auto;
          padding: 2.5rem;
        }
        .auth-header { text-align: center; margin-bottom: 2.5rem; }
        .brand-icon-circle {
          width: 72px; height: 72px;
          background: #fdf2f2;
          color: #dc2626;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.5rem;
          border: 2px solid white;
          box-shadow: 0 10px 20px rgba(220, 38, 38, 0.1);
        }
        .premium-title { font-size: 2rem; font-weight: 900; color: #0f172a; margin-bottom: 0.5rem; letter-spacing: -0.04em; }
        .premium-subtitle { color: #64748b; font-size: 1.1rem; font-weight: 500; }

        .premium-error-toast {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #991b1b;
          padding: 1rem;
          border-radius: 1rem;
          margin-bottom: 2rem;
          font-weight: 700;
          text-align: center;
          font-size: 0.9rem;
        }

        .premium-input-group { margin-bottom: 2rem; }
        .premium-input-group label { display: block; font-weight: 800; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.75rem; letter-spacing: 0.1em; }
        
        .premium-input-wrapper {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1.25rem;
          padding: 0 1.25rem;
          transition: all 0.3s;
        }
        .premium-input-wrapper:focus-within { border-color: #0f172a; background: white; }
        .country-code { font-weight: 900; color: #0f172a; margin-right: 1rem; font-size: 1.2rem; }
        .premium-field {
          flex: 1;
          padding: 1.25rem 0;
          background: transparent;
          border: none;
          outline: none;
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a;
        }
        .centered-otp { text-align: center; border: 2px solid #f1f5f9; border-radius: 1.25rem; padding: 1.25rem; letter-spacing: 0.5em; }
        .centered-otp:focus { border-color: #0f172a; background: white; }

        .dev-mode-autofill { margin-top: 1rem; background: #0f172a; border-radius: 1rem; padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
        .dev-badge { font-size: 0.65rem; font-weight: 900; padding: 0.25rem 0.5rem; background: #dc2626; color: white; border-radius: 0.5rem; margin-right: 0.75rem; }
        .dev-val { color: white; font-family: monospace; font-weight: 800; letter-spacing: 0.1em; }
        .dev-fill-btn { background: rgba(255,255,255,0.1); border: none; color: white; font-weight: 800; font-size: 0.75rem; padding: 0.5rem 1rem; border-radius: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }

        .profile-fields-stack { display: flex; flex-direction: column; gap: 1.25rem; }
        .field-row { display: flex; flex-direction: column; gap: 0.6rem; }
        .field-row label { font-weight: 800; font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .icon-field-wrap { display: flex; align-items: center; gap: 1rem; background: #f8fafc; border: 2px solid #f1f5f9; border-radius: 1rem; padding: 0 1rem; transition: all 0.3s; }
        .icon-field-wrap:focus-within { border-color: #0f172a; background: white; color: #0f172a; }
        .icon-field-wrap :global(svg) { color: #cbd5e1; }
        .icon-field-wrap:focus-within :global(svg) { color: #0f172a; }
        .icon-field-wrap input { flex: 1; padding: 1rem 0; border: none; outline: none; background: transparent; font-weight: 700; color: #0f172a; }
        .multi-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }

        .gps-indicator-bar { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-radius: 1rem; font-weight: 800; font-size: 0.85rem; border: 1px solid transparent; }
        .gps-indicator-bar.loading { background: #eff6ff; color: #3b82f6; }
        .gps-indicator-bar.active { background: #f0fdf4; color: #16a34a; }
        .gps-indicator-bar.failed { background: #fff1f2; color: #e11d48; border-color: #fee2e2; }
        .gps-request-row { display: flex; align-items: center; justify-content: space-between; width: 100%; }
        .gps-action-btn { background: #0f172a; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 0.6rem; font-weight: 800; cursor: pointer; }

        .auth-submit-area { margin-top: 1rem; }
        .gourmet-submit-btn {
          width: 100%;
          padding: 1.25rem;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 1.25rem;
          font-weight: 900;
          font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          cursor: pointer;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.4);
          transition: all 0.3s;
        }
        .gourmet-submit-btn:hover { background: #dc2626; transform: translateY(-3px); box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.4); }
        .gourmet-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .auth-footer { margin-top: 1.5rem; text-align: center; }
        .text-btn { background: none; border: none; color: #64748b; font-weight: 700; font-size: 0.9rem; text-decoration: underline; cursor: pointer; }
        .fine-print { font-size: 0.8rem; color: #94a3b8; font-weight: 500; }

        .google-signin-btn {
          width: 100%;
          padding: 1rem;
          background: white;
          border: 2px solid #f1f5f9;
          border-radius: 1.25rem;
          color: #0f172a;
          font-weight: 700;
          font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 2rem;
        }
        .google-signin-btn:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-2px); }
        .google-signin-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

        .auth-divider {
          display: flex;
          align-items: center;
          margin: 1.5rem 0;
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 800;
        }
        .auth-divider::before, .auth-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #f1f5f9;
        }
        .auth-divider span { padding: 0 1rem; }

        @media (max-width: 640px) {
          .modal-container { margin: 0; align-self: flex-end; }
          .premium-modal-card { border-radius: 2.5rem 2.5rem 0 0; }
          .modal-inner { max-height: 92vh; }
          .modal-body-scroll { padding: 2rem 2rem 3rem; }
          .premium-title { font-size: 1.75rem; }
          .multi-field-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
