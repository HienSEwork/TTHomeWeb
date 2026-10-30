import { describe, expect, it } from "vitest";
import { distanceMeters, getJitteredCoordinates, seededRandom } from "./location-privacy";

const home = { lat: 10.0299, lng: 105.7706 };

describe("getJitteredCoordinates", () => {
  it("always lands 250–500 m from the real point", () => {
    const random = seededRandom("spread");
    for (let i = 0; i < 500; i++) {
      const d = distanceMeters(home, getJitteredCoordinates(home.lat, home.lng, 500, { random }));
      expect(d).toBeGreaterThanOrEqual(249);
      expect(d).toBeLessThanOrEqual(501);
    }
  });

  it("spreads the offsets in every direction", () => {
    const random = seededRandom("directions");
    const quadrants = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const p = getJitteredCoordinates(home.lat, home.lng, 500, { random });
      quadrants.add(`${p.lat > home.lat}${p.lng > home.lng}`);
    }
    expect(quadrants.size).toBe(4);
  });
});

describe("seededRandom", () => {
  it("repeats for the same seed and differs between seeds", () => {
    const a = seededRandom("p-1");
    const b = seededRandom("p-1");
    const c = seededRandom("p-2");
    const seqA = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(seqA);
    expect([c(), c(), c()]).not.toEqual(seqA);
    expect(seqA.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});
