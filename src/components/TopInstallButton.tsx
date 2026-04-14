"use client";

import { usePWA } from "@/context/PWAContext";
import { Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function TopInstallButton() {
  const { isInstallable, install } = usePWA();
  const pathname = usePathname();

  // ONLY show on customer routes (not admin or delivery)
  const isCustomerRoute = !pathname.startsWith('/admin') && !pathname.startsWith('/delivery');

  return (
    <AnimatePresence>
      {isInstallable && isCustomerRoute && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={install}
          className="top-install-btn"
          title="Install App"
        >
          <div className="btn-inner">
            <Download size={16} />
            <span className="btn-text">Install App</span>
          </div>

          <style jsx>{`
            .top-install-btn {
              background: #fbbf24;
              color: #1e1b4b;
              border: none;
              padding: 0.4rem 0.8rem;
              border-radius: 0.75rem;
              font-weight: 900;
              font-size: 0.75rem;
              cursor: pointer;
              transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              margin-right: 0.5rem;
              display: flex;
              align-items: center;
              box-shadow: 0 4px 10px rgba(251, 191, 36, 0.2);
            }

            .top-install-btn:hover {
              transform: translateY(-2px);
              background: #f59e0b;
              box-shadow: 0 6px 15px rgba(251, 191, 36, 0.3);
            }

            .btn-inner {
              display: flex;
              align-items: center;
              gap: 0.4rem;
            }

            @media (max-width: 640px) {
              .btn-text {
                display: none;
              }
              .top-install-btn {
                padding: 0.4rem;
                margin-right: 0.25rem;
              }
            }
          `}</style>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
