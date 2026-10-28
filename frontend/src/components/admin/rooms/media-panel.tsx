"use client";

import { useState } from "react";
import { adminApi, useAdminQuery } from "@/lib/admin-api";
import { Column, DataTable, Tag } from "@/components/admin/parts";
import { Button, Notice } from "@/components/ui";
import { useSubmit } from "@/components/use-submit";
import { ghostButton } from "./form-bits";
import { MEDIA_KIND, MediaLink } from "./model";

// The service stores links to uploaded assets only; this panel orders them and picks the cover.
export function MediaPanel({ endpoint }: { endpoint: string }) {
  const { data, error, loading, reload } = useAdminQuery<MediaLink[]>(endpoint);
  if (error) {
    return (
      <div className="space-y-3">
        <Notice>Không tải được danh sách hình ảnh.</Notice>
        <button type="button" onClick={reload} className={ghostButton}>Thử lại</button>
      </div>
    );
  }
  if (!data) return <p className="py-6 text-ink-soft" aria-busy={loading}>Đang tải…</p>;
  return <MediaEditor endpoint={endpoint} initial={data} />;
}

function MediaEditor({ endpoint, initial }: { endpoint: string; initial: MediaLink[] }) {
  const [items, setItems] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const { busy, error, run } = useSubmit();
  const dirty = JSON.stringify(items) !== JSON.stringify(saved);

  const move = (from: number, to: number) =>
    setItems((prev) => {
      const next = [...prev];
      next.splice(to, 0, ...next.splice(from, 1));
      return next;
    });
  // Only one cover; choosing it again clears it.
  const setCover = (assetId: string) => setItems((prev) => prev.map((m) => ({ ...m, cover: m.assetId === assetId && !m.cover })));

  const columns: Column<MediaLink>[] = [
    { header: "Thứ tự", numeric: true, render: (m) => items.indexOf(m) + 1 },
    { header: "Loại", render: (m) => <Tag>{MEDIA_KIND[m.kind] ?? m.kind}</Tag> },
    { header: "Mã tệp", render: (m) => <span className="font-mono text-sm text-ink-soft" title={m.assetId}>{m.assetId.slice(0, 8)}…</span> },
    {
      header: "Ảnh bìa",
      render: (m) =>
        m.kind === "photo" ? (
          <button
            type="button"
            aria-pressed={m.cover}
            onClick={() => setCover(m.assetId)}
            className={`h-8 rounded-full px-3 text-sm font-semibold transition duration-200 active:scale-[0.96] ${m.cover ? "bg-gold text-ink" : "border border-gold/60 hover:bg-cream"}`}
          >
            {m.cover ? "Đang là ảnh bìa" : "Đặt làm bìa"}
          </button>
        ) : (
          <span className="text-ink-soft">—</span>
        ),
    },
    {
      header: "Sắp xếp",
      render: (m) => {
        const i = items.indexOf(m);
        return (
          <span className="flex gap-1.5">
            <button type="button" className={`${ghostButton} h-8 px-3`} disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Đưa tệp ${m.assetId.slice(0, 8)} lên`}>Lên</button>
            <button type="button" className={`${ghostButton} h-8 px-3`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)} aria-label={`Đưa tệp ${m.assetId.slice(0, 8)} xuống`}>Xuống</button>
          </span>
        );
      },
    },
  ];

  return (
    <div className="step-in">
      <p className="mb-3 text-sm text-ink-soft">Thứ tự trong danh sách là thứ tự hiển thị. Tệp mới được thêm qua dịch vụ tải lên; ở đây chỉ sắp xếp và chọn ảnh bìa.</p>
      <DataTable rows={items} columns={columns} rowKey={(m) => m.assetId} empty="Chưa có hình ảnh hay video nào được gắn." />
      <div className="mt-4 w-40">
        <Button
          type="button"
          busy={busy}
          disabled={!dirty}
          onClick={() =>
            run(async () => {
              const res = await adminApi<MediaLink[]>(endpoint, {
                method: "PUT",
                body: { items: items.map((m) => ({ assetId: m.assetId, kind: m.kind, cover: m.cover })) },
              });
              setItems(res);
              setSaved(res);
            })
          }
        >
          Lưu thứ tự
        </Button>
      </div>
      <div className="mt-3"><Notice>{error}</Notice></div>
    </div>
  );
}
