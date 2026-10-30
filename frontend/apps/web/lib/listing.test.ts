import { describe, expect, it } from "vitest";
import { PROJECTS, TODAY, type Project, type Room } from "@tthome/data";
import { cardBadge, featuredRooms, newestRooms, roomHighlights } from "./listing";

const base = PROJECTS[0]!;
const room = (patch: Partial<Room>): Room => ({ ...base.rooms[0]!, ...patch });
const project = (patch: Partial<Project>): Project => ({ ...base, ...patch });

describe("roomHighlights", () => {
  it("leads with the smart lock, lift and appliances, at most four", () => {
    const ref = { room: room({ furniture: "full", hasBalcony: true, amenities: ["aircon", "private_wc", "fridge"] }), project: project({ petPolicy: "allowed", amenities: ["fingerprint", "elevator"] }) };
    expect(roomHighlights(ref)).toEqual(["fingerprint", "elevator", "aircon", "fridge"]);
  });

  it("never sells a window or a bathroom, and skips pets the owner must approve", () => {
    const ref = { room: room({ furniture: "basic", hasBalcony: false, hasWindow: true, amenities: ["private_wc"] }), project: project({ petPolicy: "ask_owner", amenities: [] }) };
    expect(roomHighlights(ref)).toEqual([]);
  });
});

describe("cardBadge", () => {
  it("prefers an offer, then a new listing, then featured", () => {
    expect(cardBadge(project({ promo: "Giảm 50%", createdAt: TODAY }))?.label).toBe("Ưu đãi");
    expect(cardBadge(project({ promo: null, createdAt: TODAY }))?.label).toBe("Mới");
    expect(cardBadge(project({ promo: null, createdAt: "2026-01-01", exclusive: true }))?.label).toBe("Nổi bật");
    expect(cardBadge(project({ promo: null, createdAt: "2026-01-01", exclusive: false }))).toBeNull();
  });
});

describe("featured and newest rooms", () => {
  it("returns five vacant rooms from five different buildings", () => {
    for (const list of [featuredRooms(5), newestRooms(5)]) {
      expect(list).toHaveLength(5);
      expect(new Set(list.map((r) => r.project.id)).size).toBe(5);
      expect(list.every((r) => r.room.status === "available")).toBe(true);
    }
  });

  it("orders newest by listing date", () => {
    const dates = newestRooms(5).map((r) => r.project.createdAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});
