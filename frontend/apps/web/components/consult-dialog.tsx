"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { CalendarDays, CircleCheck, Funnel, Headset, MessageCircle, Phone, Search, Send, Sun, Sunrise, Sunset } from "lucide-react";
import { areaStats, CITIES, PRICE_BANDS, SITE, TODAY } from "@tthome/data";
import { Button, SelectField, TextAreaField, TextField, cn } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";
import { CONSULT_MAX_AREAS, CONSULT_TIMES, validateConsult, type ConsultField, type ConsultInput, type ConsultTime } from "@/lib/validation";
import { Drawer } from "./drawer";

const TIME_ICON: Record<ConsultTime, typeof Sun> = { morning: Sunrise, afternoon: Sun, evening: Sunset, weekend: CalendarDays };

function tomorrow(from = TODAY): string {
  return new Date(Date.parse(`${from}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

/** The "Tư vấn thuê phòng" popup: a request for TTHOME staff to shortlist rooms and call back. */
export function ConsultDialog({ open, onClose, returnFocus }: { open: boolean; onClose: () => void; returnFocus?: RefObject<HTMLElement | null> }) {
  const { t } = useI18n();
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t.consult.title}
      closeLabel={t.common.close}
      returnFocus={returnFocus}
      placement="center"
      bodyClassName="bg-alabaster px-4 pt-5 sm:px-6 sm:pt-6"
    >
      <ConsultForm />
    </Drawer>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 border-t border-line pt-5 first-of-type:border-t-0 first-of-type:pt-0">
      <legend className="float-left flex w-full items-center gap-2.5 text-base font-bold text-ink">
        <span aria-hidden className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-gold-soft text-xs font-bold text-gold-ink">
          {n}
        </span>
        {title}
      </legend>
      {hint ? <p className="clear-both pt-1 pl-[2.125rem] text-sm text-muted">{hint}</p> : null}
      <div className="clear-both pt-3 sm:pl-[2.125rem]">{children}</div>
    </fieldset>
  );
}

export function ConsultForm() {
  const { t } = useI18n();
  const stats = useMemo(() => areaStats(), []);
  // Open on the city with the most vacant rooms.
  const firstCity = useMemo(() => {
    const vacant = (slug: string) => stats.filter((s) => s.city.slug === slug).reduce((sum, s) => sum + s.vacant, 0);
    return [...CITIES].sort((a, b) => vacant(b.slug) - vacant(a.slug))[0]?.slug ?? "";
  }, [stats]);
  const [input, setInput] = useState<ConsultInput>({
    name: "",
    phone: "",
    city: firstCity,
    wards: [],
    budget: "",
    moveIn: "",
    times: [],
    note: "",
    referral: "",
    consent: false,
  });
  const [touched, setTouched] = useState<Partial<Record<ConsultField, boolean>>>({});
  const [sent, setSent] = useState(false);
  const errors = validateConsult(input, t.validation);
  const valid = Object.keys(errors).length === 0;
  const shown = (field: ConsultField) => (touched[field] ? errors[field] : undefined);
  const wards = stats.filter((s) => s.city.slug === input.city && s.vacant > 0);
  const full = input.wards.length >= CONSULT_MAX_AREAS;

  function set<K extends ConsultField>(key: K, value: ConsultInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function toggle<T extends string>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setTouched({ name: true, phone: true, consent: true, wards: true });
    if (valid) setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="mx-auto flex max-w-lg flex-col items-center py-10 text-center">
        <CircleCheck aria-hidden className="size-12 text-success" />
        <h3 className="mt-4 text-2xl font-extrabold text-ink">{t.consult.done}</h3>
        <p className="mt-2 text-ink-soft">{t.consult.doneText(input.name.trim(), input.phone)}</p>
        <Link href="/tim-kiem" className="mt-6 font-semibold text-gold-ink underline underline-offset-4">
          {t.common.seeMoreRooms}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
      <form noValidate onSubmit={submit} className="flex min-w-0 flex-col gap-5 rounded-card border border-line bg-white p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-deep">
            <Headset aria-hidden className="size-5" />
          </span>
          <div>
            <p className="text-lg font-bold text-ink">{t.consult.formTitle}</p>
            <p className="text-sm text-muted">{t.consult.formLead}</p>
          </div>
        </div>

        <Step n={1} title={t.consult.you}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={`${t.consult.name} *`}
              autoComplete="name"
              placeholder={t.consult.namePlaceholder}
              value={input.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, name: true }))}
              error={shown("name")}
              aria-required
            />
            <TextField
              label={`${t.consult.phone} *`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t.consult.phonePlaceholder}
              value={input.phone}
              onChange={(e) => set("phone", e.target.value)}
              onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
              error={shown("phone")}
              hint={t.consult.phoneHint}
              aria-required
            />
          </div>
        </Step>

        <Step n={2} title={t.consult.where} hint={t.consult.whereHint(CONSULT_MAX_AREAS)}>
          <div role="radiogroup" aria-label={t.consult.city} className="inline-flex rounded-full border border-line-strong bg-wash p-1">
            {CITIES.map((c) => (
              <label
                key={c.slug}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                  input.city === c.slug ? "bg-white text-ink shadow-[var(--shadow-soft)]" : "text-muted hover:text-ink",
                )}
              >
                <input
                  type="radio"
                  name="consult-city"
                  value={c.slug}
                  checked={input.city === c.slug}
                  onChange={() => setInput((p) => ({ ...p, city: c.slug, wards: [] }))}
                  className="sr-only"
                />
                {c.name}
              </label>
            ))}
          </div>
          {wards.length ? (
            <div role="group" aria-label={t.consult.where} className="mt-3 flex flex-wrap gap-2">
              {wards.map((s) => {
                const on = input.wards.includes(s.ward.slug);
                return (
                  <label
                    key={s.ward.slug}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                      on ? "border-selected-line bg-selected font-semibold text-on-selected" : "border-line-strong bg-white text-ink-soft hover:border-gold-deep",
                      !on && full && "cursor-not-allowed opacity-45 hover:border-line-strong",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!on && full}
                      onChange={() => set("wards", toggle(input.wards, s.ward.slug))}
                      className="size-3.5 accent-gold-deep"
                    />
                    {s.ward.name}
                    <span className="tabular text-muted">({s.vacant})</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">{t.consult.noWards}</p>
          )}
          <p aria-live="polite" className="tabular mt-2 text-xs text-muted">
            {t.consult.picked(input.wards.length, CONSULT_MAX_AREAS)}
          </p>
        </Step>

        <Step n={3} title={t.consult.budgetTitle}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label={t.consult.budget} value={input.budget} onChange={(e) => set("budget", e.target.value)}>
              <option value="">{t.consult.budgetAny}</option>
              {PRICE_BANDS.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {(t.labels.priceBand as Record<string, string>)[b.slug] ?? b.label}
                </option>
              ))}
            </SelectField>
            <TextField label={t.consult.moveIn} type="date" min={tomorrow()} value={input.moveIn} onChange={(e) => set("moveIn", e.target.value)} hint={t.consult.moveInHint} />
          </div>
        </Step>

        <Step n={4} title={t.consult.timesTitle} hint={t.consult.timesHint}>
          <div role="group" aria-label={t.consult.timesTitle} className="grid gap-2 sm:grid-cols-2">
            {CONSULT_TIMES.map((time) => {
              const Icon = TIME_ICON[time];
              const on = input.times.includes(time);
              return (
                <label
                  key={time}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                    on ? "border-selected-line bg-selected" : "border-line-strong bg-white hover:border-gold-deep",
                  )}
                >
                  <Icon aria-hidden className={cn("size-5 shrink-0", on ? "text-gold-deep" : "text-muted")} />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-sm font-semibold text-ink">{t.consult.times[time].label}</span>
                    <span className="tabular block text-xs text-muted">{t.consult.times[time].hours}</span>
                  </span>
                  <input type="checkbox" checked={on} onChange={() => set("times", toggle(input.times, time))} className="size-4 shrink-0 accent-gold-deep" />
                </label>
              );
            })}
          </div>
        </Step>

        <Step n={5} title={t.consult.noteTitle}>
          <div className="grid gap-4">
            <TextAreaField
              label={t.consult.noteTitle}
              optional
              optionalLabel={t.common.optional}
              rows={3}
              placeholder={t.consult.notePlaceholder}
              value={input.note}
              onChange={(e) => set("note", e.target.value)}
              wrapperClassName="[&>label]:sr-only"
            />
            <TextField
              label={t.consult.referral}
              optional
              optionalLabel={t.common.optional}
              placeholder={t.consult.referralPlaceholder}
              hint={t.consult.referralHint}
              value={input.referral}
              onChange={(e) => set("referral", e.target.value.toUpperCase())}
            />
          </div>
        </Step>

        <div className="border-t border-line pt-5">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={input.consent}
              onChange={(e) => {
                set("consent", e.target.checked);
                setTouched((p) => ({ ...p, consent: true }));
              }}
              className="mt-0.5 size-4.5 shrink-0 accent-gold-deep"
            />
            <span>
              {t.consult.consent}{" "}
              <Link href="/chinh-sach/chinh-sach-bao-mat" className="font-semibold text-gold-ink underline">
                {t.common.privacyPolicy}
              </Link>
              {t.consult.consentAfter}
            </span>
          </label>
          <Button type="submit" size="lg" disabled={!valid} className="mt-5 w-full rounded-full disabled:cursor-not-allowed disabled:opacity-50">
            <Send aria-hidden />
            {t.consult.submit}
          </Button>
          <p className="mt-3 text-center text-xs text-muted">{t.consult.pickedRoom}</p>
        </div>
      </form>

      <aside className="hidden flex-col gap-4 lg:flex">
        <div className="rounded-card border border-line bg-white p-5">
          <p className="font-bold text-ink">{t.consult.after}</p>
          <p className="mt-1 text-sm text-muted">{t.consult.afterLead}</p>
          <ol className="mt-4 space-y-4">
            {(
              [
                ["receive", Phone],
                ["filter", Funnel],
                ["visit", CalendarDays],
              ] as const
            ).map(([key, Icon], i) => (
              <li key={key} className="flex gap-3">
                <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-gold-soft text-xs font-bold text-gold-ink">{i + 1}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <Icon aria-hidden className="size-4 text-gold-deep" />
                    {t.consult.steps[key].title}
                  </span>
                  <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted">{t.consult.steps[key].text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-card bg-gold-soft p-5">
          <p className="font-bold text-gold-ink">{t.consult.urgent}</p>
          <p className="text-sm text-ink-soft">{t.consult.urgentLead}</p>
          <a href={SITE.hotlineHref} className="tabular mt-2 flex items-center gap-2 text-2xl font-extrabold text-ink hover:text-gold-ink">
            <Phone aria-hidden className="size-5 text-gold-deep" />
            {SITE.hotline}
          </a>
          <p className="text-xs text-muted">{t.common.hours}</p>
          <a href={SITE.zalo} target="_blank" rel="noopener" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0068ff] hover:underline">
            <MessageCircle aria-hidden className="size-4" />
            {t.consult.orZalo}
          </a>
        </div>
        <div className="flex items-start gap-2 rounded-card border border-line bg-white p-4 text-sm text-ink-soft">
          <Search aria-hidden className="mt-0.5 size-4 shrink-0 text-gold-deep" />
          <span>
            <strong className="font-semibold text-ink">{t.consult.free}.</strong> {t.consult.lead}
          </span>
        </div>
      </aside>
    </div>
  );
}
