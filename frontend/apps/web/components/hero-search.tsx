"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { ChevronDown, LayoutGrid, MapPin, Search, Wallet } from "lucide-react";
import { DISTRICTS, PRICE_BANDS, type RoomType } from "@tthome/data";
import { cn } from "@tthome/ui";
import { labelOf } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/client";
import { toSearchQuery } from "@/lib/search-params";
import { SelectMenu, type MenuOption } from "./hero-dropdown";

const TYPES: RoomType[] = ["studio", "room", "1pn", "duplex", "2pn", "shared", "dorm"];

function Field({ icon, label, labelId, htmlFor, children, select }: { icon: ReactNode; label: string; labelId: string; htmlFor: string; children: ReactNode; select?: boolean }) {
  return (
    <div
      data-field
      className="group/field relative flex min-w-0 flex-1 items-center gap-3 rounded-[999px] px-4 py-3 transition-colors duration-300 hover:bg-sand/70 focus-within:bg-white focus-within:shadow-[var(--shadow-soft)] focus-within:ring-2 focus-within:ring-focus md:py-2.5"
    >
      <span
        aria-hidden
        className="grid size-9 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-deep transition-[background-color,color,rotate,scale] duration-300 ease-out-expo group-hover/field:scale-105 group-hover/field:-rotate-6 group-focus-within/field:bg-gold group-focus-within/field:text-on-primary motion-reduce:group-hover/field:rotate-0 [&_svg]:size-[18px]"
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <label id={labelId} htmlFor={htmlFor} className="text-xs font-semibold text-ink">
          {label}
        </label>
        {children}
      </span>
      {select ? (
        <ChevronDown aria-hidden className="pointer-events-none size-4 shrink-0 text-muted transition-transform duration-200 group-has-[[aria-expanded=true]]/field:rotate-180" />
      ) : null}
    </div>
  );
}

const control = "w-full min-w-0 appearance-none truncate bg-transparent py-0.5 text-[0.9375rem] text-ink placeholder:text-muted focus:outline-none";

/** The hero's three-field search: where, how much, what kind. Submits to /tim-kiem. */
export function HeroSearch({ className, vacantByDistrict = {} }: { className?: string; vacantByDistrict?: Record<string, number> }) {
  const router = useRouter();
  const { t } = useI18n();
  const id = useId();
  const [district, setDistrict] = useState("");
  const [band, setBand] = useState("");
  const [type, setType] = useState("");

  const areaOptions: MenuOption[] = [
    { value: "", label: t.hero.anyArea },
    ...DISTRICTS.map((d) => ({ value: d.slug, label: d.name, hint: t.hero.vacant(vacantByDistrict[d.slug] ?? 0), group: t.hero.districtsTitle })),
  ];
  const priceOptions: MenuOption[] = [{ value: "", label: t.hero.anyPrice }, ...PRICE_BANDS.map((b) => ({ value: b.slug, label: labelOf(t.labels.priceBand, b.slug) }))];
  const typeOptions: MenuOption[] = [{ value: "", label: t.hero.anyType }, ...TYPES.map((type) => ({ value: type, label: t.labels.roomType[type] }))];

  function submit() {
    const b = PRICE_BANDS.find((p) => p.slug === band);
    const query = toSearchQuery({
      district: district || undefined,
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
      <Field icon={<MapPin />} label={t.hero.area} labelId={`${id}-area-label`} htmlFor={`${id}-area`} select>
        <SelectMenu id={`${id}-area`} labelId={`${id}-area-label`} value={district} options={areaOptions} placeholder={t.hero.areaPlaceholder} onChange={setDistrict} className={control} />
      </Field>
      <span aria-hidden className="mx-5 h-px bg-line md:mx-0 md:h-8 md:w-px" />
      <Field icon={<Wallet />} label={t.hero.price} labelId={`${id}-price-label`} htmlFor={`${id}-price`} select>
        <SelectMenu id={`${id}-price`} labelId={`${id}-price-label`} value={band} options={priceOptions} placeholder={t.hero.pricePlaceholder} onChange={setBand} className={control} />
      </Field>
      <span aria-hidden className="mx-5 h-px bg-line md:mx-0 md:h-8 md:w-px" />
      <Field icon={<LayoutGrid />} label={t.hero.type} labelId={`${id}-type-label`} htmlFor={`${id}-type`} select>
        <SelectMenu id={`${id}-type`} labelId={`${id}-type-label`} value={type} options={typeOptions} placeholder={t.hero.typePlaceholder} onChange={setType} className={control} />
      </Field>
      <button
        type="submit"
        className="group/submit m-1 inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-8 text-base font-semibold text-on-primary transition-[background-color,scale,box-shadow] duration-300 ease-out-expo hover:scale-[1.04] hover:bg-primary-hover hover:shadow-[0_14px_28px_-12px_rgb(217_155_75/0.75)] focus-visible:scale-[1.04] active:scale-[0.98] max-md:w-[calc(100%-0.5rem)] motion-reduce:hover:scale-100 md:h-[60px]"
      >
        <Search aria-hidden className="size-5 group-hover/submit:animate-seek group-focus-visible/submit:animate-seek" />
        {t.hero.submit}
      </button>
    </form>
  );
}
