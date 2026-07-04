"use client";

import { useEffect, useRef } from "react";

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: "primary" | "red" | "amber";
  popup?: string;
}

interface MapViewProps {
  markers: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  className?: string;
}

export function MapView({
  markers,
  center,
  zoom = 14,
  height = "300px",
  className = "",
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || markers.length === 0) return;

    // Cleanup anterior
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    import("leaflet").then((L) => {
      // Fix ícono por defecto de Leaflet en Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const mapCenter = center ?? { lat: markers[0].lat, lng: markers[0].lng };

      const map = L.map(mapRef.current!, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const colorMap: Record<string, string> = {
        primary: "#6366f1",
        red: "#ef4444",
        amber: "#f59e0b",
      };

      markers.forEach((marker) => {
        const color = colorMap[marker.color ?? "primary"];

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              width: 32px; height: 32px;
              background: ${color};
              border: 3px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const m = L.marker([marker.lat, marker.lng], { icon }).addTo(map);
        if (marker.popup) {
          m.bindPopup(`<div style="font-size:13px;font-weight:600;">${marker.popup}</div>`);
        }
        if (marker.label) {
          m.bindTooltip(marker.label, { permanent: true, direction: "top", offset: [0, -30] });
        }
      });

      // Ajustar vista si hay múltiples markers
      if (markers.length > 1) {
        const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [markers, center, zoom]);

  // Importar CSS de Leaflet dinámicamente
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  if (markers.length === 0) return null;

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className={`w-full rounded-2xl overflow-hidden border border-border/50 z-0 ${className}`}
    />
  );
}
