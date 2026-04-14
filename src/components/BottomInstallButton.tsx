"use client";

import { usePWA } from "@/context/PWAContext";
import { Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomInstallButtonProps {
  appName: string;
}

export default function BottomInstallButton({ appName }: BottomInstallButtonProps) {
  const { isInstallable, install } = usePWA();

  return (
    <AnimatePresence>
      {isInstallable && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          onClick={install}
          className="bottom-install-btn"
        >
          <Download size={18} />
          <span>Install {appName} App</span>

          <style jsx>{`
            .bottom-install-btn {
              background: #1e1b4b;
              color: #fbbf24;
              border: 1px solid rgba(251, 191, 36, 0.3);
              padding: 0.75rem 1.25rem;
              border-radius: 1rem;
              font-weight: 800;
              font-size: 0.9rem;
              display: flex;
              align-items: center;
              gap: 0.75rem;
              cursor: pointer;
              transition: all 0.3s ease;
              box-shadow: 0 10px 20px rgba(0,0,0,0.1);
              width: fit-content;
            }

            .bottom-install-btn:hover {
              background: #fbbf24;
              color: #1e1b4b;
              transform: translateY(-3px);
              box-shadow: 0 15px 30px rgba(251, 191, 36, 0.2);
            }
          `}</style>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
