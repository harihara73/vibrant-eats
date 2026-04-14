"use client";

import { useEffect, useRef, useState } from "react";
// @ts-ignore
import { mappls } from "mappls-web-maps";
import { Navigation, MapPin, X, ExternalLink, Play } from "lucide-react";

interface DeliveryRouteMapProps {
  restaurantLoc: { lat: number; lng: number; name: string };
  customerLoc: { lat: number; lng: number; name: string; address: string };
  onClose: () => void;
}

export default function DeliveryRouteMap({ restaurantLoc, customerLoc, onClose }: DeliveryRouteMapProps) {
  const mapRef = useRef<any>(null);
  const mapplsRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const loadMap = async () => {
      try {
        mapplsRef.current = new mappls();
        const apiKey = process.env.NEXT_PUBLIC_MAPPLS_API_KEY || "";
        const loadObject = { map: true, version: "3.0", auth: "legacy" };

        mapplsRef.current.initialize(apiKey, loadObject, () => {
          try {
            const newMap = mapplsRef.current.Map({
              id: "route-map",
              properties: {
                center: [restaurantLoc.lng, restaurantLoc.lat],
                zoom: 12,
                zoomControl: true,
              },
            });

            if (!newMap) return;
            mapRef.current = newMap;

            // 1. Restaurant Marker
            mapplsRef.current.Marker({
              map: newMap,
              position: { lat: restaurantLoc.lat, lng: restaurantLoc.lng },
              icon_url: 'https://maps.google.com/mapfiles/ms/icons/red-pushpin.png',
              popupHtml: `<strong>Restaurant</strong><br>${restaurantLoc.name}`,
            });

            // 2. Customer Marker
            mapplsRef.current.Marker({
              map: newMap,
              position: { lat: customerLoc.lat, lng: customerLoc.lng },
              icon_url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              popupHtml: `<strong>Customer</strong><br>${customerLoc.address}`,
            });

            // 3. Fit bounds to show both points
            const minLng = Math.min(restaurantLoc.lng, customerLoc.lng);
            const maxLng = Math.max(restaurantLoc.lng, customerLoc.lng);
            const minLat = Math.min(restaurantLoc.lat, customerLoc.lat);
            const maxLat = Math.max(restaurantLoc.lat, customerLoc.lat);
            
            newMap.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80 });

            setLoading(false);
          } catch (err) {
            console.error("Route map init error:", err);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Mappls SDK error:", err);
        setLoading(false);
      }
    };

    loadMap();
  }, [restaurantLoc, customerLoc]);

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${restaurantLoc.lat},${restaurantLoc.lng}&destination=${customerLoc.lat},${customerLoc.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="route-map-overlay">
      <div className="route-map-modal">
        <div className="modal-header">
          <div className="header-info">
            <h3>Route to Customer</h3>
            <p>{customerLoc.address}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="map-container-wrapper">
          <div id="route-map" style={{ height: "400px", width: "100%", background: "#f1f5f9" }} />
          {loading && (
            <div className="map-loader">
              <div className="spinner"></div>
              <span>Plotting Route...</span>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="nav-btn primary" onClick={openGoogleMaps}>
            <Play size={18} fill="currentColor" />
            START TURN-BY-TURN NAVIGATION
          </button>
          <button className="nav-btn secondary" onClick={onClose}>
            CLOSE MAP
          </button>
        </div>
      </div>

      <style jsx>{`
        .route-map-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .route-map-modal {
          background: white;
          width: 100%;
          max-width: 600px;
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: modalSlideUp 0.3s ease-out;
        }

        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-header {
          padding: 1.25rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }

        .header-info h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: #1e293b;
        }

        .header-info p {
          margin: 0.25rem 0 0 0;
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 350px;
        }

        .close-btn {
          border: none;
          background: #f1f5f9;
          color: #64748b;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #e2e8f0;
          color: #1e293b;
        }

        .map-container-wrapper {
          position: relative;
        }

        .map-loader {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255,255,255,0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          z-index: 10;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .modal-actions {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .nav-btn {
          width: 100%;
          padding: 1rem;
          border-radius: 1rem;
          font-weight: 800;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .nav-btn.primary {
          background: linear-gradient(135deg, #1e1b4b, #312e81);
          color: white;
          box-shadow: 0 10px 15px -3px rgba(30, 27, 75, 0.4);
        }

        .nav-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -3px rgba(30, 27, 75, 0.5);
        }

        .nav-btn.secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        .nav-btn.secondary:hover {
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
