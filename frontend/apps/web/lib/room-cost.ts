import type { Fees, Room } from "@tthome/data";

export type CostLine = { label: string; amount: number; note?: string };

/** Typical monthly use for one tenant: about 4 kWh per m², between 40 and 180 kWh. */
export function estimateKwh(room: Pick<Room, "area">): number {
  return Math.min(180, Math.max(40, Math.round((room.area * 4) / 10) * 10));
}

/** What a tenant should expect to pay each month, line by line. */
export function monthlyCost(room: Pick<Room, "price" | "area">, fees: Fees, people = 1, motorbikes = 1): { lines: CostLine[]; total: number } {
  const kwh = estimateKwh(room) * Math.max(1, people * 0.75);
  const lines: CostLine[] = [
    { label: "Tiền phòng", amount: room.price },
    { label: "Phí dịch vụ", amount: fees.service, note: "Vệ sinh, wifi, rác" },
    { label: "Nước", amount: fees.water * people, note: `${people} người` },
    { label: "Điện (ước tính)", amount: Math.round((kwh * fees.electric) / 1000) * 1000, note: `Khoảng ${Math.round(kwh)} kWh` },
    { label: "Gửi xe", amount: fees.parking * motorbikes, note: `${motorbikes} xe máy` },
  ];
  return { lines, total: lines.reduce((sum, l) => sum + l.amount, 0) };
}
