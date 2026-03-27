import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
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
import { MapPin, Navigation, X, Save, Bookmark } from 'lucide-react';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const libraries: ("places")[] = ["places"];

interface SavedLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface LocationSelectorProps {
  selectedLocation: { address: string; lat: number; lng: number } | null;
  setSelectedLocation: (location: { address: string; lat: number; lng: number } | null) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.75rem'
};

const defaultCenter = {
  lat: -16.5000, // Default to La Paz, Bolivia
  lng: -68.1193
};

const LocationSelector: React.FC<LocationSelectorProps> = ({ selectedLocation, setSelectedLocation }) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [showMapModal, setShowMapModal] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [locationName, setLocationName] = useState('');
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    const loadSavedLocations = async () => {
      if (auth.currentUser) {
        try {
          let userRef = doc(db, 'users', auth.currentUser.uid);
          let userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            userRef = doc(db, 'workers', auth.currentUser.uid);
            userDoc = await getDoc(userRef);
          }
          if (userDoc.exists() && userDoc.data().savedLocations) {
            setSavedLocations(userDoc.data().savedLocations);
            return;
          }
        } catch (e) {
          console.error("Error loading from Firebase", e);
        }
      }
      
      const saved = localStorage.getItem('tufix_saved_locations');
      if (saved) {
        try {
          setSavedLocations(JSON.parse(saved));
        } catch (e) {
          console.error('Error parsing saved locations', e);
        }
      }
    };
    loadSavedLocations();
  }, []);

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

  const openMapModal = () => {
    setShowMapModal(true);
    setIsGettingLocation(true);
    setLocationName('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setMapCenter({ lat, lng });
          setMarkerPosition({ lat, lng });
          setIsGettingLocation(false);
        },
        (error) => {
          console.error('Error getting current location:', error);
          setIsGettingLocation(false);
          // Keep default center if geolocation fails
        }
      );
    } else {
      setIsGettingLocation(false);
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  const handleSaveLocation = async () => {
    let address = `Ubicación seleccionada (${markerPosition.lat.toFixed(4)}, ${markerPosition.lng.toFixed(4)})`;
    
    try {
      const results = await getGeocode({ location: markerPosition });
      if (results && results.length > 0) {
        address = results[0].formatted_address;
      }
    } catch (error) {
      console.warn('No se pudo obtener la dirección exacta, usando coordenadas.', error);
    }

    setValue(address, false);
    setSelectedLocation({ address, lat: markerPosition.lat, lng: markerPosition.lng });
    
    if (locationName.trim()) {
      const newSavedLocation: SavedLocation = {
        name: locationName.trim(),
        address,
        lat: markerPosition.lat,
        lng: markerPosition.lng
      };
      const updatedSavedLocations = [...savedLocations, newSavedLocation];
      setSavedLocations(updatedSavedLocations);
      localStorage.setItem('tufix_saved_locations', JSON.stringify(updatedSavedLocations));

      if (auth.currentUser) {
        try {
          let userRef = doc(db, 'users', auth.currentUser.uid);
          let userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            userRef = doc(db, 'workers', auth.currentUser.uid);
          }
          await updateDoc(userRef, {
            savedLocations: arrayUnion(newSavedLocation)
          });
        } catch (e) {
          console.error("Error saving to Firebase", e);
        }
      }
    }
    
    setShowMapModal(false);
  };

  const selectSavedLocation = (loc: SavedLocation) => {
    setValue(loc.address, false);
    setSelectedLocation({ address: loc.address, lat: loc.lat, lng: loc.lng });
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
            onClick={openMapModal}
            className="px-4 py-3 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors flex items-center gap-2 flex-shrink-0 font-medium"
            title="Use Current Location"
          >
            <Navigation className="w-5 h-5" />
            <span className="hidden sm:inline">Use Current Location</span>
          </button>
        </div>
      </div>

      {savedLocations.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {savedLocations.map((loc, index) => (
            <button
              key={index}
              onClick={() => selectSavedLocation(loc)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
            >
              <Bookmark className="w-3.5 h-3.5 text-purple-600" />
              {loc.name}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-sm text-gray-600 flex items-start gap-2">
          <MapPin className="w-4 h-4 mt-0.5 text-purple-600 flex-shrink-0" />
          <span className="font-medium">
            {selectedLocation ? selectedLocation.address : "No se proporcionó ubicación"}
          </span>
        </p>
      </div>

      {showMapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Seleccionar Ubicación</h3>
              <button onClick={() => setShowMapModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {isGettingLocation && (
                <div className="text-sm text-purple-600 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  Obteniendo tu ubicación...
                </div>
              )}
              
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={15}
                  onClick={handleMapClick}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                  }}
                >
                  <Marker 
                    position={markerPosition} 
                    draggable={true}
                    onDragEnd={handleMarkerDragEnd}
                  />
                </GoogleMap>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Puedes arrastrar el marcador o hacer clic en el mapa para ajustar la ubicación.
              </p>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Guardar como (Opcional)</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ej. Casa, Trabajo, Oficina..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowMapModal(false)}
                className="flex-1 py-2.5 px-4 text-gray-600 font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLocation}
                className="flex-1 py-2.5 px-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {locationName.trim() ? 'Guardar y Usar' : 'Usar Ubicación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
