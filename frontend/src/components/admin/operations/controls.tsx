"use client";

import { useEffect, useRef, useState } from "react";
import type { Option } from "./types";

const CONTROL =
  "h-9 rounded-lg border border-line bg-white px-3 text-sm text-ink transition-colors duration-150 hover:border-gold-deep/50 disabled:opacity-60";

export function Select({ label, value, onChange, options, any, disabled }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  any?: string;
  disabled?: boolean;
}) {
  return (
    <select aria-label={label} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`${CONTROL} max-w-full`}>
      {any !== undefined && <option value="">{any}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function TextInput({ label, className, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <input aria-label={label} {...props} className={`${CONTROL} ${className ?? ""}`} />;
}

export function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      aria-label={label}
      {...props}
      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink transition-colors duration-150 hover:border-gold-deep/50"
    />
  );
}

export function ActionButton({ primary, ...props }: { primary?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`h-9 rounded-lg px-4 text-sm font-semibold transition duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
        primary ? "bg-ink text-paper hover:bg-ink/85" : "border border-line bg-white text-ink hover:bg-sunken"
      }`}
    />
  );
}

export function UnderlineTabs({ label, options, value, onChange }: {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-line">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`-mb-px h-10 shrink-0 border-b-2 px-3 text-sm transition-colors duration-150 ${
            o.value === value ? "border-ink font-semibold text-ink" : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// "1–20 trên 134" with previous and next.
export function Pager({ page, size, total, count, onPage }: { page: number; size: number; total: number; count: number; onPage: (p: number) => void }) {
  if (total === 0) return null;
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-ink-soft">
      <p className="tabular-nums">{page * size + 1}–{page * size + count} trên {total}</p>
      <div className="flex gap-2">
        <ActionButton disabled={page === 0} onClick={() => onPage(page - 1)}>Trước</ActionButton>
        <ActionButton disabled={(page + 1) * size >= total} onClick={() => onPage(page + 1)}>Sau</ActionButton>
      </div>
    </div>
  );
}

export function useDebounced<T>(value: T, ms = 300) {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setOut(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return out;
}

// Slides in from the right; Escape or a click outside closes it.
export function SidePanel({ title, subtitle, onClose, children }: { title: string; subtitle?: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => ref.current?.focus(), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} aria-hidden />
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-label={title}
        className="step-in fixed inset-y-0 right-0 z-30 w-[min(32rem,100vw)] overflow-y-auto border-l border-line bg-paper p-6 shadow-xl outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{title}</h2>
            {subtitle && <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">{subtitle}</div>}
          </div>
          <ActionButton onClick={onClose}>Đóng</ActionButton>
        </div>
        {children}
      </aside>
    </>
  );
}

export function PanelSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 border-t border-line pt-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

export function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="mt-5 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-soft">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export const Dash = () => <span className="text-ink-soft">—</span>;
