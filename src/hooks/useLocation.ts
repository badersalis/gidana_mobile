import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { geocodingApi, GeoPlace } from '../api/geocoding';

export interface LocationState {
  place: GeoPlace | null;
  loading: boolean;
  error: string | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({ place: null, loading: false, error: null });

  const requestLocation = useCallback(async (): Promise<GeoPlace | null> => {
    setState({ place: null, loading: true, error: null });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState((s) => ({ ...s, loading: false, error: 'permission_denied' }));
        return null;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const place = await geocodingApi.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setState({ place, loading: false, error: place ? null : 'geocode_failed' });
      return place;
    } catch {
      setState({ place: null, loading: false, error: 'location_failed' });
      return null;
    }
  }, []);

  return { ...state, requestLocation };
}
