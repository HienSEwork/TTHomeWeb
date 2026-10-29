import { LANDMARKS, projectAddress, type ProjectMatch } from "@tthome/data";
import type { MapLandmark, MapPin } from "@/components/map-view";

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

export function toMapLandmarks(slugs?: string[]): MapLandmark[] {
  return LANDMARKS.filter((l) => !slugs || slugs.includes(l.slug)).map((l) => ({ slug: l.slug, name: l.shortName, lat: l.lat, lng: l.lng }));
}
