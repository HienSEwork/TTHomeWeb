import { ROOM_TYPES, type Furniture, type RoomType, type SearchFilters, type SortOption } from "@tthome/data";

/*
 * Filters live in the URL so a search can be shared and indexed:
 * /tim-kiem?q=&landmark=&radius=&exclusive=1&group=pet,ev,promo&price=min-max&type=studio,1pn
 *          &city=&ward=&furniture=&amenity=aircon,washer&balcony=1&window=1&sort=
 */

type Params = Record<string, string | string[] | undefined>;

const FURNITURE: Furniture[] = ["full", "basic", "none"];
const SORTS: SortOption[] = ["newest", "price_asc", "price_desc", "nearest", "popular"];

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}

function list(value: string | string[] | undefined): string[] {
  return (first(value) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

function positiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
}

export function parseSearchParams(params: Params): SearchFilters {
  const groups = new Set(list(params.group));
  const [min, max] = (first(params.price) ?? "").split("-");
  const types = list(params.type).filter((t): t is RoomType => ROOM_TYPES.includes(t as RoomType));
  const furniture = first(params.furniture);
  const sort = first(params.sort);
  const radius = Number(first(params.radius));
  return {
    q: first(params.q),
    city: first(params.city),
    ward: first(params.ward),
    landmark: first(params.landmark),
    radius: Number.isFinite(radius) && radius > 0 ? Math.min(radius, 10) : undefined,
    priceMin: positiveInt(min) || undefined,
    priceMax: positiveInt(max) || undefined,
    types: types.length ? types : undefined,
    furniture: FURNITURE.includes(furniture as Furniture) ? (furniture as Furniture) : undefined,
    amenities: list(params.amenity).length ? list(params.amenity) : undefined,
    pet: groups.has("pet") || undefined,
    ev: groups.has("ev") || undefined,
    promo: groups.has("promo") || undefined,
    exclusive: first(params.exclusive) === "1" || undefined,
    balcony: first(params.balcony) === "1" || undefined,
    window: first(params.window) === "1" || undefined,
    sort: SORTS.includes(sort as SortOption) ? (sort as SortOption) : undefined,
  };
}

/** The inverse of parseSearchParams; drops empty values so URLs stay short. */
export function toSearchQuery(f: SearchFilters): string {
  const q = new URLSearchParams();
  if (f.q) q.set("q", f.q);
  if (f.city) q.set("city", f.city);
  if (f.ward) q.set("ward", f.ward);
  if (f.landmark) q.set("landmark", f.landmark);
  if (f.radius) q.set("radius", String(f.radius));
  if (f.priceMin || f.priceMax) q.set("price", `${f.priceMin ?? 0}-${f.priceMax ?? ""}`);
  if (f.types?.length) q.set("type", f.types.join(","));
  if (f.furniture) q.set("furniture", f.furniture);
  if (f.amenities?.length) q.set("amenity", f.amenities.join(","));
  const groups = [f.pet && "pet", f.ev && "ev", f.promo && "promo"].filter(Boolean);
  if (groups.length) q.set("group", groups.join(","));
  if (f.exclusive) q.set("exclusive", "1");
  if (f.balcony) q.set("balcony", "1");
  if (f.window) q.set("window", "1");
  if (f.sort) q.set("sort", f.sort);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** How many filters are on, not counting the keyword and sort order. */
export function activeFilterCount(f: SearchFilters): number {
  return [
    f.city || f.ward,
    f.landmark,
    f.priceMin || f.priceMax,
    f.types?.length,
    f.furniture,
    f.amenities?.length,
    f.pet,
    f.ev,
    f.promo,
    f.exclusive,
    f.balcony,
    f.window,
  ].filter(Boolean).length;
}
