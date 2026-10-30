import { describe, expect, it } from "vitest";
import { formatFromPrice, formatPercent, formatPriceShort, formatVnd, maskPhone, normalizeVi, slugify } from "./format";

describe("formatPriceShort", () => {
  it("writes millions with a Vietnamese decimal comma", () => {
    expect(formatPriceShort(3_500_000)).toBe("3,5 triệu");
    expect(formatPriceShort(12_000_000)).toBe("12 triệu");
  });

  it("writes amounts under a million in thousands", () => {
    expect(formatPriceShort(850_000)).toBe("850 nghìn");
  });
});

describe("formatFromPrice", () => {
  it("asks to call when there is no price", () => {
    expect(formatFromPrice(null)).toBe("Liên hệ");
    expect(formatFromPrice(0)).toBe("Liên hệ");
  });

  it("prefixes the starting price", () => {
    expect(formatFromPrice(4_200_000)).toBe("Từ 4,2 triệu");
  });
});

describe("formatVnd and formatPercent", () => {
  it("groups thousands with dots", () => {
    expect(formatVnd(3_500_000)).toBe("3.500.000 đ");
  });

  it("writes ratios as percentages", () => {
    expect(formatPercent(0.4567)).toBe("45,7%");
  });
});

describe("text helpers", () => {
  it("masks the middle of a phone number", () => {
    expect(maskPhone("0903 456 512")).toBe("0903 *** 512");
  });

  it("strips diacritics including đ", () => {
    expect(normalizeVi("Đại học Cần Thơ")).toBe("dai hoc can tho");
  });

  it("builds URL slugs", () => {
    expect(slugify("Phường Tân An, Quận Ninh Kiều")).toBe("phuong-tan-an-quan-ninh-kieu");
  });
});
