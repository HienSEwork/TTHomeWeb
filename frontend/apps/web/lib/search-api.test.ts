import { afterEach, describe, expect, it, vi } from "vitest";
import { searchRooms, toQuery } from "./search-api";

describe("toQuery", () => {
  it("drops empty values and keeps the rest", () => {
    expect(toQuery({ q: "bách khoa", price_max: 3_000_000, sort: "", page: undefined })).toBe("?q=b%C3%A1ch+khoa&price_max=3000000");
    expect(toQuery({})).toBe("");
  });
});

describe("searchRooms", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("calls the search endpoint with the filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ items: [], total: 0 }) });
    vi.stubGlobal("fetch", fetchMock);
    await searchRooms({ room_type: "studio" });
    expect(fetchMock.mock.calls[0]![0]).toBe("http://localhost:8080/api/v1/search?room_type=studio");
  });

  it("throws when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(searchRooms({})).rejects.toThrow("500");
  });
});
