import { describe, expect, it } from "vitest";
import { activeFilterCount, parseSearchParams, toSearchQuery } from "./search-params";

describe("parseSearchParams", () => {
  it("reads the public URL format", () => {
    const f = parseSearchParams({ q: "Trần Văn Hoài", price: "3000000-5000000", type: "studio,1pn,bogus", group: "pet,ev", exclusive: "1", sort: "price_asc" });
    expect(f).toMatchObject({ q: "Trần Văn Hoài", priceMin: 3_000_000, priceMax: 5_000_000, types: ["studio", "1pn"], pet: true, ev: true, exclusive: true, sort: "price_asc" });
    expect(f.promo).toBeUndefined();
  });

  it("ignores values it does not understand", () => {
    const f = parseSearchParams({ sort: "random", furniture: "gold", radius: "-2", price: "abc" });
    expect(f.sort).toBeUndefined();
    expect(f.furniture).toBeUndefined();
    expect(f.radius).toBeUndefined();
    expect(f.priceMin).toBeUndefined();
  });

  it("caps the landmark radius at 10 km", () => {
    expect(parseSearchParams({ landmark: "dh-can-tho", radius: "50" }).radius).toBe(10);
  });
});

describe("toSearchQuery", () => {
  it("round-trips through parseSearchParams", () => {
    const query = toSearchQuery({ q: "studio", priceMax: 5_000_000, types: ["studio"], promo: true, window: true });
    const params = Object.fromEntries(new URLSearchParams(query.slice(1)));
    expect(parseSearchParams(params)).toMatchObject({ q: "studio", priceMax: 5_000_000, types: ["studio"], promo: true, window: true });
  });

  it("returns an empty string with no filters", () => {
    expect(toSearchQuery({})).toBe("");
  });
});

describe("activeFilterCount", () => {
  it("counts filters but not the keyword or sort", () => {
    expect(activeFilterCount({ q: "abc", sort: "newest" })).toBe(0);
    expect(activeFilterCount({ priceMax: 5_000_000, pet: true, types: ["studio"] })).toBe(3);
  });
});
