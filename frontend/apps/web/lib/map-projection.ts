export type LatLng = { lat: number; lng: number };
export type Bounds = { north: number; south: number; west: number; east: number };

/** The part of Cần Thơ TTHOME lists in, from Ô Môn in the north-west to Cái Răng in the south-east. */
export const CITY_BOUNDS: Bounds = { north: 10.13, south: 9.98, west: 105.61, east: 105.83 };

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

/** The Hậu River along the city's north-east edge, as rough waypoints for the overview map. */
export const HAU_RIVER: LatLng[] = [
  { lat: 10.145, lng: 105.62 },
  { lat: 10.13, lng: 105.66 },
  { lat: 10.115, lng: 105.7 },
  { lat: 10.1, lng: 105.735 },
  { lat: 10.08, lng: 105.765 },
  { lat: 10.06, lng: 105.79 },
  { lat: 10.038, lng: 105.8 },
  { lat: 10.02, lng: 105.815 },
  { lat: 9.995, lng: 105.84 },
];

/** The Cần Thơ River from Bến Ninh Kiều south-west past Cái Răng to Phong Điền. */
export const CAN_THO_RIVER: LatLng[] = [
  { lat: 10.0345, lng: 105.7905 },
  { lat: 10.025, lng: 105.785 },
  { lat: 10.012, lng: 105.775 },
  { lat: 10.003, lng: 105.76 },
  { lat: 9.998, lng: 105.74 },
  { lat: 10.0, lng: 105.715 },
  { lat: 10.0, lng: 105.69 },
  { lat: 10.002, lng: 105.665 },
];

/** Every river drawn on the sketch map. */
export const RIVERS: LatLng[][] = [HAU_RIVER, CAN_THO_RIVER];
