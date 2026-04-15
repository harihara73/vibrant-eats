"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface PWAContextType {
  deferredPrompt: any;
  isInstallable: boolean;
  install: () => Promise<void>;
  isAppInstalled: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

   useEffect(() => {
     const checkPrompt = () => {
       if ((window as any).pwa_prompt) {
         console.info('PWA: Found captured prompt, setting installable = true');
         setDeferredPrompt((window as any).pwa_prompt);
         setIsInstallable(true);
       }
     };
 
     // Check on mount and also periodically since manifests might change
     checkPrompt();
     const probeInterval = setInterval(checkPrompt, 1000);
 
     // Check if already installed
     if (window.matchMedia('(display-mode: standalone)').matches) {
       console.info('PWA: Already installed in standalone mode');
       setIsAppInstalled(true);
     }
 
     // Register Service Worker
     if ('serviceWorker' in navigator) {
       navigator.serviceWorker.register('/sw.js').then(
         (registration) => {
           console.info('PWA: SW registered');
         },
         (registrationError) => {
           console.error('PWA: SW registration failed', registrationError);
         }
       );
     }
 
     const handler = (e: any) => {
       console.info('PWA: beforeinstallprompt handler triggered');
       e.preventDefault();
       setDeferredPrompt(e);
       setIsInstallable(true);
       (window as any).pwa_prompt = e; // Store globally too
     };
 
     const installedHandler = () => {
       console.info('PWA: App successfully installed');
       setIsAppInstalled(true);
       setIsInstallable(false);
       (window as any).pwa_prompt = null;
     };
 
     window.addEventListener("beforeinstallprompt", handler);
     window.addEventListener("appinstalled", installedHandler);
 
     return () => {
       clearInterval(probeInterval);
       window.removeEventListener("beforeinstallprompt", handler);
       window.removeEventListener("appinstalled", installedHandler);
     };
   }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <PWAContext.Provider value={{ deferredPrompt, isInstallable, install, isAppInstalled }}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}
