import { describe, expect, it } from "vitest";
import { allAreaRoutes, areaHref, resolveAreaRoute } from "./area-route";

describe("resolveAreaRoute", () => {
  it("resolves a district, a ward and a price band", () => {
    expect(resolveAreaRoute("ho-chi-minh", "quan-12")?.district.name).toBe("Quận 12");
    expect(resolveAreaRoute("ho-chi-minh", "quan-12", ["an-phu-dong"])?.ward?.name).toBe("Phường An Phú Đông");
    expect(resolveAreaRoute("ho-chi-minh", "quan-12", ["duoi-3-5-trieu"])?.band?.label).toBe("Dưới 3,5 triệu");
    const both = resolveAreaRoute("ho-chi-minh", "quan-12", ["an-phu-dong", "5-7-trieu"]);
    expect(both?.ward?.slug).toBe("an-phu-dong");
    expect(both?.band?.slug).toBe("5-7-trieu");
  });

  it("rejects unknown places and wrong orders", () => {
    expect(resolveAreaRoute("ha-noi", "quan-12")).toBeNull();
    expect(resolveAreaRoute("ho-chi-minh", "quan-99")).toBeNull();
    expect(resolveAreaRoute("ho-chi-minh", "quan-12", ["ben-nghe"])).toBeNull();
    expect(resolveAreaRoute("ho-chi-minh", "quan-12", ["duoi-3-5-trieu", "an-phu-dong"])).toBeNull();
    expect(resolveAreaRoute("ho-chi-minh", "quan-12", ["a", "b", "c"])).toBeNull();
  });
});

describe("areaHref", () => {
  it("builds the canonical path", () => {
    const route = resolveAreaRoute("ho-chi-minh", "quan-7", ["tan-phong"])!;
    expect(areaHref(route)).toBe("/phong-tro/ho-chi-minh/quan-7/tan-phong");
  });

  it("round-trips every listed route", () => {
    for (const route of allAreaRoutes()) {
      const [, , tinh, quan, ...rest] = areaHref(route).split("/");
      expect(resolveAreaRoute(tinh!, quan!, rest)).toEqual(route);
    }
  });
});
