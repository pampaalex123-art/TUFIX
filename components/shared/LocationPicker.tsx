import React, { useState, useEffect, useRef } from 'react';
import { Coordinates } from '../../types';

interface LocationPickerProps {
  initialCoordinates?: Coordinates;
  initialAddress?: string;
  onLocationSelect: (address: string, coordinates: Coordinates) => void;
  t: (key: string) => string;
}

const DEFAULT_CENTER: Coordinates = { lat: -16.5, lng: -68.15 }; // La Paz, Bolivia

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialCoordinates,
  initialAddress,
  onLocationSelect,
  t,
}) => {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const [address, setAddress] = useState(initialAddress?.split(' | Notes: ')[0] || '');
  const [notes, setNotes] = useState(initialAddress?.split(' | Notes: ')[1] || '');
  const [coords, setCoords] = useState<Coordinates | null>(initialCoordinates || null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const leafletLoadedRef = useRef(false);

  const reverseGeocode = async (c: Coordinates) => {
    setLoadingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${c.lat}&lon=${c.lng}&format=json`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await res.json();
      const addr = data.display_name || `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
      setAddress(addr);
      const finalAddress = notes ? `${addr} | Notes: ${notes}` : addr;
      onLocationSelect(finalAddress, c);
    } catch {
      const fallback = `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`;
      setAddress(fallback);
      onLocationSelect(fallback, c);
    } finally {
      setLoadingAddress(false);
    }
  };

  // Load Leaflet from CDN and initialize map
  useEffect(() => {
    if (leafletLoadedRef.current) return;
    leafletLoadedRef.current = true;

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapDivRef.current || mapRef.current) return;

      const center = initialCoordinates || DEFAULT_CENTER;

      const map = L.map(mapDivRef.current, {
        center: [center.lat, center.lng],
        zoom: initialCoordinates ? 15 : 13,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Fix default marker icon
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (initialCoordinates) {
        markerRef.current = L.marker([initialCoordinates.lat, initialCoordinates.lng]).addTo(map);
      }

      map.on('click', (e: any) => {
        const newCoords: Coordinates = { lat: e.latlng.lat, lng: e.latlng.lng };
        setCoords(newCoords);

        if (markerRef.current) {
          markerRef.current.setLatLng([newCoords.lat, newCoords.lng]);
        } else {
          markerRef.current = L.marker([newCoords.lat, newCoords.lng]).addTo(map);
        }

        reverseGeocode(newCoords);
      });

      mapRef.current = map;
      setMapReady(true);

      // Try to center on user's location
      if (!initialCoordinates && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            map.setView([userCoords.lat, userCoords.lng], 14);
          },
          () => {}
        );
      }
    };

    // Check if Leaflet is already loaded
    if ((window as any).L) {
      setTimeout(initMap, 50);
      return;
    }

    // Load CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setTimeout(initMap, 50);
      document.head.appendChild(script);
    } else {
      // Script tag exists but may still be loading
      const existingScript = document.getElementById('leaflet-js') as HTMLScriptElement;
      existingScript.addEventListener('load', () => setTimeout(initMap, 50));
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (address && coords) {
      const finalAddress = newNotes ? `${address} | Notes: ${newNotes}` : address;
      onLocationSelect(finalAddress, coords);
    }
  };

  return (
    <div className="space-y-3">
      {/* Address display */}
      <div className="w-full p-3 bg-slate-100 border border-transparent rounded-lg text-sm text-slate-900 min-h-[44px]">
        {loadingAddress ? (
          <span className="text-slate-400 italic">Obteniendo dirección...</span>
        ) : address ? (
          <span>{address}</span>
        ) : (
          <span className="text-slate-400 italic">Tocá el mapa para seleccionar tu ubicación</span>
        )}
      </div>

      {/* Notes input */}
      <input
        type="text"
        value={notes}
        onChange={handleNotesChange}
        className="w-full p-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm text-slate-900"
        placeholder={t('location_notes_placeholder')}
      />

      {/* Map container */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm relative" style={{ height: 280 }}>
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Cargando mapa...</p>
            </div>
          </div>
        )}
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <p className="text-xs text-slate-400 italic">Tocá en el mapa para seleccionar la ubicación exacta del trabajo</p>
    </div>
  );
};

export default LocationPicker;