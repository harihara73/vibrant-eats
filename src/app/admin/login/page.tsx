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
          {/* Brand/Identity Side */}
          <div className="brand-panel">
            <div className="panel-inner">
              <header className="portal-header">
                <div className="premium-logo-mark">
                  <span>VE</span>
                </div>
                <h1>VibrantEats</h1>
                <p>Enterprise Management Suite</p>
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
                    transition={{ delay: 0.5 + idx * 0.1 }}
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

          {/* Form Side */}
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
          min-height: 100vh;
          background: #020617;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: inherit;
        }

        .cinematic-bg {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 1;
        }
        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.4;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: #dc2626;
          top: -100px; left: -100px;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: #4f46e5;
          bottom: -50px; right: -50px;
        }

        .auth-stage {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1000px;
          padding: 2rem;
        }

        .auth-portal-card {
          background: #ffffff;
          border-radius: 2.5rem;
          display: flex;
          min-height: 640px;
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }

        /* LEFT PANEL */
        .brand-panel {
          flex: 1.2;
          background: #0f172a;
          color: white;
          padding: 4rem;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .panel-inner { height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
        
        .premium-logo-mark {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          border-radius: 1.25rem;
          display: flex; align-items: center; justify-content: center;
          font-weight: 950; font-size: 1.5rem;
          box-shadow: 0 12px 24px rgba(220, 38, 38, 0.3);
          margin-bottom: 2rem;
        }

        .portal-header h1 { font-size: 2.5rem; font-weight: 900; letter-spacing: -0.05em; margin-bottom: 0.5rem; line-height: 1; }
        .portal-header p { color: #94a3b8; font-weight: 500; font-size: 1rem; }

        .portal-features { display: flex; flex-direction: column; gap: 1rem; margin: 3rem 0; }
        .feature-pill {
          display: flex; align-items: center; gap: 1rem;
          padding: 0.75rem 1.25rem; background: rgba(255,255,255,0.05);
          border-radius: 1rem; border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s;
        }
        .feature-pill:hover { background: rgba(255,255,255,0.1); transform: translateX(5px); }
        .pill-icon { color: #dc2626; display: flex; }
        .pill-text { font-size: 0.9rem; font-weight: 700; color: #cbd5e1; }

        .portal-footer p { font-size: 0.75rem; color: #475569; font-weight: 600; }

        /* RIGHT PANEL */
        .form-panel {
          flex: 1;
          background: #f8fafc;
          padding: 4rem;
          display: flex; align-items: center;
        }
        .form-inner { width: 100%; }
        
        .form-head { margin-bottom: 2.5rem; }
        .form-head h2 { font-size: 2rem; font-weight: 900; color: #0f172a; letter-spacing: -0.04em; margin-bottom: 0.5rem; }
        .form-head p { color: #64748b; font-size: 0.95rem; font-weight: 500; line-height: 1.5; }

        .error-callout {
          background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b;
          padding: 1rem; border-radius: 1rem; margin-bottom: 2rem;
          font-weight: 700; font-size: 0.85rem; text-align: center;
        }

        .portal-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .input-field { display: flex; flex-direction: column; gap: 0.75rem; }
        .input-field label { font-size: 0.75rem; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; }
        
        .field-group {
          display: flex; align-items: center; gap: 1rem;
          background: white; border: 2px solid #e2e8f0;
          border-radius: 1.25rem; padding: 0 1.25rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .field-group:focus-within {
          border-color: #0f172a;
          box-shadow: 0 10px 20px -10px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .field-group :global(svg) { color: #94a3b8; transition: color 0.3s; }
        .field-group:focus-within :global(svg) { color: #dc2626; }
        .field-group input {
          flex: 1; padding: 1.25rem 0; border: none; outline: none;
          background: transparent; font-size: 1rem; font-weight: 700; color: #0f172a;
        }

        .portal-submit-btn {
          margin-top: 1rem;
          background: #0f172a; color: white; border: none;
          padding: 1.25rem; border-radius: 1.25rem;
          font-weight: 900; font-size: 1.1rem;
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          cursor: pointer; transition: all 0.3s;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.4);
        }
        .portal-submit-btn:hover {
          background: #dc2626;
          transform: translateY(-4px);
          box-shadow: 0 25px 50px -12px rgba(220, 38, 38, 0.5);
        }
        .portal-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        @media (max-width: 850px) {
          .auth-portal-card { flex-direction: column; border-radius: 2rem; }
          .brand-panel { padding: 3rem; }
          .form-panel { padding: 3rem; }
          .portal-features { display: none; }
        }
      `}</style>
    </div>
  );
}
