import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '../../types';

// Fix default Leaflet marker icons (broken in Vite/webpack)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationPickerProps {
  initialCoordinates?: Coordinates;
  initialAddress?: string;
  onLocationSelect: (address: string, coordinates: Coordinates) => void;
  t: (key: string) => string;
}

// Inner component that handles map click events
const MapClickHandler = ({ onMapClick }: { onMapClick: (coords: Coordinates) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

const DEFAULT_CENTER: Coordinates = { lat: -16.5, lng: -68.15 }; // La Paz, Bolivia

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialCoordinates,
  initialAddress,
  onLocationSelect,
  t,
}) => {
  const [marker, setMarker] = useState<Coordinates | undefined>(initialCoordinates);
  const [address, setAddress] = useState(initialAddress?.split(' | Notes: ')[0] || '');
  const [notes, setNotes] = useState(initialAddress?.split(' | Notes: ')[1] || '');
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Reverse geocode using Nominatim (free, no API key)
  const reverseGeocode = async (coords: Coordinates) => {
    setLoadingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await res.json();
      const addr = data.display_name || `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      setAddress(addr);
      const finalAddress = notes ? `${addr} | Notes: ${notes}` : addr;
      onLocationSelect(finalAddress, coords);
    } catch {
      const fallback = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      setAddress(fallback);
      onLocationSelect(fallback, coords);
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleMapClick = (coords: Coordinates) => {
    setMarker(coords);
    reverseGeocode(coords);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (address && marker) {
      const finalAddress = newNotes ? `${address} | Notes: ${newNotes}` : address;
      onLocationSelect(finalAddress, marker);
    }
  };

  // Try to center on user's location if no initial coords
  useEffect(() => {
    if (!initialCoordinates && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Just update marker without reverse geocoding on load
          // User must tap to confirm location
        },
        () => {}
      );
    }
  }, []);

  const center = marker || initialCoordinates || DEFAULT_CENTER;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          {t('search_location')}
        </label>
        <div className="w-full p-3 bg-slate-100 border-transparent rounded-lg text-sm text-slate-900 min-h-[44px]">
          {loadingAddress ? (
            <span className="text-slate-400 italic">Obteniendo dirección...</span>
          ) : address ? (
            address
          ) : (
            <span className="text-slate-400 italic">{t('search_address_placeholder')}</span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">
          {t('location_notes')}
        </label>
        <input
          type="text"
          value={notes}
          onChange={handleNotesChange}
          className="w-full p-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-sm text-slate-900"
          placeholder={t('location_notes_placeholder')}
        />
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 300 }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={marker ? 15 : 12}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={false}
          // One-finger scroll on mobile: gestureHandling not needed in react-leaflet
          // dragging works with one finger by default on touch devices
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          {marker && <Marker position={[marker.lat, marker.lng]} />}
        </MapContainer>
      </div>

      <p className="text-xs text-slate-400 italic">{t('map_click_hint')}</p>
    </div>
  );
};

export default LocationPicker;