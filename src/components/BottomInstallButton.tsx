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
          className="ve-pwa-install-pill"
        >
          <Download size={18} />
          <span>Install {appName} App</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
