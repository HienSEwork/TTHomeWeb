import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiListing } from "./search-api";
import { districtId, searchLive, toProjectMatches, toSearchParams, wardId } from "./search-live";

const row = (over: Partial<ApiListing> = {}): ApiListing => ({
  room_id: "r1", project_code: "PRJ-A", room_slug: "a-1", project_name: "Nhà A", address: "1 Đường 3/2", room_type: "studio",
  price: 4_000_000, area_m2: 25, furniture: "full", has_balcony: true, has_window: true, is_exclusive: false, is_promo: false,
  pet_policy: "allowed", ev_parking: true, amenity_ids: [1, 99], cover_url: "http://img", lat: 10.03, lng: 105.77, ...over,
});

describe("toSearchParams", () => {
  it("maps site filters to API names", () => {
    const p = toSearchParams({ q: "x", priceMax: 5_000_000, types: ["studio", "1pn"], amenities: ["aircon", "kitchen"], ev: true, sort: "price_asc", district: "ninh-kieu", ward: "xuan-khanh" });
    expect(p).toMatchObject({ q: "x", price_max: 5_000_000, room_type: "studio,1pn", amenities: "1", ev_parking: true, sort: "PRICE_ASC", district_id: 916, ward_id: 31147, limit: 50 });
  });
});

describe("ids", () => {
  it("uses the Can Tho admin unit ids of the seed", () => {
    expect(districtId("cai-rang")).toBe(918);
    expect(wardId("ninh-kieu", "tan-an")).toBe(31141);
    expect(wardId("cai-rang", "tan-an")).toBeUndefined();
    expect(districtId("nowhere")).toBeUndefined();
  });
});

describe("toProjectMatches", () => {
  it("groups rooms by project with a starting price and distance", () => {
    const m = toProjectMatches([row(), row({ room_id: "r2", price: 3_000_000 }), row({ room_id: "r3", project_code: "PRJ-B" })], new Map([["r2", 1.5]]));
    expect(m).toHaveLength(2);
    expect(m[0]).toMatchObject({ minPrice: 3_000_000, distanceKm: 1.5 });
    expect(m[0]!.rooms).toHaveLength(2);
    expect(m[0]!.project.amenities).toEqual(["aircon"]);
    expect(m[1]!.distanceKm).toBeNull();
  });
});

describe("searchLive", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps only rooms inside Can Tho", async () => {
    const items = [row(), row({ room_id: "hcm", project_code: "PRJ-HCM", lat: 10.78, lng: 106.69 })];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items, total: 2 }) }));
    expect((await searchLive({})).map((m) => m.project.code)).toEqual(["PRJ-A"]);
  });

  it("returns nothing for a district the database does not hold, without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await searchLive({ district: "phong-dien" })).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
