"use client";
 
 import { usePWA } from "@/context/PWAContext";
 import { Download } from "lucide-react";
 import { usePathname } from "next/navigation";
 
 export default function TopInstallButton() {
   const { isInstallable, install } = usePWA();
   const pathname = usePathname();
 
   if (!isInstallable) return null;
 
   // Determine label based on path
   let label = "Install App";
   if (pathname.startsWith('/admin')) label = "Install Admin App";
   if (pathname.startsWith('/delivery')) label = "Install Delivery App";
   const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/delivery');
 
   return (
     <button
       onClick={install}
       className={isAdmin ? "ve-pwa-install-pill" : "nav-install-btn customer-theme"}
       title={label}
       style={isAdmin ? { margin: 0, padding: '0.5rem 1rem !important', fontSize: '0.75rem !important', width: 'auto !important' } : {}}
     >
       <Download size={isAdmin ? 14 : 16} />
       <span className="install-btn-text">{label}</span>
 
       {!isAdmin && (
         <style jsx>{`
           .nav-install-btn {
             padding: 0.5rem 1rem;
             border-radius: 2rem;
             font-weight: 800;
             font-size: 0.8rem;
             cursor: pointer;
             display: inline-flex;
             align-items: center;
             gap: 0.5rem;
             transition: all 0.2s ease;
             text-transform: uppercase;
             letter-spacing: 0.05em;
             white-space: nowrap;
             height: fit-content;
             align-self: center;
             border: 2px solid transparent;
             line-height: 1;
           }
 
           .customer-theme {
             background: #fbbf24;
             color: #1e1b4b;
             border-color: rgba(255, 255, 255, 0.4);
           }
 
           .customer-theme:hover {
             background: #f59e0b;
             transform: translateY(-1px);
             box-shadow: 0 4px 12px rgba(251, 191, 36, 0.2);
           }
 
           @media (max-width: 768px) {
             .install-btn-text {
               display: none;
             }
             .nav-install-btn {
               padding: 0.5rem;
               min-width: 36px;
               justify-content: center;
             }
           }
         `}</style>
       )}
     </button>
   );
 }
