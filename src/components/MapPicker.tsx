"use client";

import { useEffect, useState, useRef, useCallback } from "react";
// @ts-ignore
import { mappls } from "mappls-web-maps";
import { Search, MapPin, Loader2, X, Navigation } from "lucide-react";

interface MapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapplsRef = useRef<any>(null);
  const initializedRef = useRef(false);

  // Move both the marker and camera to given coordinates
  const flyToLocation = useCallback((latVal: number, lngVal: number) => {
    if (!mapRef.current || !markerRef.current) return;
    try {
      // Update marker position
      if (typeof markerRef.current.setLngLat === "function") {
        markerRef.current.setLngLat([lngVal, latVal]);
      } else if (typeof markerRef.current.setPosition === "function") {
        markerRef.current.setPosition({ lat: latVal, lng: lngVal });
      }
      // Fly the camera
      if (typeof mapRef.current.flyTo === "function") {
        mapRef.current.flyTo({ center: [lngVal, latVal], zoom: 15, speed: 1.5, essential: true });
      } else if (typeof mapRef.current.setCenter === "function") {
        mapRef.current.setCenter([lngVal, latVal]);
      }
    } catch (err) {
      console.error("flyToLocation error:", err);
    }
  }, []);

  // Auto get GPS on mount
  const detectGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsLoading(false);
        onChange(latitude, longitude);
        flyToLocation(latitude, longitude);
      },
      () => {
        setGpsLoading(false);
        // Silently fail — keep default position
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [flyToLocation, onChange]);

  // Initialize map
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
              id: "mappls-map",
              properties: {
                center: [lat, lng],
                zoom: 14,
                search: false,
                draggable: true,
                zoomControl: true,
              },
            });

            if (!newMap) return;

            // Single marker
            const marker = mapplsRef.current.Marker({
              map: newMap,
              position: { lat, lng },
              draggable: true,
            });

            // Marker drag end → update parent
            if (typeof marker.on === "function") {
              marker.on("dragend", (e: any) => {
                const pos = e.target.getLngLat ? e.target.getLngLat() : null;
                if (pos) onChange(pos.lat, pos.lng);
              });
            }

            // Map click → move marker and update
            const handleClick = (e: any) => {
              const clickLat = e?.lngLat?.lat ?? e?.latlng?.lat;
              const clickLng = e?.lngLat?.lng ?? e?.latlng?.lng;
              if (clickLat != null && clickLng != null) {
                onChange(clickLat, clickLng);
                try {
                  if (typeof marker.setLngLat === "function") {
                    marker.setLngLat([clickLng, clickLat]);
                  } else if (typeof marker.setPosition === "function") {
                    marker.setPosition({ lat: clickLat, lng: clickLng });
                  }
                } catch {}
              }
            };

            if (typeof newMap.on === "function") {
              newMap.on("click", handleClick);
            } else if (typeof newMap.addListener === "function") {
              newMap.addListener("click", handleClick);
            }

            mapRef.current = newMap;
            markerRef.current = marker;
            setMapReady(true);

            // Auto detect GPS after map is ready
            detectGPS();
          } catch (err) {
            console.error("Map init error:", err);
          }
        });
      } catch (err) {
        console.error("Mappls SDK error:", err);
      }
    };

    loadMap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When parent lat/lng changes (from search selection), fly to it
  const prevLatRef = useRef(lat);
  const prevLngRef = useRef(lng);
  useEffect(() => {
    if (!mapReady) return;
    if (lat === prevLatRef.current && lng === prevLngRef.current) return;
    prevLatRef.current = lat;
    prevLngRef.current = lng;
    flyToLocation(lat, lng);
  }, [lat, lng, mapReady, flyToLocation]);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.length < 3) { setResults([]); return; }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=10`
        );
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectResult = (res: any) => {
    const latNum = parseFloat(res.lat);
    const lngNum = parseFloat(res.lon);
    // Directly fly the map — don't wait for prop round-trip
    flyToLocation(latNum, lngNum);
    onChange(latNum, lngNum);
    setResults([]);
    setQuery("");
  };

  return (
    <div style={{ 
      height: "var(--map-h, 400px)", 
      width: "100%", 
      borderRadius: "1.25rem", 
      overflow: "hidden", 
      border: "2px solid #e2e8f0", 
      position: "relative", 
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      touchAction: "none"
    }}>

      {/* Search + GPS Overlay */}
      <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", right: "0.75rem", zIndex: 1000, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {/* Search Input */}
          <div style={{ flex: 1, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderRadius: "0.875rem", padding: "0.5rem 0.875rem", display: "flex", alignItems: "center", gap: "0.6rem", boxShadow: "0 8px 20px rgba(0,0,0,0.12)", border: "1px solid rgba(0,0,0,0.07)" }}>
            <Search size={16} color="#64748b" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Search city, area or street..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
              style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "0.875rem", fontWeight: 600, color: "#1e1b4b", padding: "0.35rem 0" }}
            />
            {searching
              ? <Loader2 size={16} color="#f59e0b" style={{ animation: "spin 1s linear infinite" }} />
              : query && <button onClick={() => { setQuery(""); setResults([]); }} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex" }}><X size={16} color="#94a3b8" /></button>
            }
          </div>

          {/* GPS Button */}
          <button
            onClick={detectGPS}
            disabled={gpsLoading}
            title="Detect my location"
            style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.07)", borderRadius: "0.875rem", padding: "0 0.875rem", display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", boxShadow: "0 8px 20px rgba(0,0,0,0.12)", color: "#1e1b4b", fontWeight: 700, fontSize: "0.8rem", whiteSpace: "nowrap" }}
          >
            {gpsLoading
              ? <Loader2 size={16} color="#f59e0b" style={{ animation: "spin 1s linear infinite" }} />
              : <Navigation size={16} color="#1e1b4b" strokeWidth={2.5} />
            }
            My Location
          </button>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.99)", borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 16px 40px rgba(0,0,0,0.18)", border: "1px solid rgba(0,0,0,0.06)", maxHeight: "220px", overflowY: "auto" }}>
            {results.map((res, i) => (
              <button
                key={i}
                onClick={() => selectResult(res)}
                style={{ width: "100%", padding: "0.75rem 1rem", textAlign: "left", border: "none", background: "transparent", borderBottom: i < results.length - 1 ? "1px solid #f1f5f9" : "none", display: "flex", alignItems: "flex-start", gap: "0.6rem", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <MapPin size={14} color="#f59e0b" style={{ marginTop: "2px", flexShrink: 0 }} />
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#334155", lineHeight: 1.4 }}>
                  {res.display_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mappls Map Canvas */}
      <div id="mappls-map" style={{ height: "100%", width: "100%", background: "#f1f5f9" }} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        :root { --map-h: 400px; }
        @media (max-width: 640px) {
          :root { --map-h: 320px; }
        }
      `}</style>
    </div>
  );
}
