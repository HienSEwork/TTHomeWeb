import { describe, expect, it } from "vitest";
import { distanceMeters } from "./location-privacy";
import { overlappingIds } from "./map-focus";

const pins = [
  { id: "a", lat: 10.03, lng: 105.77 },
  { id: "b", lat: 10.0355, lng: 105.77 }, // ~610 m north of a
  { id: "c", lat: 10.043, lng: 105.77 }, // ~1.45 km north of a
];

describe("overlappingIds", () => {
  it("returns the chosen building and those whose 700 m areas overlap it, nearest first", () => {
    expect(overlappingIds(pins, "a", 700, distanceMeters)).toEqual(["a", "b"]);
    expect(overlappingIds(pins, "b", 700, distanceMeters)).toEqual(["b", "a", "c"]);
  });

  it("returns nothing for an unknown building", () => {
    expect(overlappingIds(pins, "x", 700, distanceMeters)).toEqual([]);
  });
});
