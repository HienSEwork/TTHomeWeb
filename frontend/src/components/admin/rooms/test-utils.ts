import { vi } from "vitest";
import type { Project, Room } from "./model";

export type Call = { url: string; method: string; body: unknown };

// Answers each fetch from `routes` ("METHOD path-prefix" -> JSON) and records the calls.
export const fail = (status: number) => ({ __fail: status });

export function mockApi(routes: Record<string, unknown>) {
  const calls: Call[] = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const key = Object.keys(routes).find((k) => k === `${method} ${url.split("?")[0].replace("/api/admin/", "")}`);
    const answer = key ? routes[key] : fail(404);
    if (answer && typeof answer === "object" && "__fail" in answer) {
      return new Response("{}", { status: (answer as ReturnType<typeof fail>).__fail });
    }
    return new Response(JSON.stringify(answer));
  });
  return calls;
}

export const project = (over: Partial<Project> = {}): Project => ({
  id: "p1",
  code: "PRJ-abc123",
  name: "Căn hộ Sao Mai",
  slug: "can-ho-sao-mai",
  streetAddress: "12 Nguyễn Trãi",
  wardId: 7,
  wardNewId: null,
  districtId: 3,
  lat: null,
  lng: null,
  ownerUserId: null,
  managerUserId: null,
  exclusive: false,
  petPolicy: "none",
  evParking: false,
  freeHours: null,
  maxGuestsNote: null,
  houseRules: null,
  feeElectric: null,
  feeWater: null,
  feeService: null,
  feeParking: null,
  feeNote: null,
  description: null,
  coverAssetId: null,
  videoAssetId: null,
  status: "active",
  vacantCount: 3,
  totalRooms: 12,
  minPrice: 3500000,
  amenityIds: [],
  ...over,
});

export const room = (over: Partial<Room> = {}): Room => ({
  id: "r1",
  projectId: "p1",
  code: "A101",
  title: "Studio ban công",
  slug: "studio-ban-cong",
  roomType: "studio",
  floor: 1,
  areaM2: 25,
  price: 4500000,
  priceInclUtility: false,
  deposit: null,
  furniture: null,
  hasBalcony: null,
  hasWindow: null,
  maxOccupants: null,
  status: "available",
  availableFrom: null,
  promo: false,
  promoNote: null,
  coverAssetId: null,
  amenityIds: [],
  ...over,
});
