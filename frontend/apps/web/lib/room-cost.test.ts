import { describe, expect, it } from "vitest";
import { estimateKwh, monthlyCost } from "./room-cost";

const fees = { electric: 3_500, water: 100_000, service: 150_000, parking: 100_000 };

describe("estimateKwh", () => {
  it("keeps the estimate between 40 and 180 kWh", () => {
    expect(estimateKwh({ area: 5 })).toBe(40);
    expect(estimateKwh({ area: 25 })).toBe(100);
    expect(estimateKwh({ area: 90 })).toBe(180);
  });
});

describe("monthlyCost", () => {
  it("adds rent, service, water, electricity and parking", () => {
    const { lines, total } = monthlyCost({ price: 4_000_000, area: 25 }, fees);
    expect(lines.map((l) => l.label)).toEqual(["Tiền phòng", "Phí dịch vụ", "Nước", "Điện (ước tính)", "Gửi xe"]);
    expect(lines[3]!.amount).toBe(350_000);
    expect(total).toBe(4_000_000 + 150_000 + 100_000 + 350_000 + 100_000);
  });

  it("charges water per person and parking per motorbike", () => {
    const { lines } = monthlyCost({ price: 4_000_000, area: 25 }, fees, 2, 2);
    expect(lines[2]!.amount).toBe(200_000);
    expect(lines[4]!.amount).toBe(200_000);
  });
});
