import React from 'react';
import { Coordinates } from '../../types';
import { MapPin } from 'lucide-react';

interface LocationDisplayProps {
  address: string;
  coordinates?: Coordinates;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ address, coordinates, t }) => {
  const parts = address ? address.split(' | Notes: ') : [];
  const baseAddress = parts[0] || '';
  const notes = parts.length > 1 ? parts[1] : '';

  if (!baseAddress) {
    return (
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-400">{t('no_location_provided')}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <MapPin className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t('location')}</p>
          <p className="text-sm font-medium text-slate-900">{baseAddress}</p>
          {notes && <p className="text-xs text-slate-500 mt-1">{t('location_notes')}: {notes}</p>}
        </div>
      </div>
      {/* Open in maps link */}
      {baseAddress && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(baseAddress)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 ml-11"
        >
          <MapPin className="w-3 h-3" />
          Ver en Google Maps
        </a>
      )}
    </div>
  );
};

export default LocationDisplay;