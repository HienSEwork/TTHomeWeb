/** Metres per degree of latitude (and of longitude at the equator). */
const METERS_PER_DEGREE = 111_320;

/**
 * Moves a point a random 250 m to `maxOffsetMeters` in a random direction, so a map never shows where a
 * building really is. Pass a seeded `random` to get the same offset for the same building on every visit.
 */
export function getJitteredCoordinates(
  lat: number,
  lng: number,
  maxOffsetMeters = 500,
  { minOffsetMeters = 250, random = Math.random }: { minOffsetMeters?: number; random?: () => number } = {},
): { lat: number; lng: number } {
  const distance = minOffsetMeters + random() * Math.max(0, maxOffsetMeters - minOffsetMeters);
  const angle = random() * 2 * Math.PI;
  const dLat = (distance * Math.cos(angle)) / METERS_PER_DEGREE;
  const dLng = (distance * Math.sin(angle)) / (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

/**
 * A repeatable random sequence (mulberry32) from a text seed. The same building always lands on the same
 * approximate spot, so reloading the map many times cannot average the offsets back to the real address.
 */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Great-circle distance in metres. */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}
