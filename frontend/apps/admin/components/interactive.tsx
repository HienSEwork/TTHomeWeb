"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@tthome/ui";

/** Underlined tabs; counts sit beside the label. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto border-b border-line px-1">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
            {t.count != null ? (
              <span className={cn("tabular rounded-md px-1.5 text-xs", active ? "bg-wall-tint text-wall-dark" : "bg-ink/[0.06] text-muted")}>{t.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Modal dialog built on <dialog>, so focus trapping and Escape come from the browser. */
export function Dialog({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[min(520px,calc(100vw-2rem))] rounded-card border border-line bg-surface p-0 text-ink shadow-[var(--shadow-lift)] backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-wash hover:text-ink" aria-label="Đóng">
          <X aria-hidden className="size-5" />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer ? <div className="flex justify-end gap-2 border-t border-line bg-wash/50 px-5 py-3">{footer}</div> : null}
    </dialog>
  );
}

/** Short confirmation shown after an action, announced to screen readers. */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => done.current(), 3200);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      {message ? <p className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-surface shadow-[var(--shadow-lift)]">{message}</p> : null}
    </div>
  );
}
