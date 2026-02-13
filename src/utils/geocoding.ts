/**
 * City geocoding using OpenStreetMap Nominatim API.
 * Free, no API key needed. Requires User-Agent header per Nominatim policy.
 * Rate limit: max 1 request per second.
 */

export interface GeocodingResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "SolarArrayLayoutApp/1.0";

/**
 * Search for cities matching the query string.
 * Returns up to 5 results with display name and coordinates.
 */
export async function searchCity(
  query: string
): Promise<GeocodingResult[]> {
  if (query.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "5",
    addressdetails: "1",
    featuretype: "city",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  const results: NominatimResult[] = await response.json();

  return results.map((r) => ({
    displayName: r.display_name,
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
  }));
}
