import { describe, expect, it } from "vitest";
import { allAreaRoutes, areaHref, resolveAreaRoute } from "./area-route";

describe("resolveAreaRoute", () => {
  it("resolves a district, a ward and a price band", () => {
    expect(resolveAreaRoute("can-tho", "cai-rang")?.district.name).toBe("Quận Cái Răng");
    expect(resolveAreaRoute("can-tho", "cai-rang", ["hung-phu"])?.ward?.name).toBe("Phường Hưng Phú");
    expect(resolveAreaRoute("can-tho", "cai-rang", ["duoi-2-5-trieu"])?.band?.label).toBe("Dưới 2,5 triệu");
    const both = resolveAreaRoute("can-tho", "cai-rang", ["hung-phu", "3-5-5-trieu"]);
    expect(both?.ward?.slug).toBe("hung-phu");
    expect(both?.band?.slug).toBe("3-5-5-trieu");
  });

  it("rejects unknown places and wrong orders", () => {
    expect(resolveAreaRoute("ha-noi", "cai-rang")).toBeNull();
    expect(resolveAreaRoute("can-tho", "quan-99")).toBeNull();
    expect(resolveAreaRoute("can-tho", "cai-rang", ["tan-an"])).toBeNull();
    expect(resolveAreaRoute("can-tho", "cai-rang", ["duoi-2-5-trieu", "hung-phu"])).toBeNull();
    expect(resolveAreaRoute("can-tho", "cai-rang", ["a", "b", "c"])).toBeNull();
  });
});

describe("areaHref", () => {
  it("builds the canonical path", () => {
    const route = resolveAreaRoute("can-tho", "ninh-kieu", ["xuan-khanh"])!;
    expect(areaHref(route)).toBe("/phong-tro/can-tho/ninh-kieu/xuan-khanh");
  });

  it("round-trips every listed route", () => {
    for (const route of allAreaRoutes()) {
      const [, , tinh, quan, ...rest] = areaHref(route).split("/");
      expect(resolveAreaRoute(tinh!, quan!, rest)).toEqual(route);
    }
  });
});
