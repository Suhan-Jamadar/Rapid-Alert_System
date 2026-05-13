// Geocoding using Google Maps Geocoding API
// Requires VITE_GOOGLE_MAPS_API_KEY in .env
// Falls back to Nominatim (OpenStreetMap) if key is not set

export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
}

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

// async function geocodeGoogle(address: string): Promise<GeoResult | null> {
//   const query = encodeURIComponent(`${address}, India`);
//   const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&region=in&key=${GOOGLE_KEY}`;

//   const res = await fetch(url);
//   if (!res.ok) return null;

//   const data = await res.json();
//   if (data.status !== 'OK' || !data.results?.length) return null;

//   const top = data.results[0];
//   return {
//     lat: top.geometry.location.lat,
//     lng: top.geometry.location.lng,
//     displayName: top.formatted_address,
//   };
// }
async function geocodeGoogle(address: string): Promise<GeoResult | null> {
  const query = `${address}, India`;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=in&key=${GOOGLE_KEY}`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== 'OK' || !data.results?.length) return null;

  const top = data.results[0];

  return {
    lat: top.geometry.location.lat,
    lng: top.geometry.location.lng,
    displayName: top.formatted_address,
  };
}
async function geocodeNominatim(address: string): Promise<GeoResult | null> {
  const query = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=in`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data?.length) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  try {
    if (GOOGLE_KEY) {
      return await geocodeGoogle(address);
    }
    // Fallback: Nominatim (free, no key, slightly less accurate)
    return await geocodeNominatim(address);
  } catch (err) {
    console.warn('Geocoding failed:', err);
    return null;
  }
}
