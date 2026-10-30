import { LANDMARKS, projectAddress, type ProjectMatch } from "@tthome/data";
import type { MapLandmark, MapPin } from "@/components/map-view";
import { getJitteredCoordinates, seededRandom } from "./location-privacy";

export function toMapPins(matches: ProjectMatch[]): MapPin[] {
  return matches.map(({ project, rooms, minPrice }) => ({
    id: project.id,
    name: project.name,
    href: `/du-an/${project.slug}`,
    address: projectAddress(project),
    image: project.images[0]!,
    lat: project.lat,
    lng: project.lng,
    minPrice,
    vacant: rooms.length,
  }));
}

/**
 * Pins for the public search map with each building moved 250–500 m off its real position. Runs on the
 * server, so the exact coordinates never reach the browser. LOCATION_JITTER_SALT keeps the offsets unguessable.
 */
export function toApproxMapPins(matches: ProjectMatch[]): MapPin[] {
  const salt = process.env.LOCATION_JITTER_SALT ?? "tthome-approx";
  return toMapPins(matches).map((pin) => ({ ...pin, ...getJitteredCoordinates(pin.lat, pin.lng, 500, { random: seededRandom(`${salt}:${pin.id}`) }) }));
}

export function toMapLandmarks(slugs?: string[]): MapLandmark[] {
  return LANDMARKS.filter((l) => !slugs || slugs.includes(l.slug)).map((l) => ({ slug: l.slug, name: l.shortName, lat: l.lat, lng: l.lng }));
}
