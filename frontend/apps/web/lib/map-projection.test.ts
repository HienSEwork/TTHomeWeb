import { describe, expect, it } from "vitest";
import { CITY_BOUNDS, fitBounds, googleMapsUrl, project } from "./map-projection";

describe("project", () => {
  it("puts the north-west corner at 0,0 and the south-east at 100,100", () => {
    expect(project({ lat: CITY_BOUNDS.north, lng: CITY_BOUNDS.west })).toEqual({ x: 0, y: 0 });
    expect(project({ lat: CITY_BOUNDS.south, lng: CITY_BOUNDS.east })).toEqual({ x: 100, y: 100 });
  });

  it("clamps points outside the bounds", () => {
    const p = project({ lat: 11.5, lng: 105 });
    expect(p).toEqual({ x: 0, y: 0 });
  });
});

describe("fitBounds", () => {
  it("contains every point with padding", () => {
    const pts = [
      { lat: 10.77, lng: 106.69 },
      { lat: 10.8, lng: 106.72 },
    ];
    const b = fitBounds(pts);
    for (const p of pts) {
      const { x, y } = project(p, b);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(100);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(100);
    }
  });

  it("keeps a minimum span around a single point", () => {
    const b = fitBounds([{ lat: 10.8, lng: 106.7 }]);
    expect(b.north - b.south).toBeGreaterThanOrEqual(0.03);
    expect(b.east - b.west).toBeGreaterThanOrEqual(0.03);
  });

  it("falls back to the city when there are no points", () => {
    expect(fitBounds([])).toEqual(CITY_BOUNDS);
  });
});

it("builds a Google Maps search link", () => {
  expect(googleMapsUrl({ lat: 10.8, lng: 106.7 })).toBe("https://www.google.com/maps/search/?api=1&query=10.8,106.7");
});
