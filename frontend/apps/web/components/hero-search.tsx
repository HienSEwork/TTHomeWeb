"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { ChevronDown, LayoutGrid, MapPin, Search, Wallet } from "lucide-react";
import { PRICE_BANDS, type RoomType } from "@tthome/data";
import { cn } from "@tthome/ui";
import { labelOf } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { toSearchQuery } from "@/lib/search-params";
import { Magnetic } from "./magnetic";

const TYPES: RoomType[] = ["studio", "room", "1pn", "duplex", "2pn", "shared", "dorm"];

function Field({ icon, label, htmlFor, children, select }: { icon: ReactNode; label: string; htmlFor: string; children: ReactNode; select?: boolean }) {
  return (
    <div className="group/field relative flex min-w-0 flex-1 items-center gap-3 rounded-[999px] px-4 py-3 transition-colors duration-300 hover:bg-sand/70 focus-within:bg-white focus-within:shadow-[var(--shadow-soft)] focus-within:ring-2 focus-within:ring-focus md:py-2.5">
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-deep transition-[background-color,color,rotate,scale] duration-300 ease-out-expo group-hover/field:scale-105 group-hover/field:-rotate-6 group-focus-within/field:bg-gold group-focus-within/field:text-on-primary motion-reduce:group-hover/field:rotate-0 [&_svg]:size-[18px]"
      >
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
  const { t } = useI18n();
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
      aria-label={t.hero.form}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn(
        "flex flex-col gap-1 rounded-[28px] border border-white/60 bg-white/80 p-2 text-left shadow-[0_1px_2px_rgb(45_35_20/0.04),0_30px_60px_-24px_rgb(45_35_20/0.25)] backdrop-blur-xl md:flex-row md:items-center md:rounded-full",
        className,
      )}
    >
      <Field icon={<MapPin />} label={t.hero.area} htmlFor={`${id}-q`}>
        <input id={`${id}-q`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.hero.areaPlaceholder} autoComplete="off" className={control} />
      </Field>
      <span aria-hidden className="mx-5 h-px bg-line md:mx-0 md:h-8 md:w-px" />
      <Field icon={<Wallet />} label={t.hero.price} htmlFor={`${id}-price`} select>
        <select id={`${id}-price`} value={band} onChange={(e) => setBand(e.target.value)} className={cn(control, !band && "text-muted")}>
          <option value="">{t.hero.pricePlaceholder}</option>
          {PRICE_BANDS.map((b) => (
            <option key={b.slug} value={b.slug}>
              {labelOf(t.labels.priceBand, b.slug)}
            </option>
          ))}
        </select>
      </Field>
      <span aria-hidden className="mx-5 h-px bg-line md:mx-0 md:h-8 md:w-px" />
      <Field icon={<LayoutGrid />} label={t.hero.type} htmlFor={`${id}-type`} select>
        <select id={`${id}-type`} value={type} onChange={(e) => setType(e.target.value)} className={cn(control, !type && "text-muted")}>
          <option value="">{t.hero.typePlaceholder}</option>
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {t.labels.roomType[type]}
            </option>
          ))}
        </select>
      </Field>
      <Magnetic className="m-1 shrink-0 max-md:w-full">
        <button
          type="submit"
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-on-primary hover:bg-primary-hover md:h-[60px]"
        >
          <Search aria-hidden className="size-5" />
          {t.hero.submit}
        </button>
      </Magnetic>
    </form>
  );
}
