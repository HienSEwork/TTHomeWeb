"use client";

import { useState } from "react";
import { adminApi, useAdminQuery } from "@/lib/admin-api";
import { Button, Notice } from "@/components/ui";
import { useSubmit } from "@/components/use-submit";
import { Amenity } from "./model";

// Sets the complete amenity list of a project or room; the catalog only offers what the owner type accepts.
export function AmenityPanel({
  endpoint,
  owner,
  selected,
  onSaved,
}: {
  endpoint: string;
  owner: "project" | "room";
  selected: number[];
  onSaved: (amenityIds: number[]) => void;
}) {
  const { data, error, loading } = useAdminQuery<Amenity[]>("catalog/amenities");
  const [ids, setIds] = useState(() => new Set(selected));
  const [saved, setSaved] = useState(() => [...selected].sort((a, b) => a - b));
  const { busy, error: saveError, run } = useSubmit();

  const offered = (data ?? []).filter((a) => a.scope === "both" || a.scope === owner).sort((a, b) => a.sortOrder - b.sortOrder);
  const current = [...ids].sort((a, b) => a - b);
  const dirty = current.join() !== saved.join();

  const toggle = (id: number) =>
    setIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  if (error) return <Notice>Không tải được danh sách tiện nghi.</Notice>;
  if (loading) return <p className="py-6 text-ink-soft">Đang tải…</p>;
  if (offered.length === 0) return <p className="rounded-xl border border-dashed border-line px-4 py-6 text-ink-soft">Danh mục tiện nghi chưa có mục nào dùng được ở đây.</p>;

  return (
    <div className="step-in">
      <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        {offered.map((a) => (
          <li key={a.id}>
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 border-b border-line/60 transition-colors duration-150 hover:bg-sunken/60">
              <input type="checkbox" className="size-4 accent-gold-deep" checked={ids.has(a.id)} onChange={() => toggle(a.id)} />
              {a.name}
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="w-40">
          <Button
            type="button"
            busy={busy}
            disabled={!dirty}
            onClick={() =>
              run(async () => {
                const res = await adminApi<{ amenityIds: number[] }>(endpoint, { method: "PUT", body: { amenityIds: current } });
                setSaved(res.amenityIds);
                onSaved(res.amenityIds);
              })
            }
          >
            Lưu tiện nghi
          </Button>
        </div>
        <span className="text-sm text-ink-soft">Đã chọn {ids.size} tiện nghi</span>
      </div>
      <div className="mt-3"><Notice>{saveError}</Notice></div>
    </div>
  );
}
