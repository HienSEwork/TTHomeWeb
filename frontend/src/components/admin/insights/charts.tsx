"use client";

import { useEffect, useState } from "react";
import { formatInt, labelOf, niceStep } from "./format";

// False on the first paint, true one frame later: marks use it to draw in from zero.
export function useDrawn() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return on;
}

const GROW = "transition-transform duration-700 ease-out-quint motion-reduce:transition-none";

const W = 600;
const H = 160;

// One column per day, one hue, five faint gridlines. Days are zero where nothing was counted.
export function DayBars({ days, label }: { days: { day: string; count: number }[]; label: string }) {
  const on = useDrawn();
  const n = days.length;
  const max = Math.max(0, ...days.map((d) => d.count));
  const step = niceStep(max);
  const top = step * 4;
  const slot = W / Math.max(n, 1);
  const gap = n > 90 ? 0.4 : n > 45 ? 1 : 2.5;
  const marks = [...new Set([0, 1, 2, 3, 4].map((k) => Math.round((k * (n - 1)) / 4)))];

  return (
    <div role="img" aria-label={label} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-2">
      <div className="relative h-40">
        {[0, 1, 2, 3, 4].map((k) => (
          <span
            key={k}
            className="absolute right-0 translate-y-1/2 text-xs tabular-nums text-ink-soft"
            style={{ bottom: `${k * 25}%` }}
          >
            {formatInt(k * step)}
          </span>
        ))}
      </div>
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-40 w-full overflow-visible" aria-hidden>
          {[1, 2, 3, 4].map((k) => (
            <line key={k} x1={0} x2={W} y1={H - (H * k) / 4} y2={H - (H * k) / 4} stroke="var(--color-line)" vectorEffect="non-scaling-stroke" />
          ))}
          {days.map((d, i) => {
            const h = (d.count / top) * H;
            return (
              <rect
                key={d.day}
                x={i * slot + gap / 2}
                y={H - h}
                width={Math.max(slot - gap, 0.5)}
                height={h}
                fill="var(--color-gold)"
                className={`${GROW} origin-bottom hover:fill-[var(--color-gold-deep)]`}
                style={{
                  transformBox: "fill-box",
                  transform: `scaleY(${on ? 1 : 0})`,
                  transitionDelay: `${Math.min(i * 10, 450)}ms`,
                }}
              >
                <title>{`${d.day}: ${formatInt(d.count)} lượt xem`}</title>
              </rect>
            );
          })}
          <line x1={0} x2={W} y1={H} y2={H} stroke="var(--color-ink-soft)" strokeOpacity={0.5} vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="relative mt-2 h-4">
          {marks.map((i) => (
            <span
              key={i}
              className="absolute whitespace-nowrap text-xs tabular-nums text-ink-soft"
              style={{ left: `${((i + 0.5) / n) * 100}%`, transform: `translateX(-${n > 1 ? (i / (n - 1)) * 100 : 0}%)` }}
            >
              {days[i].day.slice(5)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// A ranked list: the bar is the row's value against the largest, so a zero draws nothing.
export function BarList({ values, empty = "Chưa có dữ liệu trong kỳ này." }: { values: Record<string, number>; empty?: string }) {
  const on = useDrawn();
  const rows = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map(([, v]) => v));
  if (rows.length === 0) return <p className="py-3 text-sm text-ink-soft">{empty}</p>;
  return (
    <ul>
      {rows.map(([key, value], i) => (
        <li key={key} className="grid h-9 grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_3.5rem] items-center gap-3 text-sm">
          <span className="truncate" title={labelOf(key)}>{labelOf(key)}</span>
          <span className="h-2 overflow-hidden rounded-full bg-sunken" aria-hidden>
            <span
              className={`${GROW} block h-full origin-left rounded-full bg-gold`}
              style={{ transform: `scaleX(${on ? value / max : 0})`, transitionDelay: `${i * 60}ms` }}
            />
          </span>
          <span className="text-right tabular-nums">{formatInt(value)}</span>
        </li>
      ))}
    </ul>
  );
}

export type Part = { label: string; value: number; tone: string };

// Parts of a whole in one bar with 2px seams; the legend below carries the figures.
export function StackBar({ parts }: { parts: Part[] }) {
  const on = useDrawn();
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-sm bg-sunken" role="img" aria-label={parts.map((p) => `${p.label} ${p.value}`).join(", ")}>
        {parts.map((p, i) =>
          p.value > 0 ? (
            <span
              key={p.label}
              className={`${GROW} origin-left ${p.tone}`}
              style={{ width: `${(p.value / total) * 100}%`, transform: `scaleX(${on ? 1 : 0})`, transitionDelay: `${i * 90}ms` }}
            />
          ) : null,
        )}
      </div>
      <ul className="mt-3">
        {parts.map((p) => (
          <li key={p.label} className="flex h-8 items-center gap-2.5 text-sm">
            <span className={`size-2 rounded-full ${p.tone}`} aria-hidden />
            <span className="flex-1">{p.label}</span>
            <span className="tabular-nums">{formatInt(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// A thin track filled to the true ratio, both ends labelled.
export function Track({ ratio, from, to }: { ratio: number; from: string; to: string }) {
  const on = useDrawn();
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-sunken" aria-hidden>
        <div
          className={`${GROW} h-full origin-left rounded-full bg-gold`}
          style={{ transform: `scaleX(${on ? Math.min(Math.max(ratio, 0), 1) : 0})` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs tabular-nums text-ink-soft">
        <span>{from}</span>
        <span>{to}</span>
      </div>
    </div>
  );
}
