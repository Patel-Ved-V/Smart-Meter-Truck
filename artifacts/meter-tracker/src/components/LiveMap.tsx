import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TruckLocation } from '@workspace/api-client-react';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (isWarning: boolean) => {
  const color = isWarning ? '#ef4444' : '#10b981'; // red for warning, emerald for ready
  return L.divIcon({
    className: 'custom-truck-marker',
    html: `
      <div style="
        background-color: ${color}; 
        width: 24px; 
        height: 24px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

interface LiveMapProps {
  locations: TruckLocation[];
  truckStatuses?: Record<number, string>; // Maps truckId to 'READY' | 'WARNING'
}

// Component to handle auto-fitting bounds when locations change
function MapBounds({ locations }: { locations: TruckLocation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map]); // intentionally omitting locations to only fit bounds on initial load

  return null;
}

export function LiveMap({ locations, truckStatuses = {} }: LiveMapProps) {
  // Default center if no locations (India approx center for demo)
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  
  if (typeof window === 'undefined') return null;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-inner border border-border/50 bg-muted/20 relative z-0">
      <MapContainer 
        center={locations.length > 0 ? [locations[0].lat, locations[0].lng] : defaultCenter} 
        zoom={5} 
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {locations.map((loc) => {
          const status = truckStatuses[loc.truckId] || 'READY';
          const isWarning = status === 'WARNING';
          
          return (
            <Marker 
              key={loc.truckId} 
              position={[loc.lat, loc.lng]}
              icon={createCustomIcon(isWarning)}
            >
              <Popup className="rounded-xl shadow-lg border-0">
                <div className="p-1 min-w-[120px]">
                  <p className="font-display font-bold text-base mb-1">{loc.numberPlate}</p>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isWarning ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                  }`}>
                    {status}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Updated: {new Date(loc.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
        <MapBounds locations={locations} />
      </MapContainer>
    </div>
  );
}
