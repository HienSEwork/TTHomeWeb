import { LANDMARKS, TODAY, type PetPolicy, type Project, type ProjectMatch, type Room, type RoomType, type SearchFilters } from "@tthome/data";
import { nearbyRooms, searchRooms, type ApiListing, type ApiNearby } from "./search-api";

/*
 * Amenity ids mirror inventory.amenity in db/seed_sample_listings.sql of the main repo. That seed still uses the
 * pre-2025 districts and wards, so the post-merger ward filter has no ids to send and the city is matched by area.
 */
const AMENITY_ID: Record<string, number> = { aircon: 1, elevator: 2, washer: 3, fingerprint: 6, fridge: 11, free_hours: 9, security: 12 };
const AMENITY_CODE = new Map(Object.entries(AMENITY_ID).map(([code, id]) => [id, code]));

const SORT: Record<string, string> = { popular: "POPULAR", newest: "NEWEST", price_asc: "PRICE_ASC", price_desc: "PRICE_DESC" };

/** The shared part of /search and /nearby, in API names. */
function commonParams(f: SearchFilters) {
  const amenityIds = f.amenities?.map((a) => AMENITY_ID[a]).filter((id): id is number => id != null);
  return {
    price_min: f.priceMin,
    price_max: f.priceMax,
    room_type: f.types?.join(","),
    amenities: amenityIds?.length ? amenityIds.join(",") : undefined,
    pet: f.pet || undefined,
    ev_parking: f.ev || undefined,
    promo: f.promo || undefined,
  };
}

export function toSearchParams(f: SearchFilters): Record<string, string | number | boolean | undefined> {
  return {
    ...commonParams(f),
    q: f.q,
    furniture: f.furniture,
    balcony: f.balcony || undefined,
    window: f.window || undefined,
    exclusive: f.exclusive || undefined,
    sort: f.sort ? SORT[f.sort] : undefined,
    limit: 50,
  };
}

const PET: PetPolicy[] = ["none", "cat", "small_pet", "ask_owner", "allowed"];

function toRoom(i: ApiListing): Room {
  return {
    id: i.room_id,
    code: i.room_slug,
    projectId: i.project_code,
    name: i.room_slug,
    type: i.room_type as RoomType,
    area: i.area_m2 ?? 0,
    price: i.price ?? 0,
    deposit: i.price ?? 0,
    status: "available",
    availableFrom: TODAY,
    floor: 0,
    furniture: (i.furniture as Room["furniture"]) ?? "none",
    hasWindow: !!i.has_window,
    hasBalcony: !!i.has_balcony,
    maxPeople: 2,
    images: i.cover_url ? [i.cover_url] : [],
    amenities: [],
  };
}

/** Groups API rooms (one per row) into the project cards the site already draws. */
export function toProjectMatches(items: ApiListing[], distances = new Map<string, number>()): ProjectMatch[] {
  const byProject = new Map<string, ApiListing[]>();
  for (const i of items) byProject.set(i.project_code, [...(byProject.get(i.project_code) ?? []), i]);
  return [...byProject.values()].map((rows) => {
    const first = rows[0]!;
    const rooms = rows.map(toRoom);
    const amenityCodes = [...new Set(rows.flatMap((r) => r.amenity_ids).map((id) => AMENITY_CODE.get(id)).filter((c): c is string => !!c))];
    const project: Project = {
      id: first.project_code,
      code: first.project_code,
      slug: first.project_code,
      name: first.project_name,
      street: first.address ?? "",
      wardSlug: "",
      citySlug: "",
      lat: first.lat ?? 0,
      lng: first.lng ?? 0,
      images: first.cover_url ? [first.cover_url] : [],
      hasVideo: false,
      exclusive: first.is_exclusive,
      petPolicy: PET.includes(first.pet_policy as PetPolicy) ? (first.pet_policy as PetPolicy) : "none",
      evParking: !!first.ev_parking,
      promo: rows.some((r) => r.is_promo) ? "Đang có ưu đãi" : null,
      amenities: amenityCodes,
      description: "",
      rules: [],
      fees: { electric: 0, water: 0, service: 0, parking: 0 },
      status: "active",
      views: 0,
      createdAt: TODAY,
      updatedAt: TODAY,
      rooms,
    };
    const dist = rows.map((r) => distances.get(r.room_id)).filter((d): d is number => d != null);
    return { project, rooms, minPrice: Math.min(...rooms.map((r) => r.price)), distanceKm: dist.length ? Math.min(...dist) : null };
  });
}

/** Rooms inside the chosen city: TP.HCM lies north-east of 10.3° N, 106.3° E, TP. Cần Thơ south-west of it. */
const inCity = (city: string | undefined) => (i: ApiListing) => {
  if (!city) return true;
  if (i.lat == null || i.lng == null) return false;
  const hcm = i.lat > 10.3 && i.lng > 106.3;
  return city === "ho-chi-minh" ? hcm : !hcm;
};

/** Project cards for a search. A landmark switches to /nearby, which supports fewer filters but returns distances. */
export async function searchLive(f: SearchFilters): Promise<ProjectMatch[]> {
  // The database has no ids for the new wards; sending none would search the whole city instead.
  if (f.ward) return [];
  const landmark = f.landmark ? LANDMARKS.find((l) => l.slug === f.landmark) : undefined;
  let matches: ProjectMatch[];
  if (landmark) {
    const res: ApiNearby = await nearbyRooms({ ...commonParams(f), lat: landmark.lat, lng: landmark.lng, radius_m: (f.radius ?? 3) * 1000, limit: 50 });
    const distances = new Map(res.items.map((n) => [n.room.room_id, n.distance_km]));
    matches = toProjectMatches(res.items.map((n) => n.room).filter(inCity(f.city)), distances);
  } else {
    matches = toProjectMatches((await searchRooms(toSearchParams(f))).items.filter(inCity(f.city)));
  }
  return f.sort === "nearest" || (landmark && !f.sort) ? matches.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)) : matches;
}
