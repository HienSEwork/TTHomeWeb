export type LatLng = { lat: number; lng: number };
export type Bounds = { north: number; south: number; west: number; east: number };

/** The part of Ho Chi Minh City TTHOME lists in. */
export const CITY_BOUNDS: Bounds = { north: 10.885, south: 10.715, west: 106.64, east: 106.82 };

/** Position as percentages of the map box (x from the left, y from the top), clamped to 0–100. */
export function project(point: LatLng, b: Bounds = CITY_BOUNDS): { x: number; y: number } {
  const clamp = (n: number) => Math.min(100, Math.max(0, n));
  return {
    x: clamp(((point.lng - b.west) / (b.east - b.west)) * 100),
    y: clamp(((b.north - point.lat) / (b.north - b.south)) * 100),
  };
}

/** Smallest bounds holding every point, padded by a share of its size, never smaller than `minSpan` degrees. */
export function fitBounds(points: LatLng[], pad = 0.12, minSpan = 0.03): Bounds {
  if (points.length === 0) return CITY_BOUNDS;
  let north = -Infinity;
  let south = Infinity;
  let west = Infinity;
  let east = -Infinity;
  for (const p of points) {
    north = Math.max(north, p.lat);
    south = Math.min(south, p.lat);
    west = Math.min(west, p.lng);
    east = Math.max(east, p.lng);
  }
  const latSpan = Math.max(north - south, minSpan);
  const lngSpan = Math.max(east - west, minSpan);
  const cLat = (north + south) / 2;
  const cLng = (east + west) / 2;
  return {
    north: cLat + (latSpan / 2) * (1 + pad * 2),
    south: cLat - (latSpan / 2) * (1 + pad * 2),
    west: cLng - (lngSpan / 2) * (1 + pad * 2),
    east: cLng + (lngSpan / 2) * (1 + pad * 2),
  };
}

export function googleMapsUrl(point: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
}

/** The Saigon River through the listed area, as rough waypoints for the overview map. */
export const SAIGON_RIVER: LatLng[] = [
  { lat: 10.89, lng: 106.722 },
  { lat: 10.86, lng: 106.728 },
  { lat: 10.835, lng: 106.718 },
  { lat: 10.818, lng: 106.728 },
  { lat: 10.806, lng: 106.742 },
  { lat: 10.796, lng: 106.733 },
  { lat: 10.789, lng: 106.715 },
  { lat: 10.776, lng: 106.708 },
  { lat: 10.764, lng: 106.712 },
  { lat: 10.756, lng: 106.73 },
  { lat: 10.742, lng: 106.742 },
  { lat: 10.71, lng: 106.756 },
];
