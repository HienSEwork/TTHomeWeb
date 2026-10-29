"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  AMENITIES,
  DISTRICTS,
  FURNITURE_LABEL,
  LANDMARKS,
  PRICE_BANDS,
  ROOM_TYPE_LABEL,
  searchProjects,
  type Furniture,
  type RoomType,
  type SearchFilters,
  type SortOption,
} from "@tthome/data";
import { Button, ToggleChip, buttonStyles, cn } from "@tthome/ui";
import { activeFilterCount, toSearchQuery } from "@/lib/search-params";

const SORT_LABEL: Record<SortOption, string> = {
  popular: "Phổ biến",
  newest: "Mới nhất",
  price_asc: "Giá thấp đến cao",
  price_desc: "Giá cao đến thấp",
  nearest: "Gần nhất",
};

const QUICK: { key: "pet" | "ev" | "promo" | "exclusive" | "balcony" | "window"; label: string }[] = [
  { key: "pet", label: "Thú cưng" },
  { key: "ev", label: "Sạc xe điện" },
  { key: "promo", label: "Đang ưu đãi" },
  { key: "exclusive", label: "Độc quyền" },
  { key: "balcony", label: "Ban công" },
  { key: "window", label: "Cửa sổ" },
];

const ROOM_TYPES = Object.keys(ROOM_TYPE_LABEL) as RoomType[];

function useNavigate() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (f: SearchFilters) => startTransition(() => router.push(`/tim-kiem${toSearchQuery(f)}`, { scroll: false }));
  return { go, pending };
}

/** Quick toggles, the full filter dialog and the sort order. */
export function SearchToolbar({ filters }: { filters: SearchFilters }) {
  const { go, pending } = useNavigate();
  const dialog = useRef<HTMLDialogElement>(null);
  const count = activeFilterCount(filters);

  return (
    <div className="flex flex-wrap items-center gap-2" aria-busy={pending}>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={buttonStyles({ variant: count ? "primary" : "secondary", size: "sm", className: "rounded-full" })}
      >
        <SlidersHorizontal aria-hidden />
        Bộ lọc{count ? ` (${count})` : ""}
      </button>
      <div className="scrollbar-none -mr-4 flex gap-2 overflow-x-auto pr-4 sm:mr-0 sm:pr-0">
        {QUICK.map((q) => (
          <ToggleChip key={q.key} checked={Boolean(filters[q.key])} onChange={(on) => go({ ...filters, [q.key]: on || undefined })}>
            {q.label}
          </ToggleChip>
        ))}
      </div>
      <label className="ml-auto flex items-center gap-2 text-sm text-muted">
        <span className="hidden sm:inline">Sắp xếp</span>
        <select
          value={filters.sort ?? (filters.landmark ? "nearest" : "popular")}
          onChange={(e) => go({ ...filters, sort: e.target.value as SortOption })}
          className="h-8 rounded-full border border-line-strong bg-surface px-3 text-sm font-medium text-ink"
          aria-label="Sắp xếp kết quả"
        >
          {(Object.keys(SORT_LABEL) as SortOption[])
            .filter((s) => s !== "nearest" || filters.landmark)
            .map((s) => (
              <option key={s} value={s}>
                {SORT_LABEL[s]}
              </option>
            ))}
        </select>
      </label>

      <dialog
        ref={dialog}
        aria-labelledby="bo-loc-title"
        className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-surface p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col sm:rounded-l-2xl"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <FilterForm key={toSearchQuery(filters)} filters={filters} onApply={(f) => { dialog.current?.close(); go(f); }} onClose={() => dialog.current?.close()} />
      </dialog>
    </div>
  );
}

function FilterForm({ filters, onApply, onClose }: { filters: SearchFilters; onApply: (f: SearchFilters) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<SearchFilters>(filters);
  const set = (patch: Partial<SearchFilters>) => setDraft((d) => ({ ...d, ...patch }));
  const results = useMemo(() => searchProjects(draft), [draft]);
  const rooms = results.reduce((n, r) => n + r.rooms.length, 0);
  const district = DISTRICTS.find((d) => d.slug === draft.district);

  const toggleIn = <T,>(list: T[] | undefined, value: T, on: boolean) => {
    const next = new Set(list ?? []);
    if (on) next.add(value);
    else next.delete(value);
    return next.size ? [...next] : undefined;
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="bo-loc-title" className="text-lg font-extrabold">
          Bộ lọc
        </h2>
        <button type="button" onClick={onClose} className={buttonStyles({ variant: "ghost", size: "sm", className: "w-8 px-0" })} aria-label="Đóng bộ lọc">
          <X aria-hidden />
        </button>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
        <fieldset>
          <legend className="text-sm font-bold">Khu vực</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select
              aria-label="Quận"
              value={draft.district ?? ""}
              onChange={(e) => set({ district: e.target.value || undefined, ward: undefined })}
              className="h-10 rounded-[10px] border border-line-strong bg-surface px-3 text-sm"
            >
              <option value="">Tất cả quận</option>
              {DISTRICTS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Phường"
              value={draft.ward ?? ""}
              disabled={!district}
              onChange={(e) => set({ ward: e.target.value || undefined })}
              className="h-10 rounded-[10px] border border-line-strong bg-surface px-3 text-sm disabled:opacity-50"
            >
              <option value="">Tất cả phường</option>
              {district?.wards.map((w) => (
                <option key={w.slug} value={w.slug}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
            <select
              aria-label="Gần địa danh"
              value={draft.landmark ?? ""}
              onChange={(e) => set({ landmark: e.target.value || undefined, sort: draft.sort === "nearest" && !e.target.value ? undefined : draft.sort })}
              className="h-10 rounded-[10px] border border-line-strong bg-surface px-3 text-sm"
            >
              <option value="">Gần trường học, trung tâm thương mại</option>
              {LANDMARKS.map((l) => (
                <option key={l.slug} value={l.slug}>
                  Gần {l.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Bán kính"
              value={draft.radius ?? 3}
              disabled={!draft.landmark}
              onChange={(e) => set({ radius: Number(e.target.value) })}
              className="h-10 rounded-[10px] border border-line-strong bg-surface px-3 text-sm disabled:opacity-50"
            >
              {[1, 2, 3, 5, 10].map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">Giá thuê mỗi tháng</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRICE_BANDS.map((b) => {
              const max = b.max === Number.MAX_SAFE_INTEGER ? undefined : b.max;
              const on = (draft.priceMin ?? 0) === b.min && draft.priceMax === max && (b.min > 0 || max != null);
              return (
                <ToggleChip key={b.slug} checked={on} onChange={(c) => set(c ? { priceMin: b.min || undefined, priceMax: max } : { priceMin: undefined, priceMax: undefined })}>
                  {b.label}
                </ToggleChip>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">
              Từ (triệu)
              <input
                type="number"
                min={0}
                step={0.5}
                inputMode="decimal"
                value={draft.priceMin ? draft.priceMin / 1_000_000 : ""}
                onChange={(e) => set({ priceMin: e.target.value ? Math.round(Number(e.target.value) * 1_000_000) : undefined })}
                className="mt-1 h-10 w-full rounded-[10px] border border-line-strong px-3 text-sm text-ink"
              />
            </label>
            <label className="text-xs text-muted">
              Đến (triệu)
              <input
                type="number"
                min={0}
                step={0.5}
                inputMode="decimal"
                value={draft.priceMax ? draft.priceMax / 1_000_000 : ""}
                onChange={(e) => set({ priceMax: e.target.value ? Math.round(Number(e.target.value) * 1_000_000) : undefined })}
                className="mt-1 h-10 w-full rounded-[10px] border border-line-strong px-3 text-sm text-ink"
              />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">Loại phòng</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROOM_TYPES.map((t) => (
              <ToggleChip key={t} checked={Boolean(draft.types?.includes(t))} onChange={(on) => set({ types: toggleIn(draft.types, t, on) })}>
                {ROOM_TYPE_LABEL[t]}
              </ToggleChip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">Nội thất</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(Object.keys(FURNITURE_LABEL) as Furniture[]).map((f) => (
              <ToggleChip key={f} checked={draft.furniture === f} onChange={(on) => set({ furniture: on ? f : undefined })}>
                {FURNITURE_LABEL[f]}
              </ToggleChip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">Tiện nghi</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <ToggleChip key={a.code} checked={Boolean(draft.amenities?.includes(a.code))} onChange={(on) => set({ amenities: toggleIn(draft.amenities, a.code, on) })}>
                {a.name}
              </ToggleChip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">Chính sách và đặc điểm</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <ToggleChip key={q.key} checked={Boolean(draft[q.key])} onChange={(on) => set({ [q.key]: on || undefined })}>
                {q.label}
              </ToggleChip>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex items-center gap-3 border-t border-line px-5 py-4">
        <Button variant="ghost" onClick={() => setDraft({ q: draft.q, sort: draft.sort })}>
          Xóa bộ lọc
        </Button>
        <Button className={cn("flex-1")} onClick={() => onApply(draft)} disabled={rooms === 0}>
          {rooms === 0 ? "Không có phòng phù hợp" : `Xem ${rooms} phòng`}
        </Button>
      </div>
    </>
  );
}
