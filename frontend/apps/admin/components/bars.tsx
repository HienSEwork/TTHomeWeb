import { formatCount, formatPercent } from "@tthome/ui";
import { SERIES, shares } from "@/lib/chart";

/** Parts of a whole as one bar with 2px gaps, plus a legend that carries the numbers. */
export function StackedBar({ items, label }: { items: { label: string; value: number; color: string }[]; label: string }) {
  const parts = shares(items.map((i) => i.value));
  const total = items.reduce((a, b) => a + b.value, 0);
  return (
    <figure>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label={`${label}: ${items.map((i) => `${i.label} ${i.value}`).join(", ")}`}>
        {items.map((item, i) => (
          <span key={item.label} title={`${item.label}: ${item.value}`} style={{ width: `${(parts[i] ?? 0) * 100}%`, background: item.color }} className="h-full first:rounded-l-[4px] last:rounded-r-[4px]" />
        ))}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-start gap-2">
            <span aria-hidden className="mt-1.5 block size-2.5 shrink-0 rounded-sm" style={{ background: item.color }} />
            <span>
              <span className="block text-sm text-ink-soft">{item.label}</span>
              <span className="block text-lg font-bold text-ink tabular">
                {formatCount(item.value)}
                <span className="ml-1.5 text-xs font-normal text-muted">{total ? formatPercent(parts[i] ?? 0, 0) : "0%"}</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** Ranked horizontal bars, one hue, value labels at the end. */
export function BarList({ items, unit = "count", color = SERIES.blue, max }: { items: { label: string; value: number; hint?: string }[]; unit?: "count" | "percent"; color?: string; max?: number }) {
  const format = (v: number) => (unit === "percent" ? formatPercent(v, 0) : formatCount(v));
  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-ink-soft" title={item.label}>
            {item.label}
          </span>
          <span className="h-2.5 rounded-r-[4px] bg-wash">
            <span className="block h-full rounded-r-[4px]" style={{ width: `${Math.max((item.value / top) * 100, 1)}%`, background: color }} />
          </span>
          <span className="min-w-14 text-right font-semibold text-ink tabular">
            {format(item.value)}
            {item.hint ? <span className="ml-1 font-normal text-muted">{item.hint}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
