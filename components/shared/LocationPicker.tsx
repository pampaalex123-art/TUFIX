import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from '@reach/combobox';
import '@reach/combobox/styles.css';
import { Coordinates } from '../../types';

interface LocationPickerProps {
  initialCoordinates?: Coordinates;
  initialAddress?: string;
  onLocationSelect: (address: string, coordinates: Coordinates) => void;
  t: (key: string) => string;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.75rem',
};

const defaultCenter = {
  lat: -16.5000, // La Paz, Bolivia default
  lng: -68.1500,
};

const libraries: ("places")[] = ["places"];

const LocationPicker: React.FC<LocationPickerProps> = (props) => {
  const { t } = props;
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
  if (!isLoaded) return <div className="animate-pulse bg-slate-200 h-[300px] rounded-xl flex items-center justify-center text-slate-400">Loading Maps...</div>;

  return <LocationPickerContent {...props} />;
};

const LocationPickerContent: React.FC<LocationPickerProps> = ({ initialCoordinates, initialAddress, onLocationSelect, t }) => {
  const [marker, setMarker] = useState<Coordinates | undefined>(initialCoordinates);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const mapRef = useRef<google.maps.Map | null>(null);

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      locationBias: { radius: 200 * 1000, center: marker || defaultCenter },
    },
    debounce: 300,
  });

  useEffect(() => {
    if (initialAddress) {
      const parts = initialAddress.split(' | Notes: ');
      const baseAddress = parts[0];
      const parsedNotes = parts.length > 1 ? parts[1] : '';
      
      setAddress(baseAddress);
      setValue(baseAddress, false);
      setNotes(parsedNotes);
    }
  }, [initialAddress, setValue]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    // If no marker is set, try to center on user's current location
    if (!marker && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.panTo(pos);
          map.setZoom(14);
        },
        () => {
          console.log("Geolocation permission denied or error.");
        }
      );
    }
  }, [marker]);

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const coords = { lat, lng };
      setMarker(coords);
      
      try {
        const results = await getGeocode({ location: coords });
        const addr = results[0].formatted_address;
        setAddress(addr);
        setValue(addr, false);
        const finalAddress = notes ? `${addr} | Notes: ${notes}` : addr;
        onLocationSelect(finalAddress, coords);
      } catch (error) {
        console.error("Error fetching address: ", error);
      }
    }
  }, [onLocationSelect, setValue, notes]);

  const handleSelect = async (selectedAddress: string) => {
    setValue(selectedAddress, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: selectedAddress });
      const { lat, lng } = await getLatLng(results[0]);
      const coords = { lat, lng };
      setMarker(coords);
      setAddress(selectedAddress);
      const finalAddress = notes ? `${selectedAddress} | Notes: ${notes}` : selectedAddress;
      onLocationSelect(finalAddress, coords);
      mapRef.current?.panTo(coords);
      mapRef.current?.setZoom(15);
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (address && marker) {
      const finalAddress = newNotes ? `${address} | Notes: ${newNotes}` : address;
      onLocationSelect(finalAddress, marker);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-slate-600 mb-1">{t('search_location')}</label>
        <Combobox onSelect={handleSelect}>
          <ComboboxInput
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!ready}
            className="w-full p-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-sm text-slate-900"
            placeholder={t('search_address_placeholder')}
          />
          <ComboboxPopover className="z-50 bg-white shadow-xl rounded-lg border border-slate-200 mt-1">
            <ComboboxList>
              {status === "OK" &&
                data.map(({ place_id, description }) => (
                  <ComboboxOption key={place_id} value={description} className="p-3 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-0" />
                ))}
            </ComboboxList>
          </ComboboxPopover>
        </Combobox>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{t('location_notes')}</label>
        <input
          type="text"
          value={notes}
          onChange={handleNotesChange}
          className="w-full p-3 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none sm:text-sm text-slate-900"
          placeholder={t('location_notes_placeholder')}
        />
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={marker ? 15 : 12}
          center={marker || defaultCenter}
          onClick={handleMapClick}
          onLoad={onMapLoad}
          options={{
            disableDefaultUI: true,
            zoomControl: true,
          }}
        >
          {marker && <Marker position={marker} />}
        </GoogleMap>
      </div>
      <p className="text-xs text-slate-400 italic">
        {t('map_click_hint')}
      </p>
    </div>
  );
};

export default LocationPicker;
