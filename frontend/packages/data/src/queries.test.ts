import { describe, expect, it } from "vitest";
import { LANDMARKS } from "./catalog";
import { PROJECTS } from "./listings";
import { areaStats, distanceKm, getProjectBySlug, getRoomBySlug, roomSlug, searchProjects, similarRooms } from "./queries";

describe("searchProjects", () => {
  it("only returns vacant rooms inside the price range", () => {
    const results = searchProjects({ priceMax: 5_000_000 });
    expect(results.length).toBeGreaterThan(0);
    for (const match of results) {
      for (const room of match.rooms) {
        expect(room.status).toBe("available");
        expect(room.price).toBeLessThanOrEqual(5_000_000);
      }
      expect(match.minPrice).toBe(Math.min(...match.rooms.map((r) => r.price)));
    }
  });

  it("matches keywords without diacritics", () => {
    const results = searchProjects({ q: "tran van hoai" });
    expect(results.map((r) => r.project.code)).toContain("C2D9A8");
  });

  it("keeps projects that allow pets and have EV parking", () => {
    const results = searchProjects({ pet: true, ev: true });
    for (const { project } of results) {
      expect(project.petPolicy).not.toBe("none");
      expect(project.evParking).toBe(true);
    }
  });

  it("limits results to the radius around a landmark and sorts nearest first", () => {
    const results = searchProjects({ landmark: "dh-can-tho", radius: 3 });
    expect(results.length).toBeGreaterThan(0);
    const distances = results.map((r) => r.distanceKm ?? Infinity);
    expect(distances.every((d) => d <= 3)).toBe(true);
    expect([...distances].sort((a, b) => a - b)).toEqual(distances);
  });

  it("sorts by starting price", () => {
    const prices = searchProjects({ sort: "price_asc" }).map((r) => r.minPrice ?? 0);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });
});

describe("slugs", () => {
  it("finds a project from its SEO slug and from a bare CRM code", () => {
    const project = PROJECTS[0]!;
    expect(getProjectBySlug(project.slug)?.id).toBe(project.id);
    expect(getProjectBySlug(`PRJ-${project.code}`)?.id).toBe(project.id);
    expect(getProjectBySlug("khong-ton-tai")).toBeUndefined();
  });

  it("round-trips a room slug", () => {
    const project = PROJECTS[3]!;
    const room = project.rooms[0]!;
    const slug = roomSlug(room, project);
    expect(slug.startsWith(`${project.wardSlug}-${project.citySlug}-`)).toBe(true);
    expect(getRoomBySlug(slug)?.room.id).toBe(room.id);
  });
});

describe("areaStats", () => {
  it("lists wards with projects, most vacant rooms first", () => {
    const stats = areaStats();
    expect(stats.every((s) => s.projects > 0)).toBe(true);
    const vacant = stats.map((s) => s.vacant);
    expect([...vacant].sort((a, b) => b - a)).toEqual(vacant);
  });
});

describe("similarRooms", () => {
  it("never suggests the same room or a rented one", () => {
    const project = PROJECTS[0]!;
    const room = project.rooms[0]!;
    for (const s of similarRooms(room, project)) {
      expect(s.room.id).not.toBe(room.id);
      expect(s.room.status).toBe("available");
    }
  });
});

describe("distanceKm", () => {
  it("measures Đại học Cần Thơ to Bến Ninh Kiều at roughly 2 km", () => {
    const [ctu, wharf] = [LANDMARKS.find((l) => l.slug === "dh-can-tho")!, LANDMARKS.find((l) => l.slug === "ben-ninh-kieu")!];
    expect(distanceKm(ctu, wharf)).toBeGreaterThan(1.5);
    expect(distanceKm(ctu, wharf)).toBeLessThan(2.5);
  });
});
