import { normalizeVi } from "@tthome/ui";
import { AMENITY_NAME, CITIES, findCity, findLandmark, findWard, PRICE_BANDS } from "./catalog";
import { PROJECTS } from "./listings";
import type { AreaStat, Project, ProjectMatch, Room, RoomType, SearchFilters, SortOption } from "./types";

const EARTH_KM = 6371;

/** Great-circle distance in km. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

export function isListed(room: Room): boolean {
  return room.status === "available" || room.status === "reserved";
}

export function vacantRooms(project: Project): Room[] {
  return project.rooms.filter((r) => r.status === "available");
}

export function minPrice(rooms: Room[]): number | null {
  if (rooms.length === 0) return null;
  return Math.min(...rooms.map((r) => r.price));
}

export function projectAddress(project: Project): string {
  const city = findCity(project.citySlug);
  const ward = findWard(project.citySlug, project.wardSlug);
  return [project.street, ward?.name, city?.name].filter(Boolean).join(", ");
}

export function projectRoomTypes(project: Project): RoomType[] {
  return [...new Set(project.rooms.map((r) => r.type))];
}

/** Up to `limit` amenity names a card should show first. */
export function highlightAmenities(project: Project, limit = 4): string[] {
  return project.amenities.slice(0, limit).map((code) => AMENITY_NAME[code] ?? code);
}

function roomMatches(room: Room, project: Project, f: SearchFilters): boolean {
  if (room.status !== "available") return false;
  if (f.priceMin != null && room.price < f.priceMin) return false;
  if (f.priceMax != null && room.price > f.priceMax) return false;
  if (f.types?.length && !f.types.includes(room.type)) return false;
  if (f.furniture && room.furniture !== f.furniture) return false;
  if (f.balcony && !room.hasBalcony) return false;
  if (f.window && !room.hasWindow) return false;
  if (f.amenities?.length) {
    const all = new Set([...room.amenities, ...project.amenities]);
    if (!f.amenities.every((a) => all.has(a))) return false;
  }
  return true;
}

function projectMatches(project: Project, f: SearchFilters): boolean {
  if (project.status !== "active") return false;
  if (f.city && project.citySlug !== f.city) return false;
  if (f.ward && project.wardSlug !== f.ward) return false;
  if (f.pet && project.petPolicy === "none") return false;
  if (f.ev && !project.evParking) return false;
  if (f.promo && !project.promo) return false;
  if (f.exclusive && !project.exclusive) return false;
  if (f.q) {
    const needle = normalizeVi(f.q);
    const haystack = normalizeVi(
      [project.name, projectAddress(project), project.code, findWard(project.citySlug, project.wardSlug)?.formerArea ?? ""].join(" "),
    );
    if (!needle.split(/\s+/).every((word) => haystack.includes(word))) return false;
  }
  return true;
}

const sorters: Record<SortOption, (a: ProjectMatch, b: ProjectMatch) => number> = {
  newest: (a, b) => b.project.createdAt.localeCompare(a.project.createdAt),
  price_asc: (a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity),
  price_desc: (a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0),
  nearest: (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
  popular: (a, b) => b.project.views - a.project.views,
};

/** Projects with at least one vacant room matching the filters, sorted. */
export function searchProjects(filters: SearchFilters = {}, projects: Project[] = PROJECTS): ProjectMatch[] {
  const landmark = filters.landmark ? findLandmark(filters.landmark) : undefined;
  const radius = filters.radius ?? 3;
  const results: ProjectMatch[] = [];
  for (const project of projects) {
    if (!projectMatches(project, filters)) continue;
    const distance = landmark ? distanceKm(landmark, project) : null;
    if (distance != null && distance > radius) continue;
    const rooms = project.rooms.filter((r) => roomMatches(r, project, filters));
    if (rooms.length === 0) continue;
    results.push({ project, rooms, minPrice: minPrice(rooms), distanceKm: distance });
  }
  const sort = filters.sort ?? (landmark ? "nearest" : "popular");
  return results.sort(sorters[sort]);
}

/** Vacant rooms and starting price per ward, most vacant first. */
export function areaStats(projects: Project[] = PROJECTS): AreaStat[] {
  const stats: AreaStat[] = [];
  for (const city of CITIES) {
    for (const ward of city.wards) {
      const here = projects.filter((p) => p.status === "active" && p.wardSlug === ward.slug && p.citySlug === city.slug);
      const vacant = here.flatMap(vacantRooms);
      stats.push({ city, ward, projects: here.length, vacant: vacant.length, minPrice: minPrice(vacant) });
    }
  }
  return stats.filter((s) => s.projects > 0).sort((a, b) => b.vacant - a.vacant);
}

export function cityStats(citySlug: string, projects: Project[] = PROJECTS) {
  const here = projects.filter((p) => p.status === "active" && p.citySlug === citySlug);
  const vacant = here.flatMap(vacantRooms);
  return { projects: here.length, vacant: vacant.length, minPrice: minPrice(vacant) };
}

const PROJECT_CODE = /-PRJ-([A-Z0-9]+)$/i;

/** Accepts "/du-an/{slug}-PRJ-{code}" slugs, and a bare "PRJ-{code}" like the CRM links. */
export function getProjectBySlug(slug: string): Project | undefined {
  const match = PROJECT_CODE.exec(`-${slug}`);
  if (!match?.[1]) return undefined;
  const code = match[1].toUpperCase();
  return PROJECTS.find((p) => p.code === code);
}

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find((p) => p.id === id);
}

/** "/phong/{phuong}-{quan}-{du-an}-{ma-phong}" */
export function roomSlug(room: Room, project: Project): string {
  const projectPart = project.slug.replace(PROJECT_CODE, "");
  return `${project.wardSlug}-${project.citySlug}-${projectPart}-${room.code.toLowerCase()}`;
}

export function getRoomBySlug(slug: string): { room: Room; project: Project } | undefined {
  const code = slug.split("-").pop()?.toUpperCase();
  if (!code) return undefined;
  for (const project of PROJECTS) {
    const room = project.rooms.find((r) => r.code === code);
    if (room) return { room, project };
  }
  return undefined;
}

/** Vacant rooms in the same city within ±25% of the price, nearest price first. */
export function similarRooms(room: Room, project: Project, limit = 6): { room: Room; project: Project }[] {
  const candidates: { room: Room; project: Project; gap: number }[] = [];
  for (const p of PROJECTS) {
    for (const r of p.rooms) {
      if (r.id === room.id || r.status !== "available") continue;
      const gap = Math.abs(r.price - room.price) / room.price;
      const sameArea = p.citySlug === project.citySlug;
      if (gap <= 0.25 && (sameArea || gap <= 0.08)) candidates.push({ room: r, project: p, gap: sameArea ? gap : gap + 0.5 });
    }
  }
  return candidates.sort((a, b) => a.gap - b.gap).slice(0, limit).map(({ room: r, project: p }) => ({ room: r, project: p }));
}

export type Collection = { slug: string; title: string; description: string; href: string; filters: SearchFilters };

/** The home page shelves, each a saved search with a "see all" link. */
export const COLLECTIONS: Collection[] = [
  { slug: "pho-bien", title: "Được xem nhiều", description: "Những tòa nhà người thuê hỏi nhiều nhất tuần này", href: "/tim-kiem?sort=popular", filters: { sort: "popular" } },
  { slug: "duoi-5-trieu", title: "Dưới 5 triệu", description: "Phòng trống có giá thuê từ 5 triệu trở xuống", href: "/tim-kiem?price=0-5000000", filters: { priceMax: 5_000_000, sort: "price_asc" } },
  { slug: "doc-quyen", title: "Chỉ có trên TTHome", description: "Tòa nhà TTHome quản lý trực tiếp, xem phòng không qua trung gian", href: "/tim-kiem?exclusive=1", filters: { exclusive: true } },
  { slug: "thu-cung", title: "Cho nuôi thú cưng", description: "Mang theo mèo hoặc chó nhỏ", href: "/tim-kiem?group=pet", filters: { pet: true } },
  { slug: "xe-dien", title: "Có chỗ sạc xe điện", description: "Hầm xe có ổ sạc cho xe máy điện", href: "/tim-kiem?group=ev", filters: { ev: true } },
  { slug: "uu-dai", title: "Đang có ưu đãi", description: "Giảm tiền tháng đầu, tiền cọc hoặc phí dịch vụ", href: "/tim-kiem?group=promo", filters: { promo: true } },
  { slug: "studio", title: "Căn studio", description: "Một không gian, bếp và WC riêng cho một hoặc hai người", href: "/tim-kiem?type=studio", filters: { types: ["studio"] } },
];

export function priceBand(slug: string) {
  return PRICE_BANDS.find((b) => b.slug === slug);
}
