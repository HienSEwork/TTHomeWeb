"use client";

import { useEffect, useRef } from "react";
import { errorMessage } from "@/lib/api";
import { Notice } from "@/components/ui";

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rise mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export type Column<T> = {
  header: string;
  render: (row: T) => React.ReactNode;
  numeric?: boolean;
  className?: string;
};

// Rules and alignment only: no zebra, no header band; figures right-aligned in tabular digits.
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  loading,
  error,
  empty = "Chưa có dữ liệu.",
  onRowClick,
}: {
  rows?: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: unknown;
  empty?: string;
  onRowClick?: (row: T) => void;
}) {
  if (error) return <Notice>{errorMessage(error)}</Notice>;
  return (
    <div className="overflow-x-auto" aria-busy={loading}>
      <table className="w-full min-w-[40rem] border-collapse text-left text-[0.9375rem]">
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th key={c.header} scope="col" className={`h-10 px-3 text-sm font-normal text-ink-soft ${c.numeric ? "text-right" : ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows?.map((row, i) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick && (() => onRowClick(row))}
              className={`rise border-b border-line/60 transition-colors duration-150 ${onRowClick ? "cursor-pointer hover:bg-sunken/60" : ""}`}
              style={{ "--i": Math.min(i, 12) } as React.CSSProperties}
            >
              {columns.map((c) => (
                <td key={c.header} className={`h-12 px-3 ${c.numeric ? "text-right tabular-nums" : ""} ${c.className ?? ""}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && !rows && <p className="px-3 py-6 text-ink-soft">Đang tải…</p>}
      {!loading && rows?.length === 0 && <p className="px-3 py-6 text-ink-soft">{empty}</p>}
    </div>
  );
}

const TONES = {
  neutral: "bg-sunken text-ink-soft",
  ok: "bg-ok/12 text-ok",
  warn: "bg-gold-pale text-gold-bronze",
  danger: "bg-danger/10 text-danger",
};

export function Tag({ tone = "neutral", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-sm font-medium ${TONES[tone]}`}>{children}</span>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-labelledby="modal-title"
      className="step-in m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/40"
    >
      <div className="p-6">
        <h2 id="modal-title" className="text-xl font-bold">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
