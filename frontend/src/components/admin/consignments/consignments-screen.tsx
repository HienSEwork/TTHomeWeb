"use client";

import { useState } from "react";
import { useAdminQuery } from "@/lib/admin-api";
import { DataTable, PageHeader, Tag, type Column } from "@/components/admin/parts";
import { DetailPanel } from "./detail-panel";
import { buttonBase } from "./review-modal";
import {
  FILTERS,
  PAGE_SIZE,
  STATUS,
  formatDate,
  listPath,
  priceRange,
  statusLabel,
  type Submission,
  type SubmissionPage,
} from "./model";

const DASH = <span className="text-ink-soft">—</span>;

const COLUMNS: Column<Submission>[] = [
  { header: "Mã hồ sơ", render: (s) => <span className="font-mono text-sm">{s.code}</span> },
  {
    header: "Chủ nhà",
    render: (s) => (
      <div className="leading-snug">
        <p className="font-medium">{s.landlordName}</p>
        <p className="text-sm tabular-nums text-ink-soft">{s.landlordPhone}</p>
      </div>
    ),
  },
  {
    header: "Tòa nhà",
    className: "max-w-[18rem]",
    render: (s) => (
      <div className="leading-snug">
        <p className="truncate font-medium">{s.projectName ?? DASH}</p>
        <p className="truncate text-sm text-ink-soft">{s.addressText}</p>
      </div>
    ),
  },
  { header: "Số phòng", numeric: true, render: (s) => s.roomCount ?? DASH },
  { header: "Giá mong muốn", numeric: true, className: "whitespace-nowrap", render: (s) => priceRange(s.expectedPriceMin, s.expectedPriceMax) },
  { header: "Ngày gửi", numeric: true, className: "whitespace-nowrap", render: (s) => formatDate(s.createdAt) },
  { header: "Trạng thái", render: (s) => <Tag tone={STATUS[s.status]?.tone}>{statusLabel(s.status)}</Tag> },
];

export function ConsignmentsScreen() {
  // Most visits are to work the queue, so it opens on what waits for a decision.
  const [status, setStatus] = useState("submitted");
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string>();
  const { data, error, loading, reload } = useAdminQuery<SubmissionPage>(listPath(status, q, page));

  const pick = (value: string) => {
    setStatus(value);
    setPage(0);
  };
  const filterLabel = FILTERS.find((f) => f.value === status)?.label ?? "";
  const first = data ? data.page * data.size + 1 : 0;
  const last = data ? data.page * data.size + data.items.length : 0;

  return (
    <>
      <PageHeader title="Duyệt ký gửi">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(draft.trim());
            setPage(0);
          }}
        >
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={100}
            aria-label="Tìm hồ sơ"
            placeholder="Tìm theo mã, tên, số điện thoại"
            className="h-10 w-64 rounded-full border border-line bg-white px-4 text-sm transition-colors duration-200 placeholder:text-ink/45 focus:border-gold-deep focus:outline-2 focus:outline-gold-deep/40"
          />
        </form>
      </PageHeader>

      <div role="group" aria-label="Lọc theo trạng thái" className="rise mb-4 flex gap-1 overflow-x-auto pb-1" style={{ "--i": 1 } as React.CSSProperties}>
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            aria-pressed={f.value === status}
            onClick={() => pick(f.value)}
            className={`${buttonBase} h-9 shrink-0 px-4 ${f.value === status ? "bg-sunken text-ink" : "font-medium text-ink-soft hover:bg-sunken/60"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        rows={data?.items}
        columns={COLUMNS}
        rowKey={(s) => s.id}
        loading={loading}
        error={error}
        empty={status === "submitted" && !q ? "Không còn hồ sơ nào chờ duyệt." : `Không có hồ sơ${status ? ` ở trạng thái “${filterLabel}”` : ""}${q ? ` khớp “${q}”` : ""}.`}
        onRowClick={(s) => setSelected(s.id)}
      />

      {data && data.total > 0 && (
        <div className="flex items-center justify-between gap-3 px-3 py-4 text-sm text-ink-soft">
          <p className="tabular-nums">{first}–{last} trên {data.total} hồ sơ</p>
          <div className="flex gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className={`${buttonBase} h-9 border border-line text-ink`}>Trước</button>
            <button type="button" disabled={(page + 1) * PAGE_SIZE >= data.total} onClick={() => setPage(page + 1)} className={`${buttonBase} h-9 border border-line text-ink`}>Sau</button>
          </div>
        </div>
      )}

      {selected && <DetailPanel key={selected} id={selected} onClose={() => setSelected(undefined)} onChanged={reload} />}
    </>
  );
}
