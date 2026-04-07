import React, { useState } from 'react';
import { Coordinates } from '../../types';
import { MapPin, Eye } from 'lucide-react';

interface WorkerLocationDisplayProps {
  address: string;
  coordinates?: Coordinates;
  isPaid: boolean;
  t: (key: string) => string;
}

// Approximate radius map using OpenStreetMap (free, no API key needed)
// Shows a ~500m radius circle so worker knows the area but not the exact address
const ApproximateMap: React.FC<{ coordinates: Coordinates }> = ({ coordinates }) => {
  const [showMap, setShowMap] = useState(false);

  // Slightly offset the center by a small random amount for privacy
  const offsetLat = coordinates.lat + (Math.random() - 0.5) * 0.002;
  const offsetLng = coordinates.lng + (Math.random() - 0.5) * 0.002;

  // OpenStreetMap embed URL with a marker at the approximate location
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${offsetLng - 0.008},${offsetLat - 0.006},${offsetLng + 0.008},${offsetLat + 0.006}&layer=mapnik&marker=${offsetLat},${offsetLng}`;

  if (!showMap) {
    return (
      <button
        onClick={() => setShowMap(true)}
        className="w-full h-32 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-dashed border-purple-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-purple-400 transition-all group"
      >
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition">
          <Eye className="w-5 h-5 text-purple-600" />
        </div>
        <p className="text-sm font-bold text-purple-700">Ver zona aproximada</p>
        <p className="text-xs text-purple-400">Radio ~500m — dirección exacta al aceptar</p>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden border border-gray-200" style={{ height: '200px' }}>
        <iframe
          src={osmUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Ubicación aproximada del trabajo"
          loading="lazy"
        />
        {/* Overlay circle to indicate approximate area */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-purple-500 bg-purple-400/20 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-purple-700" />
          </div>
        </div>
        {/* Privacy banner */}
        <div className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center">
          <p className="text-xs font-bold text-gray-700">📍 Zona aproximada — ~500m de radio</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 text-center">La dirección exacta se revelará una vez que aceptes el trabajo</p>
    </div>
  );
};

const WorkerLocationDisplay: React.FC<WorkerLocationDisplayProps> = ({ address, coordinates, isPaid, t }) => {
  const parts = address ? address.split(' | Notes: ') : [];
  const baseAddress = parts[0] || '';
  const notes = parts.length > 1 ? parts[1] : '';

  if (!isPaid) {
    // Show approximate map with radius circle
    return (
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">
            Dirección exacta disponible después de que el cliente pague
          </p>
        </div>
        {coordinates && <ApproximateMap coordinates={coordinates} />}
      </div>
    );
  }

  // Job is paid — show full address as text (no map)
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <MapPin className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Dirección del trabajo</p>
          <p className="text-sm font-bold text-gray-900">{baseAddress || t('no_location_provided')}</p>
          {notes && <p className="text-xs text-gray-500 mt-1">Notas: {notes}</p>}
        </div>
      </div>
      {/* Link to open in maps app */}
      {baseAddress && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(baseAddress)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-bold text-green-700 hover:text-green-900 mt-2 bg-green-100 px-3 py-2 rounded-lg w-fit"
        >
          <MapPin className="w-3 h-3" />
          Abrir en Google Maps
        </a>
      )}
    </div>
  );
};

export default WorkerLocationDisplay;