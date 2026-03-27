import React, { useState, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from '@reach/combobox';
import '@reach/combobox/styles.css';
import { MapPin, Navigation } from 'lucide-react';

const libraries: ("places")[] = ["places"];

interface LocationSelectorProps {
  selectedLocation: { address: string; lat: number; lng: number } | null;
  setSelectedLocation: (location: { address: string; lat: number; lng: number } | null) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ selectedLocation, setSelectedLocation }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here */
    },
    debounce: 300,
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      setSelectedLocation({ address, lat, lng });
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            const results = await getGeocode({ location: { lat, lng } });
            if (results[0]) {
              const address = results[0].formatted_address;
              setValue(address, false);
              setSelectedLocation({ address, lat, lng });
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
          }
        },
        (error) => {
          console.error('Error getting current location:', error);
          alert('No se pudo obtener la ubicación actual.');
        }
      );
    } else {
      alert('La geolocalización no es soportada por este navegador.');
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-bold text-gray-700">Ubicación del Servicio</label>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Combobox onSelect={handleSelect}>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <ComboboxInput
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={!ready}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all"
                  placeholder="Buscar dirección..."
                />
              </div>
              <ComboboxPopover className="z-50 rounded-xl shadow-lg border border-gray-100 bg-white mt-1">
                <ComboboxList>
                  {status === 'OK' &&
                    data.map(({ place_id, description }) => (
                      <ComboboxOption 
                        key={place_id} 
                        value={description}
                        className="px-4 py-2 hover:bg-purple-50 cursor-pointer text-sm"
                      />
                    ))}
                </ComboboxList>
              </ComboboxPopover>
            </Combobox>
          </div>
          
          <button
            onClick={handleCurrentLocation}
            className="px-4 py-3 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors flex items-center gap-2 flex-shrink-0 font-medium"
            title="Use Current Location"
          >
            <Navigation className="w-5 h-5" />
            <span className="hidden sm:inline">Use Current Location</span>
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-sm text-gray-600 flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
          <span className="font-medium">
            {selectedLocation ? selectedLocation.address : "No se proporcionó ubicación"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LocationSelector;
