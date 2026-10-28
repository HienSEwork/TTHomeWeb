"use client";

import { useState } from "react";
import { useAdminQuery } from "@/lib/admin-api";
import { Column, DataTable, PageHeader } from "@/components/admin/parts";
import { ActionButton, DateInput } from "@/components/admin/insights/blocks";
import { DASH, formatDateTime, formatInt } from "@/components/admin/insights/format";
import type { AuditEntry, PageResponse } from "@/components/admin/insights/types";

const SIZE = 50;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Filters = { actorId: string; entityType: string; q: string; from: string; to: string };
const NONE: Filters = { actorId: "", entityType: "", q: "", from: "", to: "" };

const localMidnight = (date: string, plusDays = 0) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + plusDays);
  return d.toISOString();
};

function toQuery(f: Filters, page: number) {
  const p = new URLSearchParams({ page: String(page), size: String(SIZE) });
  if (f.actorId) p.set("actorId", f.actorId);
  if (f.entityType) p.set("entityType", f.entityType);
  if (f.q) p.set("q", f.q);
  if (f.from) p.set("from", localMidnight(f.from));
  if (f.to) p.set("to", localMidnight(f.to, 1));
  return `audit-logs?${p}`;
}

const inputClass = "h-9 w-full rounded-lg border border-line bg-white px-3 text-[0.9375rem] transition-colors duration-150 hover:border-gold focus:border-gold-deep";

export function AuditView() {
  const [draft, setDraft] = useState<Filters>(NONE);
  const [applied, setApplied] = useState<Filters>(NONE);
  const [page, setPage] = useState(0);
  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, [key]: e.target.value });

  const actorProblem = draft.actorId.trim() && !UUID.test(draft.actorId.trim()) ? "Mã người thực hiện phải là UUID." : null;
  const rangeProblem = draft.from && draft.to && draft.from > draft.to ? "Ngày bắt đầu phải trước ngày kết thúc." : null;
  const problem = actorProblem ?? rangeProblem;

  const { data, error, loading, reload } = useAdminQuery<PageResponse<AuditEntry>>(toQuery(applied, page));

  const apply = (raw: Filters) => {
    const next = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v.trim()])) as Filters;
    setDraft(next);
    setApplied(next);
    setPage(0);
  };
  const filtered = JSON.stringify(applied) !== JSON.stringify(NONE);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  const columns: Column<AuditEntry>[] = [
    { header: "Thời gian", render: (e) => formatDateTime(e.createdAt), numeric: true },
    {
      header: "Thao tác",
      render: (e) => {
        const [method, ...route] = e.action.split(" ");
        return route.length ? (
          <>
            <span className="mr-2 font-semibold">{method}</span>
            <span className="break-all text-ink-soft">{route.join(" ")}</span>
          </>
        ) : (
          e.action
        );
      },
    },
    {
      header: "Đối tượng",
      render: (e) =>
        e.entityType ? (
          <>
            <span className="block">{e.entityType}</span>
            {e.entityId && <span className="block text-sm text-ink-soft">{e.entityId}</span>}
          </>
        ) : (
          <span className="text-ink-soft">{DASH}</span>
        ),
    },
    {
      header: "Người thực hiện",
      render: (e) =>
        e.actorId ? (
          <button
            type="button"
            title={`${e.actorId} - lọc theo người này`}
            onClick={(ev) => {
              ev.stopPropagation();
              apply({ ...applied, actorId: e.actorId! });
            }}
            className="font-mono text-sm text-gold-deep underline-offset-4 hover:underline"
          >
            {e.actorId.slice(0, 8)}
          </button>
        ) : (
          <span className="text-ink-soft">{DASH}</span>
        ),
    },
    { header: "Địa chỉ IP", render: (e) => e.actorIp ?? <span className="text-ink-soft">{DASH}</span>, className: "text-sm" },
  ];

  return (
    <div className="max-w-6xl" aria-busy={loading}>
      <PageHeader title="Nhật ký hoạt động" />
      <form
        className="rise mb-6 grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto_auto]"
        style={{ "--i": 1 } as React.CSSProperties}
        onSubmit={(e) => {
          e.preventDefault();
          if (!problem) apply(draft);
        }}
      >
        <label className="grid gap-1 text-sm text-ink-soft">
          Thao tác chứa
          <input value={draft.q} onChange={set("q")} placeholder="ví dụ: DELETE" className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm text-ink-soft">
          Loại đối tượng
          <input value={draft.entityType} onChange={set("entityType")} placeholder="ví dụ: rooms" className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm text-ink-soft">
          Mã người thực hiện
          <input value={draft.actorId} onChange={set("actorId")} placeholder="UUID" aria-invalid={!!actorProblem} className={`${inputClass} font-mono`} />
        </label>
        <DateInput label="Từ ngày" value={draft.from} onChange={set("from")} />
        <DateInput label="Đến ngày" value={draft.to} onChange={set("to")} />
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-5">
          <ActionButton primary type="submit" disabled={!!problem}>Lọc</ActionButton>
          {filtered && <ActionButton onClick={() => apply(NONE)}>Xóa lọc</ActionButton>}
          {problem && <p role="alert" className="text-sm font-medium text-danger">{problem}</p>}
        </div>
      </form>

      <div className="rise" style={{ "--i": 2 } as React.CSSProperties}>
        <DataTable
          rows={data?.items}
          columns={columns}
          rowKey={(e) => e.id}
          loading={loading}
          error={error}
          empty={filtered ? "Không có bản ghi nào khớp bộ lọc." : "Chưa có hoạt động nào được ghi lại."}
        />
        {error != null && <ActionButton onClick={reload}>Thử lại</ActionButton>}
      </div>

      {data && data.total > 0 && (
        <nav aria-label="Phân trang" className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-soft">
          <span className="tabular-nums">
            Trang {formatInt(data.page + 1)} / {formatInt(pages)}, tổng {formatInt(data.total)} bản ghi
          </span>
          <span className="flex gap-2">
            <ActionButton disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Trước</ActionButton>
            <ActionButton disabled={page + 1 >= pages || loading} onClick={() => setPage(page + 1)}>Sau</ActionButton>
          </span>
        </nav>
      )}
    </div>
  );
}
