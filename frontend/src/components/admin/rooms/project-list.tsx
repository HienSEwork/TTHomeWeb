"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminQuery } from "@/lib/admin-api";
import { Column, DataTable, PageHeader, Tag } from "@/components/admin/parts";
import { ghostButton, SelectField, options } from "./form-bits";
import { dong, Paged, PROJECT_STATUS, PROJECT_TONE, Project, qs } from "./model";

const SIZE = 20;

const columns: Column<Project>[] = [
  {
    header: "Dự án",
    render: (p) => (
      <div className="min-w-0 py-2">
        <Link href={`/admin/rooms/${p.id}`} className="block truncate font-semibold hover:text-gold-deep">
          {p.name}
        </Link>
        <span className="block truncate font-mono text-sm text-ink-soft">{p.code}</span>
      </div>
    ),
  },
  { header: "Trạng thái", render: (p) => <Tag tone={PROJECT_TONE[p.status] ?? "neutral"}>{PROJECT_STATUS[p.status] ?? p.status}</Tag> },
  { header: "Phòng trống", numeric: true, render: (p) => `${p.vacantCount} / ${p.totalRooms}` },
  { header: "Giá thấp nhất (₫)", numeric: true, render: (p) => dong(p.minPrice) },
];

export function ProjectList() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useAdminQuery<Paged<Project>>(`projects?${qs({ q, status, page, size: SIZE })}`);

  const filtered = q !== "" || status !== "";
  const first = page * SIZE + 1;

  return (
    <>
      <PageHeader title="Phòng và dự án" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQ(text.trim());
          setPage(0);
        }}
        className="rise mb-5 flex flex-wrap items-end gap-3"
        style={{ "--i": 1 } as React.CSSProperties}
        role="search"
      >
        <div className="w-full sm:w-72">
          <label htmlFor="project-q" className="mb-1.5 block text-sm font-medium text-ink-soft">Tìm theo tên hoặc mã</label>
          <input
            id="project-q"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={100}
            className="h-12 w-full rounded-xl border border-gold/60 bg-white px-4 text-base focus:border-gold-deep focus:outline-2 focus:outline-gold-deep/40"
          />
        </div>
        <div className="w-full sm:w-52">
          <SelectField
            label="Trạng thái"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả</option>
            {options(PROJECT_STATUS)}
          </SelectField>
        </div>
        <button type="submit" className={`${ghostButton} h-12`}>Tìm</button>
      </form>

      {data && (
        <p className="mb-2 px-3 text-sm text-ink-soft" aria-live="polite">
          {data.total === 0 ? "0 dự án" : `${first}–${first + data.items.length - 1} trên ${data.total} dự án`}
        </p>
      )}
      <DataTable
        rows={data?.items}
        columns={columns}
        rowKey={(p) => p.id}
        loading={loading}
        error={error}
        empty={filtered ? "Không có dự án nào khớp bộ lọc." : "Chưa có dự án nào. Dự án được đồng bộ từ Meey CRM."}
        onRowClick={(p) => router.push(`/admin/rooms/${p.id}`)}
      />
      {error != null && (
        <button type="button" onClick={reload} className={`${ghostButton} mt-3`}>Thử lại</button>
      )}
      {data && data.total > SIZE && (
        <div className="mt-4 flex gap-2">
          <button type="button" className={ghostButton} disabled={page === 0} onClick={() => setPage(page - 1)}>Trang trước</button>
          <button type="button" className={ghostButton} disabled={first + data.items.length > data.total} onClick={() => setPage(page + 1)}>Trang sau</button>
        </div>
      )}
    </>
  );
}
