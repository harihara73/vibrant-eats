"use client";

import { useEffect, useState } from "react";
import { usePWA } from "@/context/PWAContext";
import { Download, X, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PWAInstall() {
  const { isInstallable, install } = usePWA();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check one-time popup from localStorage
    const hasSeenPopup = localStorage.getItem("pwa-popup-seen");
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Only show for the main customer app (root) if not seen yet
    if (!hasSeenPopup && isMobile && isInstallable && window.location.pathname === '/') {
      const timer = setTimeout(() => setShowPopup(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const closePopup = () => {
    setShowPopup(false);
    localStorage.setItem("pwa-popup-seen", "true");
  };

  const handleInstallAndClose = async () => {
    await install();
    closePopup();
  };

  return (
    <>
      {/* One-Time Mobile Popup (Customer App Only) */}
      <AnimatePresence>
        {showPopup && (
          <div className="pwa-popup-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pwa-popup-card"
            >
              <button className="popup-close-btn" onClick={closePopup}><X size={20} /></button>
              <div className="popup-header">
                <div className="popup-icon">
                  <Smartphone size={32} />
                </div>
                <h2>VibrantEats on Mobile</h2>
                <p>Install our app for ultra-fast gourmet ordering!</p>
              </div>
              <div className="popup-footer">
                <button className="popup-install-btn" onClick={handleInstallAndClose}>
                  <Download size={20} />
                  Install Food App
                </button>
                <button className="popup-later-btn" onClick={closePopup}>Maybe Later</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .pwa-popup-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          z-index: 20000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .pwa-popup-card {
          background: white;
          width: 100%;
          max-width: 380px;
          border-radius: 2rem;
          padding: 2.5rem 2rem;
          position: relative;
          text-align: center;
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.4);
        }

        .popup-close-btn {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: #f1f5f9;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
        }

        .popup-header {
          margin-bottom: 2rem;
        }

        .popup-icon {
          width: 70px;
          height: 70px;
          background: #1e1b4b;
          color: #fbbf24;
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 15px 30px rgba(30, 27, 75, 0.3);
        }

        .popup-header h2 {
          color: #1e1b4b;
          font-size: 1.5rem;
          font-weight: 900;
          margin-bottom: 0.75rem;
          letter-spacing: -0.04em;
        }

        .popup-header p {
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1.5;
        }

        .popup-footer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .popup-install-btn {
          background: #fbbf24;
          color: #1e1b4b;
          border: none;
          padding: 1.15rem;
          border-radius: 1.25rem;
          font-weight: 950;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .popup-install-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(251, 191, 36, 0.3);
        }

        .popup-later-btn {
          background: transparent;
          color: #94a3b8;
          border: none;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0.5rem;
        }
      `}</style>
    </>
  );
}
