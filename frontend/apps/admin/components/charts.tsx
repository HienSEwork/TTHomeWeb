"use client";

import { useId, useState, type PointerEvent } from "react";
import { formatCount } from "@tthome/ui";
import { SERIES, linePath, linearScale, nearestIndex, niceTicks } from "@/lib/chart";


const DAY_LABEL = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const dayLabel = (iso: string) => DAY_LABEL.format(new Date(`${iso}T00:00:00Z`));

/** One series over days, with a crosshair tooltip and a table view. */
export function DailyLineChart({ data, label, unit, height = 220 }: { data: { day: string; value: number }[]; label: string; unit: string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const tableId = useId();
  const width = 720;
  const pad = { top: 12, right: 12, bottom: 26, left: 44 };
  const ticks = niceTicks(Math.max(...data.map((d) => d.value)));
  const top = ticks[ticks.length - 1] ?? 1;
  const x = linearScale([0, data.length - 1], [pad.left, width - pad.right]);
  const y = linearScale([0, top], [height - pad.bottom, pad.top]);
  const points = data.map((d, i) => ({ x: x(i), y: y(d.value) }));
  const xs = points.map((p) => p.x);
  const area = `${linePath(points)} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const active = hover != null ? data[hover] : null;
  const activePoint = hover != null ? points[hover] : null;

  function onMove(e: PointerEvent<SVGRectElement>) {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    setHover(nearestIndex(xs, ((e.clientX - box.left) / box.width) * width));
  }

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-label={`${label} theo ngày, ${data.length} ngày gần nhất`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted text-[11px] tabular">
              {formatCount(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) =>
          i % 7 === data.length % 7 || i === data.length - 1 ? (
            <text key={d.day} x={x(i)} y={height - 6} textAnchor={i === data.length - 1 ? "end" : "middle"} className="fill-muted text-[11px] tabular">
              {dayLabel(d.day)}
            </text>
          ) : null,
        )}
        <path d={area} fill={SERIES.blue} opacity={0.08} />
        <path d={linePath(points)} fill="none" stroke={SERIES.blue} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {activePoint ? (
          <g>
            <line x1={activePoint.x} x2={activePoint.x} y1={pad.top} y2={height - pad.bottom} stroke="var(--color-ink)" strokeOpacity={0.25} strokeWidth={1} />
            <circle cx={activePoint.x} cy={activePoint.y} r={5} fill={SERIES.blue} stroke="var(--color-surface)" strokeWidth={2} />
          </g>
        ) : null}
        <rect
          x={pad.left}
          y={pad.top}
          width={width - pad.left - pad.right}
          height={height - pad.top - pad.bottom}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {active && activePoint ? (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-lift)]"
          style={{ left: `clamp(0px, calc(${(activePoint.x / width) * 100}% - 60px), calc(100% - 140px))` }}
        >
          <p className="text-muted">{dayLabel(active.day)}</p>
          <p className="font-bold text-ink tabular">
            {formatCount(active.value)} {unit}
          </p>
        </div>
      ) : null}
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-muted hover:text-ink">Xem dạng bảng</summary>
        <div className="mt-2 max-h-56 overflow-y-auto">
          <table id={tableId} className="w-full text-left text-sm">
            <thead>
              <tr className="text-muted">
                <th className="py-1 font-medium">Ngày</th>
                <th className="py-1 text-right font-medium">{label}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.day} className="border-t border-line">
                  <td className="py-1 tabular">{dayLabel(d.day)}</td>
                  <td className="py-1 text-right tabular">{formatCount(d.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
