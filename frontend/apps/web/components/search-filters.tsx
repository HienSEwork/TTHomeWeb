"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { ChevronDown, Heart, SlidersHorizontal, X } from "lucide-react";
import {
  AMENITIES,
  CITIES,
  LANDMARKS,
  PRICE_BANDS,
  ROOM_TYPES,
  searchProjects,
  type LandmarkKind,
  type SearchFilters,
  type SortOption,
} from "@tthome/data";
import { Button, ToggleChip, buttonStyles, cn } from "@tthome/ui";
import { labelOf } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { activeFilterCount, toSearchQuery } from "@/lib/search-params";
import { SearchBox } from "./search-box";

const SORTS: SortOption[] = ["popular", "newest", "price_asc", "price_desc", "nearest"];

const QUICK = ["pet", "ev", "promo", "exclusive", "balcony", "window"] as const;

/** The order places are grouped in the "near" menu: schools first, since most renters are students. */
const PLACE_KINDS: LandmarkKind[] = ["university", "college", "vocational", "hospital", "market", "mall", "industrial", "other"];

export type WardCount = { city: string; ward: string; name: string; rooms: number };

function useNavigate() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const go = (f: SearchFilters) => startTransition(() => router.push(`/tim-kiem${toSearchQuery(f)}`, { scroll: false }));
  return { go, pending };
}

/** The price band the filters match exactly, if any. */
function bandOf(f: SearchFilters): string {
  return (
    PRICE_BANDS.find((b) => (f.priceMin ?? 0) === b.min && f.priceMax === (b.max === Number.MAX_SAFE_INTEGER ? undefined : b.max) && (b.min > 0 || f.priceMax != null))
      ?.slug ?? ""
  );
}

function priceOf(slug: string): Pick<SearchFilters, "priceMin" | "priceMax"> {
  const b = PRICE_BANDS.find((p) => p.slug === slug);
  if (!b) return { priceMin: undefined, priceMax: undefined };
  return { priceMin: b.min || undefined, priceMax: b.max === Number.MAX_SAFE_INTEGER ? undefined : b.max };
}

const pill =
  "h-10 w-full min-w-0 appearance-none truncate rounded-full border border-line-strong pr-9 pl-4 text-sm font-medium text-ink transition-colors hover:border-gold-deep focus-visible:border-gold-deep";

/** A native select dressed as a pill, so it stays usable with a keyboard and a phone's own picker. */
function PillSelect({ label, value, onChange, children, className, tinted = Boolean(value) }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; className?: string; tinted?: boolean }) {
  return (
    <span className={cn("relative block min-w-0", className)}>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={cn(pill, tinted ? "border-gold-deep bg-gold-soft" : "bg-white")}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
    </span>
  );
}

/** Schools, hospitals and markets of the chosen city (or both), grouped by kind. */
function PlaceOptions({ city }: { city?: string }) {
  const { t } = useI18n();
  return (
    <>
      {PLACE_KINDS.map((kind) => {
        const places = LANDMARKS.filter((l) => l.kind === kind && (!city || l.citySlug === city)).sort((a, b) => a.name.localeCompare(b.name, "vi"));
        if (!places.length) return null;
        return (
          <optgroup key={kind} label={t.filters.placeKind[kind]}>
            {places.map((l) => (
              <option key={l.slug} value={l.slug}>
                {city ? l.name : `${l.name} (${CITIES.find((c) => c.slug === l.citySlug)?.shortName ?? ""})`}
              </option>
            ))}
          </optgroup>
        );
      })}
    </>
  );
}

/** Ticks several amenities from a small panel under a pill. */
function AmenityMenu({ value, onChange, className }: { value: string[]; onChange: (next: string[] | undefined) => void; className?: string }) {
  const { t } = useI18n();
  const details = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={details} className={cn("group relative min-w-0", className)}>
      <summary className={cn(pill, "flex cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden", value.length > 0 ? "border-gold-deep bg-gold-soft" : "bg-white")}>
        <span className="truncate">{value.length ? t.filters.amenitiesCount(value.length) : t.filters.anyAmenity}</span>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute top-full left-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-3 shadow-[var(--shadow-lift)]">
        <ul className="grid grid-cols-2 gap-1">
          {AMENITIES.map((a) => {
            const on = value.includes(a.code);
            return (
              <li key={a.code}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-ivory">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => {
                      const next = e.target.checked ? [...value, a.code] : value.filter((c) => c !== a.code);
                      onChange(next.length ? next : undefined);
                    }}
                    className="size-4 accent-[var(--color-gold-deep)]"
                  />
                  {labelOf(t.labels.amenity, a.code)}
                </label>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex justify-between border-t border-line pt-2">
          <button type="button" onClick={() => onChange(undefined)} className="text-sm font-semibold text-muted hover:text-ink">
            {t.filters.clear}
          </button>
          <button type="button" onClick={() => details.current?.removeAttribute("open")} className="text-sm font-semibold text-gold-ink">
            {t.common.close}
          </button>
        </div>
      </div>
    </details>
  );
}

/**
 * Every filter at the top of the results, like the big rental sites: keyword, city and a school, hospital or
 * market to search near, the quick toggles, then room type, price, amenities, furniture and sort, and the wards
 * with matching rooms. The dialog behind "Bộ lọc" holds the rest (custom price, radius).
 */
export function SearchToolbar({
  filters,
  live = false,
  wards,
  total,
}: {
  filters: SearchFilters;
  live?: boolean;
  wards: WardCount[];
  total: { buildings: number; rooms: number };
}) {
  const { go, pending } = useNavigate();
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const count = activeFilterCount(filters);
  const set = (patch: Partial<SearchFilters>) => go({ ...filters, ...patch });

  return (
    <div aria-busy={pending} className={cn("space-y-3 transition-opacity", pending && "opacity-70")}>
      {/* On phones: keyword, city and place, price and the filter button; the rest sits in the dialog. */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <SearchBox defaultValue={filters.q ?? ""} size="md" className="col-span-2 min-w-0 md:col-span-1" />
        <PillSelect tinted label={t.filters.city} value={filters.city ?? ""} onChange={(v) => set({ city: v || undefined, ward: undefined, landmark: undefined, radius: undefined })}>
          <option value="">{t.filters.allCities}</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </PillSelect>
        <div className="flex min-w-0 gap-2">
          <PillSelect
            label={t.filters.landmark}
            value={filters.landmark ?? ""}
            onChange={(v) => {
              const place = LANDMARKS.find((l) => l.slug === v);
              set({ landmark: v || undefined, city: place?.citySlug ?? filters.city, ward: undefined, sort: v ? "nearest" : filters.sort === "nearest" ? undefined : filters.sort });
            }}
            className="flex-1"
          >
            <option value="">{t.filters.anyLandmark}</option>
            <PlaceOptions city={filters.city} />
          </PillSelect>
          {filters.landmark ? (
            <PillSelect label={t.filters.radius} value={String(filters.radius ?? 3)} onChange={(v) => set({ radius: Number(v) })} className="w-24 shrink-0">
              {[1, 2, 3, 5, 10].map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </PillSelect>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]">
        <PillSelect className="max-sm:hidden" label={t.filters.roomType} value={filters.types?.length === 1 ? filters.types[0]! : ""} onChange={(v) => set({ types: v ? [v as (typeof ROOM_TYPES)[number]] : undefined })}>
          <option value="">{t.hero.anyType}</option>
          {ROOM_TYPES.map((type) => (
            <option key={type} value={type}>
              {t.labels.roomType[type]}
            </option>
          ))}
        </PillSelect>
        <PillSelect className="max-sm:order-first" label={t.filters.price} value={bandOf(filters)} onChange={(v) => set(priceOf(v))}>
          <option value="">{t.hero.anyPrice}</option>
          {PRICE_BANDS.map((b) => (
            <option key={b.slug} value={b.slug}>
              {labelOf(t.labels.priceBand, b.slug)}
            </option>
          ))}
        </PillSelect>
        <AmenityMenu className="max-sm:hidden" value={filters.amenities ?? []} onChange={(amenities) => set({ amenities })} />
        <PillSelect className="max-sm:hidden" tinted={Boolean(filters.sort)} label={t.filters.sortAria} value={filters.sort ?? (filters.landmark ? "nearest" : "popular")} onChange={(v) => set({ sort: v as SortOption })}>
          {SORTS.filter((s) => s !== "nearest" || filters.landmark).map((s) => (
            <option key={s} value={s}>
              {t.labels.sort[s]}
            </option>
          ))}
        </PillSelect>
        <button
          type="button"
          onClick={() => dialog.current?.showModal()}
          className={buttonStyles({ variant: count ? "primary" : "secondary", size: "md", className: "h-10 rounded-full" })}
        >
          <SlidersHorizontal aria-hidden />
          {t.filters.button}
          {count ? ` (${count})` : ""}
        </button>
        <Link href="/yeu-thich" className={buttonStyles({ variant: "secondary", size: "md", className: "h-10 rounded-full max-sm:hidden" })}>
          <Heart aria-hidden />
          {t.filters.saved}
        </Link>
      </div>

      <div className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
        {QUICK.map((key) => (
          <ToggleChip key={key} checked={Boolean(filters[key])} onChange={(on) => set({ [key]: on || undefined })}>
            {t.filters.quick[key]}
          </ToggleChip>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:gap-4">
        <p className="shrink-0 text-sm text-ink-soft" aria-live="polite">
          {t.search.total(total.buildings, total.rooms)}
        </p>
        {wards.length ? (
          <nav aria-label={t.filters.wardsNav} className="-mx-3 min-w-0 flex-1 px-3 sm:mx-0 sm:px-0">
            <ul className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
              {wards.map((w) => {
                const on = filters.city === w.city && filters.ward === w.ward;
                return (
                  <li key={`${w.city}/${w.ward}`} className="shrink-0">
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => set(on ? { ward: undefined } : { city: w.city, ward: w.ward, landmark: undefined })}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors",
                        on ? "border-selected-line bg-selected font-semibold text-on-selected" : "border-line bg-white text-ink-soft hover:border-gold-deep",
                      )}
                    >
                      {w.name.replace(/^(Phường|Xã|Đặc khu) /, "")}
                      <span className="tabular rounded-full bg-gold-soft px-1.5 text-xs font-semibold text-gold-ink">{w.rooms}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </div>

      <dialog
        ref={dialog}
        aria-labelledby="bo-loc-title"
        className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-surface p-0 text-ink backdrop:bg-ink/40 open:flex open:flex-col sm:rounded-l-2xl"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <FilterForm key={toSearchQuery(filters)} filters={filters} live={live} onApply={(f) => { dialog.current?.close(); go(f); }} onClose={() => dialog.current?.close()} />
      </dialog>
    </div>
  );
}

function FilterForm({ filters, live, onApply, onClose }: { filters: SearchFilters; live: boolean; onApply: (f: SearchFilters) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<SearchFilters>(filters);
  const set = (patch: Partial<SearchFilters>) => setDraft((d) => ({ ...d, ...patch }));
  // The live count would need a request per change, so with the real search the button only applies the filters.
  const rooms = useMemo(() => (live ? null : searchProjects(draft).reduce((n, r) => n + r.rooms.length, 0)), [draft, live]);
  const city = CITIES.find((c) => c.slug === draft.city);

  const toggleIn = <T,>(list: T[] | undefined, value: T, on: boolean) => {
    const next = new Set(list ?? []);
    if (on) next.add(value);
    else next.delete(value);
    return next.size ? [...next] : undefined;
  };

  const field = "h-10 w-full min-w-0 rounded-[10px] border border-line-strong bg-surface px-3 text-sm disabled:opacity-50";

  return (
    <>
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 id="bo-loc-title" className="text-lg font-extrabold">
          {t.filters.title}
        </h2>
        <button type="button" onClick={onClose} className={buttonStyles({ variant: "ghost", size: "sm", className: "w-8 px-0" })} aria-label={t.filters.close}>
          <X aria-hidden />
        </button>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5">
        <fieldset>
          <legend className="text-sm font-bold">{t.filters.area}</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select aria-label={t.filters.city} value={draft.city ?? ""} onChange={(e) => set({ city: e.target.value || undefined, ward: undefined, landmark: undefined })} className={field}>
              <option value="">{t.filters.allCities}</option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <select aria-label={t.filters.ward} value={draft.ward ?? ""} disabled={!city} onChange={(e) => set({ ward: e.target.value || undefined })} className={field}>
              <option value="">{city ? t.filters.allWards : t.filters.cityFirst}</option>
              {city?.wards.map((w) => (
                <option key={w.slug} value={w.slug}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
            <select
              aria-label={t.filters.landmark}
              value={draft.landmark ?? ""}
              onChange={(e) => set({ landmark: e.target.value || undefined, sort: draft.sort === "nearest" && !e.target.value ? undefined : draft.sort })}
              className={cn(field, "min-w-0")}
            >
              <option value="">{t.filters.anyLandmark}</option>
              <PlaceOptions city={draft.city} />
            </select>
            <select aria-label={t.filters.radius} value={draft.radius ?? 3} disabled={!draft.landmark} onChange={(e) => set({ radius: Number(e.target.value) })} className={field}>
              {[1, 2, 3, 5, 10].map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <label className="block sm:hidden">
          <span className="text-sm font-bold">{t.filters.sortLabel}</span>
          <select value={draft.sort ?? (draft.landmark ? "nearest" : "popular")} onChange={(e) => set({ sort: e.target.value as SortOption })} className={cn(field, "mt-2 w-full")}>
            {SORTS.filter((s) => s !== "nearest" || draft.landmark).map((s) => (
              <option key={s} value={s}>
                {t.labels.sort[s]}
              </option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="text-sm font-bold">{t.filters.price}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRICE_BANDS.map((b) => (
              <ToggleChip key={b.slug} checked={bandOf(draft) === b.slug} onChange={(c) => set(c ? priceOf(b.slug) : priceOf(""))}>
                {labelOf(t.labels.priceBand, b.slug)}
              </ToggleChip>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">
              {t.filters.priceFrom}
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
              {t.filters.priceTo}
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
          <legend className="text-sm font-bold">{t.filters.roomType}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROOM_TYPES.map((type) => (
              <ToggleChip key={type} checked={Boolean(draft.types?.includes(type))} onChange={(on) => set({ types: toggleIn(draft.types, type, on) })}>
                {t.labels.roomType[type]}
              </ToggleChip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">{t.filters.amenities}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {AMENITIES.map((a) => (
              <ToggleChip key={a.code} checked={Boolean(draft.amenities?.includes(a.code))} onChange={(on) => set({ amenities: toggleIn(draft.amenities, a.code, on) })}>
                {labelOf(t.labels.amenity, a.code)}
              </ToggleChip>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">{t.filters.features}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK.map((key) => (
              <ToggleChip key={key} checked={Boolean(draft[key])} onChange={(on) => set({ [key]: on || undefined })}>
                {t.filters.quick[key]}
              </ToggleChip>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex items-center gap-3 border-t border-line px-5 py-4">
        <Button variant="ghost" onClick={() => setDraft({ q: draft.q, sort: draft.sort })}>
          {t.filters.clear}
        </Button>
        <Button className="flex-1" onClick={() => onApply(draft)} disabled={rooms === 0}>
          {rooms === null ? t.filters.showResults : rooms === 0 ? t.filters.noMatch : t.filters.show(rooms)}
        </Button>
      </div>
    </>
  );
}
