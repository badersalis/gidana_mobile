const NOMINATIM = 'https://nominatim.openstreetmap.org';
const HEADERS = { 'User-Agent': 'GidanaApp/1.0', Accept: 'application/json' };

export interface GeoPlace {
  displayName: string;
  neighborhood: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
}

function parseAddress(addr: Record<string, string>): Pick<GeoPlace, 'neighborhood' | 'city' | 'country'> {
  return {
    neighborhood:
      addr.suburb || addr.neighbourhood || addr.city_district || addr.district || addr.quarter || '',
    city: addr.city || addr.town || addr.village || addr.municipality || addr.county || '',
    country: addr.country || '',
  };
}

export const geocodingApi = {
  reverseGeocode: async (lat: number, lon: number): Promise<GeoPlace | null> => {
    try {
      const res = await fetch(
        `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        { headers: HEADERS }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return {
        displayName: data.display_name ?? '',
        ...parseAddress(data.address ?? {}),
        lat,
        lon,
      };
    } catch {
      return null;
    }
  },

  autocomplete: async (query: string): Promise<GeoPlace[]> => {
    if (query.length < 2) return [];
    try {
      const res = await fetch(
        `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6`,
        { headers: HEADERS }
      );
      if (!res.ok) return [];
      const data: any[] = await res.json();
      return data.map((item) => ({
        displayName: item.display_name ?? '',
        ...parseAddress(item.address ?? {}),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
    } catch {
      return [];
    }
  },
};
