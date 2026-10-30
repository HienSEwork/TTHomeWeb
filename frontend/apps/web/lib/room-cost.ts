import type { Fees, Room } from "@tthome/data";
import { vi } from "./i18n/vi";

export type CostLabels = typeof vi.cost;

export type CostLine = { label: string; amount: number; note?: string };

/** Typical monthly use for one tenant: about 4 kWh per m², between 40 and 180 kWh. */
export function estimateKwh(room: Pick<Room, "area">): number {
  return Math.min(180, Math.max(40, Math.round((room.area * 4) / 10) * 10));
}

/** What a tenant should expect to pay each month, line by line. */
export function monthlyCost(room: Pick<Room, "price" | "area">, fees: Fees, people = 1, motorbikes = 1, t: CostLabels = vi.cost): { lines: CostLine[]; total: number } {
  const kwh = estimateKwh(room) * Math.max(1, people * 0.75);
  const lines: CostLine[] = [
    { label: t.rent, amount: room.price },
    { label: t.service, amount: fees.service, note: t.serviceNote },
    { label: t.water, amount: fees.water * people, note: t.people(people) },
    { label: t.electric, amount: Math.round((kwh * fees.electric) / 1000) * 1000, note: t.kwh(Math.round(kwh)) },
    { label: t.parking, amount: fees.parking * motorbikes, note: t.bikes(motorbikes) },
  ];
  return { lines, total: lines.reduce((sum, l) => sum + l.amount, 0) };
}
