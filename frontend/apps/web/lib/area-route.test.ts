import { describe, expect, it } from "vitest";
import { allAreaRoutes, areaHref, resolveAreaRoute } from "./area-route";

describe("resolveAreaRoute", () => {
  it("resolves a city, a ward and a price band", () => {
    expect(resolveAreaRoute("can-tho")?.city.name).toBe("TP. Cần Thơ");
    expect(resolveAreaRoute("ho-chi-minh", ["ben-thanh"])?.ward?.name).toBe("Phường Bến Thành");
    expect(resolveAreaRoute("can-tho", ["duoi-2-5-trieu"])?.band?.label).toBe("Dưới 2,5 triệu");
    const both = resolveAreaRoute("can-tho", ["ninh-kieu", "3-5-5-trieu"]);
    expect(both?.ward?.slug).toBe("ninh-kieu");
    expect(both?.band?.slug).toBe("3-5-5-trieu");
  });

  it("rejects unknown places, wards of another city and wrong orders", () => {
    expect(resolveAreaRoute("ha-noi")).toBeNull();
    expect(resolveAreaRoute("can-tho", ["ben-thanh"])).toBeNull();
    expect(resolveAreaRoute("can-tho", ["duoi-2-5-trieu", "ninh-kieu"])).toBeNull();
    expect(resolveAreaRoute("can-tho", ["a", "b", "c"])).toBeNull();
  });
});

describe("areaHref", () => {
  it("builds the canonical path", () => {
    const route = resolveAreaRoute("ho-chi-minh", ["ben-thanh"])!;
    expect(areaHref(route)).toBe("/phong-tro/ho-chi-minh/ben-thanh");
  });

  it("round-trips every listed route", () => {
    for (const route of allAreaRoutes()) {
      const [, , tinh, ...rest] = areaHref(route).split("/");
      expect(resolveAreaRoute(tinh!, rest)).toEqual(route);
    }
  });
});
