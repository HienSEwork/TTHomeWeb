"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { ChevronDown, LayoutGrid, MapPin, Search, Wallet } from "lucide-react";
import { PRICE_BANDS, ROOM_TYPE_LABEL, type RoomType } from "@tthome/data";
import { cn } from "@tthome/ui";
import { toSearchQuery } from "@/lib/search-params";

const TYPES: RoomType[] = ["studio", "room", "1pn", "duplex", "2pn", "shared", "dorm"];

function Field({ icon, label, htmlFor, children, select }: { icon: ReactNode; label: string; htmlFor: string; children: ReactNode; select?: boolean }) {
  return (
    <div className="relative flex min-w-0 flex-1 items-center gap-3 rounded-[12px] px-4 py-3 transition-colors focus-within:bg-gold-soft/60 focus-within:ring-2 focus-within:ring-focus md:py-2">
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-deep [&_svg]:size-[18px]">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <label htmlFor={htmlFor} className="text-xs font-semibold text-ink">
          {label}
        </label>
        {children}
      </span>
      {select ? <ChevronDown aria-hidden className="pointer-events-none size-4 shrink-0 text-muted" /> : null}
    </div>
  );
}

const control = "w-full min-w-0 appearance-none truncate bg-transparent py-0.5 text-[0.9375rem] text-ink placeholder:text-muted focus:outline-none";

/** The hero's three-field search: where, how much, what kind. Submits to /tim-kiem. */
export function HeroSearch({ className }: { className?: string }) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [band, setBand] = useState("");
  const [type, setType] = useState("");

  function submit() {
    const b = PRICE_BANDS.find((p) => p.slug === band);
    const query = toSearchQuery({
      q: q.trim() || undefined,
      priceMin: b?.min || undefined,
      priceMax: b && b.max !== Number.MAX_SAFE_INTEGER ? b.max : undefined,
      types: type ? [type as RoomType] : undefined,
    });
    router.push(`/tim-kiem${query}`);
  }

  return (
    <form
      role="search"
      aria-label="Tìm phòng"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn(
        "flex flex-col rounded-[18px] border border-line bg-white p-2 text-left shadow-[0_18px_50px_-20px_rgb(39_32_21/0.22)] md:flex-row md:items-center",
        className,
      )}
    >
      <Field icon={<MapPin />} label="Khu vực" htmlFor={`${id}-q`}>
        <input id={`${id}-q`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Quận, phường, tên đường…" autoComplete="off" className={control} />
      </Field>
      <span aria-hidden className="mx-4 h-px bg-line md:mx-0 md:h-10 md:w-px" />
      <Field icon={<Wallet />} label="Khoảng giá" htmlFor={`${id}-price`} select>
        <select id={`${id}-price`} value={band} onChange={(e) => setBand(e.target.value)} className={cn(control, !band && "text-muted")}>
          <option value="">Chọn ngân sách</option>
          {PRICE_BANDS.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.label}
            </option>
          ))}
        </select>
      </Field>
      <span aria-hidden className="mx-4 h-px bg-line md:mx-0 md:h-10 md:w-px" />
      <Field icon={<LayoutGrid />} label="Loại phòng" htmlFor={`${id}-type`} select>
        <select id={`${id}-type`} value={type} onChange={(e) => setType(e.target.value)} className={cn(control, !type && "text-muted")}>
          <option value="">Studio, phòng đơn…</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {ROOM_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </Field>
      <button
        type="submit"
        className="m-1 inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-primary px-7 text-base font-semibold text-on-primary transition-colors hover:bg-primary-hover md:h-[60px]"
      >
        <Search aria-hidden className="size-5" />
        Tìm phòng
      </button>
    </form>
  );
}
