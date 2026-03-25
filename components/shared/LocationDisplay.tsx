import React from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { Coordinates } from '../../types';

interface LocationDisplayProps {
  address: string;
  coordinates?: Coordinates;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const mapContainerStyle = {
  width: '100%',
  height: '200px',
};

const libraries: ("places")[] = ["places"];

const LocationDisplay: React.FC<LocationDisplayProps> = ({ address, coordinates, t }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  if (loadError) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <p className="text-sm font-medium text-red-600 mb-1">{t('location_error')}</p>
        <p className="text-xs text-red-500">Please ensure your Google Maps API Key is correctly configured and authorized for this domain.</p>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <p className="text-sm font-medium text-slate-600 mb-1">{t('location')}</p>
        <p className="text-black">{address || t('no_location_provided')}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-600 mb-1">{t('location')}</p>
        <p className="text-black">{address}</p>
      </div>
      <div className="rounded-lg overflow-hidden border border-slate-200">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={coordinates}
            zoom={15}
            options={{
              disableDefaultUI: true,
              draggable: false,
              zoomControl: false,
              scrollwheel: false,
              disableDoubleClickZoom: true,
            }}
          >
            <Marker position={coordinates} />
          </GoogleMap>
        ) : (
          <div style={mapContainerStyle} className="bg-slate-200 animate-pulse flex items-center justify-center">
            <span className="text-slate-400 text-xs">{t('loading_map')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationDisplay;
