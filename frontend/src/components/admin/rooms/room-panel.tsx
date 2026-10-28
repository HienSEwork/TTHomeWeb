"use client";

import { useState } from "react";
import { adminApi, useAdminQuery } from "@/lib/admin-api";
import { Column, DataTable } from "@/components/admin/parts";
import { Notice } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { ghostButton, options, SelectField } from "./form-bits";
import { dong, Paged, Project, qs, ROOM_STATUS, ROOM_TYPE, Room } from "./model";
import { RoomEditor } from "./room-editor";

const SIZE = 50;

// The rooms of one project: change availability in the row, open the editor for everything else.
export function RoomPanel({ project, onChanged }: { project: Project; onChanged: () => void }) {
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Room | "new">();
  const [pending, setPending] = useState<string>();
  const [failure, setFailure] = useState<string>();
  const { data, error, loading, reload } = useAdminQuery<Paged<Room>>(`projects/${project.id}/rooms?${qs({ q, status, page, size: SIZE })}`);

  async function setAvailability(room: Room, next: string) {
    setPending(room.id);
    setFailure(undefined);
    try {
      await adminApi(`rooms/${room.id}/availability`, { method: "PUT", body: { status: next } });
      reload();
      onChanged();
    } catch (e) {
      setFailure(errorMessage(e));
    } finally {
      setPending(undefined);
    }
  }

  const columns: Column<Room>[] = [
    {
      header: "Phòng",
      render: (r) => (
        <div className="min-w-0 py-2">
          <span className="block truncate font-semibold">{r.title}</span>
          <span className="block truncate text-sm text-ink-soft">
            <span className="font-mono">{r.code}</span>
            {r.floor != null && ` · Tầng ${r.floor}`}
          </span>
        </div>
      ),
    },
    { header: "Loại", render: (r) => ROOM_TYPE[r.roomType] ?? r.roomType },
    { header: "Diện tích (m²)", numeric: true, render: (r) => (r.areaM2 == null ? "—" : r.areaM2.toLocaleString("vi-VN")) },
    { header: "Giá thuê (₫)", numeric: true, render: (r) => dong(r.price) },
    {
      header: "Tình trạng",
      render: (r) => (
        <select
          aria-label={`Tình trạng phòng ${r.code}`}
          value={r.status}
          disabled={pending === r.id}
          onChange={(e) => setAvailability(r, e.target.value)}
          className="h-9 rounded-lg border border-gold/60 bg-white px-2 text-sm transition-colors duration-150 hover:bg-cream focus:border-gold-deep disabled:opacity-60"
        >
          {options(ROOM_STATUS)}
        </select>
      ),
    },
    {
      header: "Thao tác",
      render: (r) => (
        <button type="button" className={`${ghostButton} h-8 px-3`} onClick={() => setEditing(r)} aria-label={`Sửa phòng ${r.code}`}>
          Sửa
        </button>
      ),
    },
  ];

  const filtered = q !== "" || status !== "";
  return (
    <div className="step-in">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <form
          role="search"
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(text.trim());
            setPage(0);
          }}
        >
          <div className="w-full sm:w-60">
            <label htmlFor="room-q" className="mb-1.5 block text-sm font-medium text-ink-soft">Tìm theo mã hoặc tiêu đề</label>
            <input
              id="room-q"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={100}
              className="h-12 w-full rounded-xl border border-gold/60 bg-white px-4 text-base focus:border-gold-deep focus:outline-2 focus:outline-gold-deep/40"
            />
          </div>
          <div className="w-full sm:w-44">
            <SelectField
              label="Tình trạng"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Tất cả</option>
              {options(ROOM_STATUS)}
            </SelectField>
          </div>
          <button type="submit" className={`${ghostButton} h-12`}>Tìm</button>
        </form>
        <button type="button" className="ml-auto inline-flex h-12 items-center rounded-full bg-gold px-5 font-semibold text-ink transition duration-200 hover:bg-[#d9ab4d] active:scale-[0.98]" onClick={() => setEditing("new")}>
          Thêm phòng
        </button>
      </div>

      <Notice>{failure}</Notice>
      <DataTable
        rows={data?.items}
        columns={columns}
        rowKey={(r) => r.id}
        loading={loading}
        error={error}
        empty={filtered ? "Không có phòng nào khớp bộ lọc." : "Dự án này chưa có phòng nào."}
      />
      {error != null && <button type="button" onClick={reload} className={`${ghostButton} mt-3`}>Thử lại</button>}
      {data && data.total > SIZE && (
        <div className="mt-4 flex items-center gap-2">
          <button type="button" className={ghostButton} disabled={page === 0} onClick={() => setPage(page - 1)}>Trang trước</button>
          <button type="button" className={ghostButton} disabled={(page + 1) * SIZE >= data.total} onClick={() => setPage(page + 1)}>Trang sau</button>
          <span className="text-sm text-ink-soft">{data.total} phòng</span>
        </div>
      )}

      {editing && (
        <RoomEditor
          key={editing === "new" ? "new" : editing.id}
          projectId={project.id}
          room={editing === "new" ? undefined : editing}
          onChanged={() => {
            reload();
            onChanged();
          }}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  );
}
