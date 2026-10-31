"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { CITIES, TODAY } from "@tthome/data";
import { Button, SelectField, TextField, cn } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";
import { JOB_POSITIONS, JOB_STATUSES, validateJob, type Errors, type JobField, type JobInput } from "@/lib/validation";
import { ConsentCheck, FormErrorSummary, FormSuccess } from "./form-parts";

/** Two or more options side by side, one picked: position and gender. */
function Segmented<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  error,
}: {
  legend: string;
  name: string;
  value: T | "";
  options: { value: T; label: string; detail?: string }[];
  onChange: (v: T) => void;
  error?: string;
}) {
  return (
    <div role="radiogroup" aria-label={legend} aria-required className="min-w-0">
      <p className="text-sm font-semibold text-ink">{legend} *</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-[10px] border px-3 py-2.5 text-center text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
              value === o.value ? "border-selected-line bg-selected font-semibold text-on-selected" : "border-line-strong bg-wash text-ink-soft hover:border-gold-deep",
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            <span>{o.label}</span>
            {o.detail ? <span className="text-xs font-normal text-muted">({o.detail})</span> : null}
          </label>
        ))}
      </div>
      {error ? <p className="mt-1.5 text-[0.8125rem] text-danger">{error}</p> : null}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/** Applying to be a TTHOME partner or sales consultant. */
export function JobForm() {
  const { lang, t } = useI18n();
  const [input, setInput] = useState<JobInput>({
    position: "",
    name: "",
    birthDate: "",
    gender: "",
    email: "",
    phone: "",
    city: "",
    status: "",
    facebook: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Errors<JobField>>({});
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);
  // The youngest applicant accepted is 16.
  const latestBirth = `${Number(TODAY.slice(0, 4)) - 16}${TODAY.slice(4)}`;

  function set<K extends JobField>(key: K, value: JobInput[K]) {
    const next = { ...input, [key]: value };
    setInput(next);
    if (tried) setErrors(validateJob(next, TODAY, t.validation));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateJob(input, TODAY, t.validation);
    setTried(true);
    setErrors(found);
    if (Object.keys(found).length === 0) setSent(true);
  }

  if (sent) {
    return (
      <FormSuccess title={t.jobs.done} lang={lang}>
        <p>{t.jobs.doneText(input.name.trim(), input.phone)}</p>
      </FormSuccess>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5 rounded-[20px] border border-line bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8">
      <div>
        <h2 className="text-xl font-extrabold text-ink">{t.jobs.formTitle}</h2>
        <p className="mt-1 text-sm text-muted">{t.jobs.formLead}</p>
      </div>

      <Segmented
        legend={t.jobs.position}
        name="position"
        value={input.position}
        options={JOB_POSITIONS.map((p) => ({ value: p, label: t.jobs.positions[p].label, detail: t.jobs.positions[p].detail }))}
        onChange={(v) => set("position", v)}
        error={errors.position}
      />

      <Row>
        <TextField label={`${t.jobs.name} *`} autoComplete="name" placeholder={t.jobs.namePlaceholder} value={input.name} onChange={(e) => set("name", e.target.value)} error={errors.name} aria-required />
        <TextField label={`${t.jobs.birthDate} *`} type="date" autoComplete="bday" max={latestBirth} value={input.birthDate} onChange={(e) => set("birthDate", e.target.value)} error={errors.birthDate} aria-required />
      </Row>

      <Segmented
        legend={t.jobs.gender}
        name="gender"
        value={input.gender}
        options={(["male", "female"] as const).map((g) => ({ value: g, label: t.jobs.genders[g] }))}
        onChange={(v) => set("gender", v)}
        error={errors.gender}
      />

      <Row>
        <TextField label={`${t.jobs.email} *`} type="email" autoComplete="email" placeholder={t.jobs.emailPlaceholder} value={input.email} onChange={(e) => set("email", e.target.value)} error={errors.email} aria-required />
        <TextField
          label={`${t.jobs.phone} *`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t.jobs.phonePlaceholder}
          value={input.phone}
          onChange={(e) => set("phone", e.target.value)}
          error={errors.phone}
          hint={t.jobs.phoneHint}
          aria-required
        />
      </Row>

      <SelectField label={`${t.jobs.area} *`} value={input.city} onChange={(e) => set("city", e.target.value)} error={errors.city} aria-required>
        <option value="">{t.jobs.areaPlaceholder}</option>
        {CITIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </SelectField>

      <div role="radiogroup" aria-label={t.jobs.status} aria-required>
        <p className="text-sm font-semibold text-ink">{t.jobs.status} *</p>
        <p className="text-xs text-muted">{t.jobs.statusHint}</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {JOB_STATUSES.map((s) => (
            <label
              key={s}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus",
                input.status === s ? "border-selected-line bg-selected font-semibold text-on-selected" : "border-line bg-wash text-ink-soft hover:border-gold-deep",
              )}
            >
              <input type="radio" name="status" value={s} checked={input.status === s} onChange={() => set("status", s)} className="size-4 shrink-0 accent-gold-deep" />
              {t.jobs.statuses[s]}
            </label>
          ))}
        </div>
        {errors.status ? <p className="mt-1.5 text-[0.8125rem] text-danger">{errors.status}</p> : null}
      </div>

      <TextField
        label={t.jobs.facebook}
        optional
        optionalLabel={t.common.optional}
        type="url"
        inputMode="url"
        placeholder={t.jobs.facebookPlaceholder}
        value={input.facebook}
        onChange={(e) => set("facebook", e.target.value)}
        error={errors.facebook}
      />

      <ConsentCheck checked={input.consent} onChange={(v) => set("consent", v)} error={errors.consent}>
        {t.jobs.consent}{" "}
        <Link href="/chinh-sach/chinh-sach-bao-mat" className="font-semibold text-gold-ink underline">
          {t.common.privacyPolicy}
        </Link>
        .
      </ConsentCheck>
      <FormErrorSummary count={Object.keys(errors).length} lang={lang} />

      <Button type="submit" size="lg" className="w-full rounded-full">
        {t.jobs.submit}
      </Button>
    </form>
  );
}
