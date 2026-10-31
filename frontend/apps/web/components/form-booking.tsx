"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { CITIES } from "@tthome/data";
import { Button, SelectField, TextField, cn } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";
import { bookingDays, TIME_SLOTS, validateBooking, type BookingField, type BookingInput, type Errors } from "@/lib/validation";
import { ChoiceGroup, ConsentCheck, FormErrorSummary, FormSection, FormSuccess } from "./form-parts";

const BUDGETS = ["under-2.5", "2.5-3.5", "3.5-5", "over-5"] as const;

const MOVE_IN = ["now", "this-month", "next-month", "later"] as const;

export type BookingTarget = { projectName: string; roomName?: string; citySlug: string; wardSlug: string } | null;

export function BookingForm({ target }: { target: BookingTarget }) {
  const { lang, t, fmt } = useI18n();
  const days = bookingDays(7);
  const [input, setInput] = useState<BookingInput>({
    area: target ? `${target.citySlug}/${target.wardSlug}` : "",
    budget: "",
    moveIn: "",
    date: "",
    slot: "",
    mode: "in_person",
    name: "",
    phone: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Errors<BookingField>>({});
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);

  function set<K extends BookingField>(key: K, value: BookingInput[K]) {
    const next = { ...input, [key]: value };
    setInput(next);
    if (tried) setErrors(validateBooking(next, undefined, t.validation));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateBooking(input, undefined, t.validation);
    setTried(true);
    setErrors(found);
    if (Object.keys(found).length === 0) setSent(true);
  }

  if (sent) {
    const day = fmt.shortDay(input.date);
    return (
      <FormSuccess title={t.booking.done} onReset={() => setSent(false)} resetLabel={t.booking.again} lang={lang}>
        <p>{t.booking.doneText(input.phone, input.slot, day, input.mode === "online")}</p>
      </FormSuccess>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-8 rounded-card border border-line bg-surface p-5 sm:p-8">
      {target ? (
        <p className="rounded-lg bg-plate-tint px-4 py-3 text-sm text-plate-dark">
          {t.booking.targetBefore}{" "}
          <strong>
            {target.roomName ? `${target.roomName}, ` : ""}
            {target.projectName}
          </strong>
          {t.booking.targetAfter}
        </p>
      ) : null}

      <FormSection title={t.booking.needTitle} description={t.booking.needText}>
        <SelectField label={t.booking.area} value={input.area} onChange={(e) => set("area", e.target.value)} error={errors.area}>
          <option value="">{t.booking.chooseDistrict}</option>
          {CITIES.map((c) => (
            <optgroup key={c.slug} label={c.name}>
              <option value={c.slug}>{t.hero.anyWard(c.name)}</option>
              {c.wards.map((w) => (
                <option key={w.slug} value={`${c.slug}/${w.slug}`}>
                  {w.name}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <SelectField label={t.booking.budget} optional optionalLabel={t.common.optional} value={input.budget} onChange={(e) => set("budget", e.target.value)}>
          <option value="">{t.booking.unsure}</option>
          {BUDGETS.map((b) => (
            <option key={b} value={b}>
              {t.booking.budgets[b]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label={t.booking.moveInLabel}
          optional
          optionalLabel={t.common.optional}
          value={input.moveIn}
          onChange={(e) => set("moveIn", e.target.value)}
          wrapperClassName="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]"
        >
          <option value="">{t.booking.chooseTime}</option>
          {MOVE_IN.map((m) => (
            <option key={m} value={m}>
              {t.booking.moveIn[m]}
            </option>
          ))}
        </SelectField>
      </FormSection>

      <FormSection title={t.booking.whenTitle}>
        <div role="radiogroup" aria-label={t.booking.dayGroup} className="min-w-0 sm:col-span-2">
          <p className="text-sm font-semibold text-ink">{t.booking.day}</p>
          <div className="scrollbar-none -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
            {days.map((d) => {
              const on = input.date === d;
              return (
                <label
                  key={d}
                  className={cn(
                    "flex w-16 shrink-0 cursor-pointer flex-col items-center rounded-[10px] border py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-plate",
                    on ? "plate border-transparent" : "border-line-strong bg-surface text-ink hover:border-ink/40",
                  )}
                >
                  <input type="radio" name="date" value={d} checked={on} onChange={() => set("date", d)} className="sr-only" />
                  <span className={cn("text-xs", on ? "text-white/85" : "text-muted")}>{fmt.weekday(d)}</span>
                  <span className="tabular text-base font-bold">{fmt.shortDay(d)}</span>
                </label>
              );
            })}
          </div>
          {errors.date ? <p className="mt-1.5 text-[0.8125rem] text-danger">{errors.date}</p> : null}
        </div>
        <ChoiceGroup legend={t.booking.slot} name="slot" value={input.slot} options={TIME_SLOTS.map((s) => ({ value: s, label: s }))} onChange={(v) => set("slot", v)} error={errors.slot} />
        <ChoiceGroup
          legend={t.booking.mode}
          name="mode"
          value={input.mode}
          options={[
            { value: "in_person", label: t.labels.visitMode.in_person, detail: t.booking.inPersonDetail },
            { value: "online", label: t.labels.visitMode.online, detail: t.booking.onlineDetail },
          ]}
          onChange={(v) => set("mode", v)}
        />
      </FormSection>

      <FormSection title={t.booking.contactTitle}>
        <TextField label={t.common.name} autoComplete="name" value={input.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <TextField label={t.common.phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="0903 456 512" value={input.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
        <ConsentCheck checked={input.consent} onChange={(v) => set("consent", v)} error={errors.consent}>
          {t.booking.consent}{" "}
          <Link href="/chinh-sach/chinh-sach-bao-mat" className="font-semibold text-plate underline">
            {t.common.privacyPolicy}
          </Link>
          .
        </ConsentCheck>
        <FormErrorSummary count={Object.keys(errors).length} lang={lang} />
      </FormSection>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button type="submit" size="lg">
          {t.booking.submit}
        </Button>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted">
          <Check aria-hidden className="size-4 text-success" />
          {t.booking.free}
        </p>
      </div>
    </form>
  );
}
