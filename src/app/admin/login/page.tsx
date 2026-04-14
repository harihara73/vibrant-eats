"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("admin-login", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        const role = session?.user?.role;
        
        if (role === 'admin') router.push("/admin/dashboard");
        else if (role === 'delivery') router.push("/delivery");
        else router.push("/");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-root">
      <div className="cinematic-bg">
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
      </div>

      <div className="auth-stage">
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="auth-portal-card"
        >
          {/* LEFT SIDE: Branding / Image Section */}
          <div className="brand-panel">
            <div className="brand-overlay"></div>
            <div className="panel-inner">
              <header className="portal-header">
                <div className="premium-logo-mark">
                  <span>VE</span>
                </div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  VibrantEats
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Enterprise Management Suite
                </motion.p>
              </header>

              <div className="portal-features">
                {[
                  { icon: <ShieldCheck size={20} />, text: "Secure Staff Access" },
                  { icon: <ChevronRight size={20} />, text: "Fleet Logistics Control" },
                  { icon: <ArrowRight size={20} />, text: "Live Revenue Metrics" }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="feature-pill"
                  >
                    <span className="pill-icon">{item.icon}</span>
                    <span className="pill-text">{item.text}</span>
                  </motion.div>
                ))}
              </div>

              <footer className="portal-footer">
                <p>&copy; 2026 VibrantEats Global. Internal Use Only.</p>
              </footer>
            </div>
          </div>

          {/* RIGHT SIDE: Login Form Section */}
          <div className="form-panel">
            <div className="form-inner">
              <div className="form-head">
                <h2>Staff Entrance</h2>
                <p>Please authenticate to access your workspace.</p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="error-callout"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="portal-form">
                <div className="input-field">
                  <label>Administrator Email</label>
                  <div className="field-group">
                    <Mail size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="admin@vibranteats.com"
                    />
                  </div>
                </div>

                <div className="input-field">
                  <label>Access Key</label>
                  <div className="field-group">
                    <Lock size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button type="submit" className="portal-submit-btn" disabled={loading}>
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <span>Enter Dashboard</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .admin-auth-root {
          height: 100vh;
          width: 100vw;
          background: #020617;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }

        .auth-stage {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
        }

        :global(.auth-portal-card) {
          width: 100%;
          height: 100%;
          display: flex !important;
          background: #ffffff;
          box-shadow: none !important;
          border-radius: 0 !important;
          border: none !important;
          overflow: hidden;
        }

        /* LEFT PANEL: 50% WIDTH */
        .brand-panel {
          flex: 1;
          background: #0f172a;
          color: white;
          padding: 4rem;
          position: relative;
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .brand-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 0% 0%, #dc2626 0%, transparent 50%),
                      radial-gradient(circle at 100% 100%, #4f46e5 0%, transparent 50%);
          opacity: 0.15;
          z-index: -1;
        }

        .panel-inner { 
          height: 100%; 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
        }
        
        .premium-logo-mark {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          border-radius: 1.25rem;
          display: flex; align-items: center; justify-content: center;
          font-weight: 950; font-size: 1.5rem;
          box-shadow: 0 12px 24px rgba(220, 38, 38, 0.3);
          margin-bottom: 2rem;
        }

        .portal-header h1 { font-size: 3rem; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 1rem; line-height: 1; }
        .portal-header p { color: #94a3b8; font-weight: 500; font-size: 1.1rem; }

        .portal-features { display: flex; flex-direction: column; gap: 1.25rem; margin: auto 0; }
        .feature-pill {
          display: flex; align-items: center; gap: 1.25rem;
          padding: 1rem 1.5rem; background: rgba(255,255,255,0.05);
          border-radius: 1.25rem; border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feature-pill:hover { background: rgba(255,255,255,0.1); transform: translateX(10px); }
        .pill-icon { color: #dc2626; display: flex; }
        .pill-text { font-size: 1rem; font-weight: 700; color: #cbd5e1; }

        .portal-footer p { font-size: 0.85rem; color: #475569; font-weight: 600; opacity: 0.6; }

        /* RIGHT PANEL: 50% WIDTH & CENTERED */
        .form-panel {
          flex: 1;
          background: #f8fafc;
          padding: 4rem;
          display: flex; 
          align-items: center; 
          justify-content: center;
        }
        .form-inner { 
          width: 100%; 
          max-width: 440px; /* Perfectly sized for a professional form focus */
        }
        
        .form-head { margin-bottom: 3rem; text-align: center; }
        .form-head h2 { font-size: 2.25rem; font-weight: 900; color: #0f172a; letter-spacing: -0.04em; margin-bottom: 0.75rem; }
        .form-head p { color: #64748b; font-size: 1rem; font-weight: 500; line-height: 1.6; }

        .error-callout {
          background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b;
          padding: 1.25rem; border-radius: 1.25rem; margin-bottom: 2.5rem;
          font-weight: 700; font-size: 0.9rem; text-align: center;
        }

        .portal-form { display: flex; flex-direction: column; gap: 1.75rem; }
        .input-field { display: flex; flex-direction: column; gap: 0.85rem; }
        .input-field label { font-size: 0.8rem; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; }
        
        .field-group {
          display: flex; align-items: center; gap: 1.25rem;
          background: white; border: 2px solid #e2e8f0;
          border-radius: 1.5rem; padding: 0 1.5rem;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .field-group:focus-within {
          border-color: #0f172a;
          box-shadow: 0 15px 30px -15px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .field-group :global(svg) { color: #94a3b8; transition: color 0.3s; }
        .field-group:focus-within :global(svg) { color: #dc2626; }
        .field-group input {
          flex: 1; padding: 1.5rem 0; border: none; outline: none;
          background: transparent; font-size: 1.1rem; font-weight: 700; color: #0f172a;
        }

        .portal-submit-btn {
          margin-top: 1.5rem;
          background: #0f172a; color: white; border: none;
          padding: 1.5rem; border-radius: 1.5rem;
          font-weight: 900; font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center; gap: 0.85rem;
          cursor: pointer; transition: all 0.4s;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.4);
          width: 100%;
        }
        .portal-submit-btn:hover {
          background: #dc2626;
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.5);
        }
        .portal-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        @media (max-width: 900px) {
          .admin-auth-root { height: auto; min-height: 100vh; overflow: auto; }
          :global(.auth-portal-card) { flex-direction: column !important; min-height: 100vh; }
          .brand-panel { padding: 3rem 2rem; flex: none; }
          .form-panel { padding: 4rem 2rem; flex: 1; align-items: flex-start; }
          .portal-features { margin-top: 2rem; }
          .brand-overlay { display: none; }
          .portal-header h1 { font-size: 2.25rem; }
        }
      `}</style>
    </div>
  );
}
