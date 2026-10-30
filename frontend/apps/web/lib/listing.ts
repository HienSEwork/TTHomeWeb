import { PROJECTS, TODAY, type Project, type Room } from "@tthome/data";
import { vi } from "./i18n/vi";

export type RoomRef = { room: Room; project: Project };

export type Highlight = "fingerprint" | "elevator" | "aircon" | "fridge" | "washer" | "furnished" | "balcony" | "pet" | "parking";

/** Vietnamese highlight labels; other languages read them from their dictionary (`t.labels.highlight`). */
export const HIGHLIGHT_LABEL: Record<Highlight, string> = vi.labels.highlight;

/**
 * The selling points worth showing on a card, most telling first: a smart lock, a lift and the appliances
 * in the room count for more than a window or a bathroom, which every room is expected to have. Only what
 * the data says is true is listed, and at most `limit` of them.
 */
export function roomHighlights({ room, project }: RoomRef, limit = 4): Highlight[] {
  const out: Highlight[] = [];
  if (project.amenities.includes("fingerprint")) out.push("fingerprint");
  if (project.amenities.includes("elevator")) out.push("elevator");
  if (room.amenities.includes("aircon")) out.push("aircon");
  if (room.amenities.includes("fridge")) out.push("fridge");
  if (room.amenities.includes("washer")) out.push("washer");
  if (room.furniture === "full") out.push("furnished");
  if (room.hasBalcony) out.push("balcony");
  if (project.petPolicy !== "none" && project.petPolicy !== "ask_owner") out.push("pet");
  if (project.amenities.includes("parking")) out.push("parking");
  return out.slice(0, limit);
}

const NEW_DAYS = 14;

function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000);
}

export function isNewListing(project: Project): boolean {
  return daysBetween(project.createdAt, TODAY) <= NEW_DAYS;
}

/** One label per card at most: an offer beats "new", which beats "featured". */
export function cardBadge(project: Project, labels: typeof vi.card.badge = vi.card.badge): { label: string; tone: "offer" | "new" | "featured" } | null {
  if (project.promo) return { label: labels.offer, tone: "offer" };
  if (isNewListing(project)) return { label: labels.new, tone: "new" };
  if (project.exclusive) return { label: labels.featured, tone: "featured" };
  return null;
}

/** The cheapest vacant room of each active project, one per project, ordered by `order`. */
function onePerProject(order: (a: Project, b: Project) => number, projects: Project[]): RoomRef[] {
  return projects
    .filter((p) => p.status === "active")
    .sort(order)
    .flatMap((project) => {
      const vacant = project.rooms.filter((r) => r.status === "available").sort((a, b) => a.price - b.price);
      return vacant[0] ? [{ room: vacant[0], project }] : [];
    });
}

/** Rooms people look at most, one per building. */
export function featuredRooms(limit = 5, projects: Project[] = PROJECTS): RoomRef[] {
  return onePerProject((a, b) => b.views - a.views, projects).slice(0, limit);
}

/** Rooms in the buildings listed most recently, one per building. */
export function newestRooms(limit = 5, projects: Project[] = PROJECTS): RoomRef[] {
  return onePerProject((a, b) => b.createdAt.localeCompare(a.createdAt), projects).slice(0, limit);
}
