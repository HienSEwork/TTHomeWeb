import type { LucideIcon } from "lucide-react";
import { AirVent, ArrowUpDown, Bath, CircleParking, Clock, CookingPot, Heater, KeyRound, Refrigerator, ShieldCheck, Sparkles, Sun, WashingMachine } from "lucide-react";
import { AMENITY_NAME } from "@tthome/data";

const ICONS: Record<string, LucideIcon> = {
  aircon: AirVent,
  private_wc: Bath,
  washer: WashingMachine,
  kitchen: CookingPot,
  fridge: Refrigerator,
  water_heater: Heater,
  elevator: ArrowUpDown,
  fingerprint: KeyRound,
  parking: CircleParking,
  security: ShieldCheck,
  free_hours: Clock,
  shared_washer: WashingMachine,
  rooftop: Sun,
  cleaning: Sparkles,
};

export function AmenityList({ codes }: { codes: string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
      {codes.map((code) => {
        const Icon = ICONS[code] ?? Sparkles;
        return (
          <li key={code} className="flex items-center gap-2.5 text-ink-soft">
            <Icon aria-hidden className="size-5 shrink-0 text-shutter" />
            {AMENITY_NAME[code] ?? code}
          </li>
        );
      })}
    </ul>
  );
}
