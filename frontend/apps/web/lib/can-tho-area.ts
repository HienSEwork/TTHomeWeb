import type { Feature, Polygon } from "geojson";

/** How far the map may be dragged: TP. Cần Thơ plus a small margin. [west, south, east, north] */
export const CAN_THO_MAX_BOUNDS: [number, number, number, number] = [105.25, 9.86, 106.0, 10.4];

/** Approximate city outline (lng, lat), drawn by hand; good enough to shade the neighbouring provinces. */
export const CAN_THO_OUTLINE: [number, number][] = [
  [105.4, 10.33],
  [105.55, 10.31],
  [105.63, 10.24],
  [105.7, 10.17],
  [105.76, 10.11],
  [105.81, 10.06],
  [105.86, 10.01],
  [105.87, 9.97],
  [105.82, 9.94],
  [105.75, 9.93],
  [105.69, 9.95],
  [105.62, 9.98],
  [105.55, 10.0],
  [105.49, 10.03],
  [105.42, 10.07],
  [105.36, 10.13],
  [105.33, 10.2],
  [105.34, 10.27],
  [105.4, 10.33],
];

/** A polygon covering everything except Cần Thơ, used to dim the other provinces. */
export const OUTSIDE_CAN_THO: Feature<Polygon> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [100, 5],
        [112, 5],
        [112, 16],
        [100, 16],
        [100, 5],
      ],
      [...CAN_THO_OUTLINE].reverse(),
    ],
  },
};
