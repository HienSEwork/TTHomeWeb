/** Typed client for the public search API behind the gateway (search-service). Server-side only. */

export type ApiListing = {
  room_id: string;
  project_code: string;
  room_slug: string;
  project_name: string;
  address: string | null;
  room_type: string;
  price: number | null;
  area_m2: number | null;
  furniture: string | null;
  has_balcony: boolean | null;
  has_window: boolean | null;
  is_exclusive: boolean;
  is_promo: boolean;
  pet_policy: string | null;
  ev_parking: boolean | null;
  amenity_ids: number[];
  cover_url: string | null;
  lat: number | null;
  lng: number | null;
};

export type ApiSearch = { items: ApiListing[]; page: number; limit: number; total: number; total_pages: number };
export type ApiNearby = { total: number; items: { distance_km: number; room: ApiListing }[] };
export type ApiSuggest = { project_code: string; name: string; room_count: number };
export type ApiPin = { room_id: string; lat: number; lng: number; price: number | null; price_label: string; title: string; room_slug: string };
export type ApiMap = { total_pins: number; pins: ApiPin[] };

const BASE = process.env.SEARCH_API_URL ?? "http://localhost:8080";

/** The demo reads its sample data unless SEARCH_API_URL points at a running search-service (it is unset on Vercel). */
export const liveSearchEnabled = () => !!process.env.SEARCH_API_URL;

/** Builds the query string, dropping empty values. */
export function toQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function get<T>(path: string, params: Record<string, string | number | boolean | undefined | null> = {}): Promise<T> {
  const res = await fetch(`${BASE}/api/v1/${path}${toQuery(params)}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Search API ${path} answered ${res.status}`);
  return (await res.json()) as T;
}

export const searchRooms = (p: Record<string, string | number | boolean | undefined>) => get<ApiSearch>("search", p);
export const suggestProjects = (q: string) => get<ApiSuggest[]>("suggest", { q });
export const similarRoomsOf = (roomId: string) => get<ApiListing[]>(`rooms/${roomId}/similar`);
export const nearbyRooms = (p: Record<string, string | number | boolean | undefined>) => get<ApiNearby>("nearby", p);
export const mapPins = (bbox: string, p: Record<string, string | number | boolean | undefined> = {}) => get<ApiMap>("map", { bbox, ...p });
