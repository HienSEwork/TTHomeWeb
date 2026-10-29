import Link from "next/link";
import { PROVINCE, type AreaStat } from "@tthome/data";
import { Plate, formatFromPrice } from "@tthome/ui";

/** Wards as house-number plates: the number is how many rooms are vacant right now. */
export function AreaPlates({ stats }: { stats: AreaStat[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {stats.map((s) => (
        <li key={`${s.district.slug}-${s.ward.slug}`}>
          <Link
            href={`/phong-tro/${PROVINCE.slug}/${s.district.slug}/${s.ward.slug}`}
            className="group flex h-full items-center gap-3 rounded-card border border-line bg-surface p-3 transition-colors hover:border-plate/40 hover:bg-plate-tint/40"
          >
            <Plate value={s.vacant} size="md" className="min-w-14 justify-center" />
            <span className="min-w-0">
              <span className="block truncate font-bold text-ink group-hover:text-plate-dark">{s.ward.name.replace("Phường ", "P. ")}</span>
              <span className="block truncate text-sm text-muted">{s.district.name}</span>
              <span className="block text-sm font-semibold text-ink-soft">{formatFromPrice(s.minPrice)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
