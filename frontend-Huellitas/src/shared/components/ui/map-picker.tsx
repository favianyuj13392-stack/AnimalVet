"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, Loader2, X } from "lucide-react";
import { Input } from "./input";

interface MapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number, direccion: string) => void;
  height?: string;
}

const DEFAULT_CENTER = { lat: -16.5, lng: -68.15 };

export function MapPicker({ lat, lng, onChange, height = "360px" }: MapPickerProps) {
  const mapRef       = useRef<HTMLDivElement>(null);
  const mapInstance  = useRef<any>(null);
  const markerRef    = useRef<any>(null);
  const pinIconRef   = useRef<any>(null);

  const [address,       setAddress]       = useState("");
  const [loadingAddr,   setLoadingAddr]   = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const searchTimeout = useRef<any>(null);

  // ── CSS Leaflet ────────────────────────────────────────────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.rel   = "stylesheet";
    link.href  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  // ── Reverse geocoding ──────────────────────────────────────────────────────
  const reverseGeocode = useCallback(async (rlat: number, rlng: number) => {
    setLoadingAddr(true);
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${rlat}&lon=${rlng}&format=json`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await res.json();
      const addr = data.display_name ?? `${rlat.toFixed(5)}, ${rlng.toFixed(5)}`;
      setAddress(addr);
      onChange(rlat, rlng, addr);
      markerRef.current
        ?.bindPopup(`<div style="font-size:12px;max-width:220px;font-weight:600;">${addr}</div>`)
        .openPopup();
    } catch {
      const fallback = `${rlat.toFixed(5)}, ${rlng.toFixed(5)}`;
      setAddress(fallback);
      onChange(rlat, rlng, fallback);
    } finally {
      setLoadingAddr(false);
    }
  }, [onChange]);

  // ── Colocar / mover pin ────────────────────────────────────────────────────
  const placePin = useCallback((rlat: number, rlng: number, L: any) => {
    if (!mapInstance.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([rlat, rlng]);
    } else {
      markerRef.current = L.marker([rlat, rlng], {
        icon: pinIconRef.current,
        draggable: true,
      }).addTo(mapInstance.current);
      markerRef.current.on("dragend", (e: any) => {
        const p = e.target.getLatLng();
        reverseGeocode(p.lat, p.lng);
      });
    }
    mapInstance.current.setView([rlat, rlng], 16);
    reverseGeocode(rlat, rlng);
  }, [reverseGeocode]);

  // ── Inicializar mapa ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; markerRef.current = null; }

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      pinIconRef.current = L.divIcon({
        className: "",
        html: `<div style="
          width:38px;height:38px;
          background:#6366f1;
          border:3px solid white;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 3px 12px rgba(0,0,0,0.4);
        "></div>`,
        iconSize:   [38, 38],
        iconAnchor: [19, 38],
        popupAnchor:[0, -38],
      });

      const center = lat && lng ? { lat, lng } : DEFAULT_CENTER;
      const zoom   = lat && lng ? 15 : 13;

      const map = L.map(mapRef.current!, { center: [center.lat, center.lng], zoom, scrollWheelZoom: true });
      mapInstance.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Pin inicial si ya tiene coords
      if (lat && lng) {
        markerRef.current = L.marker([lat, lng], { icon: pinIconRef.current, draggable: true }).addTo(map);
        markerRef.current.on("dragend", (e: any) => {
          const p = e.target.getLatLng();
          reverseGeocode(p.lat, p.lng);
        });
      }

      // Click en mapa
      map.on("click", (e: any) => placePin(e.latlng.lat, e.latlng.lng, L));

      // Centrar en ubicación del usuario
      if (!lat && !lng && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (p) => map.setView([p.coords.latitude, p.coords.longitude], 15),
          () => {}
        );
      }
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
      markerRef.current   = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Buscador de lugares ────────────────────────────────────────────────────
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setSearchResults([]);
    clearTimeout(searchTimeout.current);
    if (q.trim().length < 3) return;

    setLoadingSearch(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=bo`,
          { headers: { "Accept-Language": "es" } }
        );
        const data = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 500);
  };

  const selectResult = (result: any) => {
    const rlat = parseFloat(result.lat);
    const rlng = parseFloat(result.lon);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    import("leaflet").then((L) => placePin(rlat, rlng, L));
  };

  return (
    <div className="space-y-2">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar lugar en Bolivia..."
          className="pl-9 pr-9 rounded-xl h-10 text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => { setSearchQuery(""); setSearchResults([]); }}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loadingSearch && (
          <div className="absolute right-3 top-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="absolute top-11 left-0 right-0 z-[9999] bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectResult(r)}
                className="w-full text-left px-4 py-2.5 text-xs hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0 flex items-start gap-2"
              >
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mapa */}
      <div
        ref={mapRef}
        style={{ height }}
        className="w-full rounded-2xl overflow-hidden border-2 border-primary/30 cursor-crosshair"
      />

      {/* Estado del pin */}
      {loadingAddr && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse px-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Obteniendo dirección...
        </div>
      )}
      {!loadingAddr && address && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground font-medium leading-relaxed">{address}</p>
        </div>
      )}
      {!loadingAddr && !address && (
        <p className="text-xs text-muted-foreground text-center py-1 italic">
          Busca un lugar arriba o toca directamente en el mapa para marcar el punto
        </p>
      )}
    </div>
  );
}
