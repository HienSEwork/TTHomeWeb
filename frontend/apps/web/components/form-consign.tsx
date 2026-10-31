"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Camera, X } from "lucide-react";
import { CITIES, ROOM_TYPE_LABEL, findCity, type RoomType } from "@tthome/data";
import { Button, SelectField, TextAreaField, TextField, ToggleChip } from "@tthome/ui";
import { useI18n } from "@/lib/i18n/client";
import { validateConsign, type ConsignField, type ConsignInput, type Errors } from "@/lib/validation";
import { ConsentCheck, FormErrorSummary, FormSection, FormSuccess } from "./form-parts";

const TYPES = Object.keys(ROOM_TYPE_LABEL) as RoomType[];
const MAX_PHOTOS = 20;

export function ConsignForm() {
  const { lang, t, fmt } = useI18n();
  const fileInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [input, setInput] = useState<Omit<ConsignInput, "photos">>({
    address: "",
    city: "",
    ward: "",
    roomCount: "",
    priceFrom: "",
    roomTypes: [],
    name: "",
    phone: "",
    consent: false,
  });
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors<ConsignField>>({});
  const [tried, setTried] = useState(false);
  const [sent, setSent] = useState(false);

  function set<K extends keyof typeof input>(key: K, value: (typeof input)[K]) {
    const next = { ...input, [key]: value };
    setInput(next);
    if (tried) setErrors(validateConsign({ ...next, photos: files.length }, t.validation));
  }

  function toggleType(type: RoomType, on: boolean) {
    set("roomTypes", on ? [...input.roomTypes, type] : input.roomTypes.filter((t) => t !== type));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validateConsign({ ...input, photos: files.length }, t.validation);
    setTried(true);
    setErrors(found);
    if (Object.keys(found).length === 0) setSent(true);
  }

  if (sent) {
    return (
      <FormSuccess title={t.consign.done} lang={lang}>
        <p>{t.consign.doneText(input.name.trim(), input.phone)}</p>
      </FormSuccess>
    );
  }

  const price = Number(input.priceFrom.replace(/\D/g, ""));
  const wards = findCity(input.city)?.wards ?? [];

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-8 rounded-[20px] border border-line bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8">
      <FormSection title={t.consign.addressTitle}>
        <TextField label={t.consign.address} placeholder={t.consign.addressPlaceholder} value={input.address} onChange={(e) => set("address", e.target.value)} error={errors.address} wrapperClassName="sm:col-span-2" />
        <SelectField
          label={t.consign.city}
          value={input.city}
          onChange={(e) => {
            const next = { ...input, city: e.target.value, ward: "" };
            setInput(next);
            if (tried) setErrors(validateConsign({ ...next, photos: files.length }, t.validation));
          }}
          error={errors.city}
        >
          <option value="">{t.common.choose}</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField label={t.consign.ward} value={input.ward} onChange={(e) => set("ward", e.target.value)} error={errors.ward} disabled={!input.city}>
          <option value="">{input.city ? t.common.choose : t.consign.pickCityFirst}</option>
          {wards.map((w) => (
            <option key={w.slug} value={w.slug}>
              {w.name}
            </option>
          ))}
        </SelectField>
      </FormSection>

      <FormSection title={t.consign.roomsTitle}>
        <TextField label={t.consign.roomCount} type="number" inputMode="numeric" min={1} value={input.roomCount} onChange={(e) => set("roomCount", e.target.value)} error={errors.roomCount} />
        <TextField
          label={t.consign.priceFrom}
          inputMode="numeric"
          placeholder="3500000"
          value={input.priceFrom}
          onChange={(e) => set("priceFrom", e.target.value)}
          error={errors.priceFrom}
          hint={price >= 500_000 ? t.consign.priceHint(fmt.priceShort(price)) : undefined}
        />
        <div className="sm:col-span-2">
          <p className="text-sm font-semibold text-ink">{t.consign.roomTypes}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map((type) => (
              <ToggleChip key={type} checked={input.roomTypes.includes(type)} onChange={(on) => toggleType(type, on)}>
                {t.labels.roomType[type]}
              </ToggleChip>
            ))}
          </div>
          {errors.roomTypes ? <p className="mt-1.5 text-[0.8125rem] text-danger">{errors.roomTypes}</p> : null}
        </div>
        <TextAreaField label={t.consign.note} optional optionalLabel={t.common.optional} placeholder={t.consign.notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)} wrapperClassName="sm:col-span-2" />
      </FormSection>

      <FormSection title={t.consign.photosTitle} description={t.consign.photosText}>
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-card border-2 border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted transition-colors hover:border-plate hover:bg-plate-tint/40"
          >
            <Camera aria-hidden className="size-7 text-plate" />
            <span className="font-semibold text-ink">{t.consign.pickPhotos}</span>
            {t.consign.photoRules}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-label={t.consign.pickPhotosLabel}
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []).filter((f) => f.size <= 10 * 1024 * 1024);
              setFiles((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
              e.target.value = "";
            }}
          />
          {files.length ? (
            <ul className="mt-3 flex flex-col gap-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg bg-wash px-3 py-2 text-sm">
                  <span className="truncate text-ink">{f.name}</span>
                  <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="shrink-0 text-muted hover:text-danger" aria-label={t.consign.removePhoto(f.name)}>
                    <X aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </FormSection>

      <FormSection title={t.consign.ownerTitle}>
        <TextField label={t.common.name} autoComplete="name" value={input.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
        <TextField label={t.common.phone} type="tel" inputMode="tel" autoComplete="tel" value={input.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
        <ConsentCheck checked={input.consent} onChange={(v) => set("consent", v)} error={errors.consent}>
          {t.consign.consent}{" "}
          <Link href="/chinh-sach/chinh-sach-ky-gui" className="font-semibold text-plate underline">
            {t.consign.consentLink}
          </Link>
          .
        </ConsentCheck>
        <FormErrorSummary count={Object.keys(errors).length} lang={lang} />
      </FormSection>

      <Button type="submit" size="lg" className="self-start">
        {t.consign.submit}
      </Button>
    </form>
  );
}
