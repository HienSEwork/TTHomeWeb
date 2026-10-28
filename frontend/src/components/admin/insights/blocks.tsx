"use client";

import { DASH } from "./format";

// A flat frame: a 1px line, no shadow. It rises in with the page.
export function Panel({
  title,
  aside,
  index = 0,
  className = "",
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rise rounded-xl border border-line p-5 ${className}`} style={{ "--i": index } as React.CSSProperties}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {aside && <div className="text-sm text-ink-soft">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

// A figure is type, not a tile: grey label above, tabular number, a missing value is a dash.
export function Figure({ label, value, suffix, note }: { label: string; value: string; suffix?: string; note?: string }) {
  const missing = value === DASH;
  return (
    <div className="bg-paper px-5 py-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1.5 text-[1.75rem] leading-none tabular-nums" aria-label={missing ? `${label}: chưa có số liệu` : undefined}>
        <span className={missing ? "text-ink-soft/60" : ""}>{value}</span>
        {suffix && !missing && <span className="ml-1.5 text-sm text-ink-soft">{suffix}</span>}
      </p>
      {note && <p className="mt-1.5 text-sm text-ink-soft">{note}</p>}
    </div>
  );
}

const COLS = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" };

// Figures share one container split by 1px hairlines.
export function FigureStrip({ cols, index = 0, children }: { cols: keyof typeof COLS; index?: number; children: React.ReactNode }) {
  return (
    <div
      className={`rise grid gap-px overflow-hidden rounded-xl border border-line bg-line ${COLS[cols]}`}
      style={{ "--i": index } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: [T, string][];
  value: T | null;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg bg-sunken p-0.5">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={v === value}
          onClick={() => onChange(v)}
          className={`h-8 rounded-md px-3 text-sm transition duration-150 active:scale-95 ${v === value ? "bg-paper font-semibold shadow-[0_0_0_1px_var(--color-line)]" : "text-ink-soft hover:text-ink"}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function DateInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-1 text-sm text-ink-soft">
      {label}
      <input
        type="date"
        {...props}
        className="h-9 rounded-lg border border-line bg-white px-3 text-[0.9375rem] text-ink transition-colors duration-150 hover:border-gold focus:border-gold-deep"
      />
    </label>
  );
}

export function ActionButton({ primary, ...props }: { primary?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`h-9 rounded-lg px-4 text-sm font-semibold transition duration-150 active:scale-[0.97] disabled:cursor-wait disabled:opacity-60 ${
        primary ? "bg-ink text-paper hover:bg-ink/85" : "border border-line hover:bg-sunken/60"
      }`}
    />
  );
}
