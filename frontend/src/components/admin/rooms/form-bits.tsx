"use client";

import { useId } from "react";

export const ghostButton =
  "inline-flex h-10 items-center justify-center rounded-full border border-gold/60 px-4 text-sm font-semibold text-ink transition duration-200 hover:bg-cream active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

const control = "w-full rounded-xl border border-gold/60 bg-white px-4 text-base transition-colors duration-200 focus:border-gold-deep focus:outline-2 focus:outline-gold-deep/40";
const labelClass = "mb-1.5 block text-sm font-medium text-ink-soft";

export const options = (map: Record<string, string>) =>
  Object.entries(map).map(([v, text]) => (
    <option key={v} value={v}>
      {text}
    </option>
  ));

export function SelectField({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <select id={id} {...props} className={`${control} h-12`}>{children}</select>
    </div>
  );
}

export function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <textarea id={id} rows={4} {...props} className={`${control} py-3`} />
    </div>
  );
}

export function CheckField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-base">
      <input type="checkbox" {...props} className="size-4 accent-gold-deep" />
      {label}
    </label>
  );
}

// A yes / no / unknown value for nullable booleans.
export function TriField({ label, value, ...props }: { label: string; value: boolean | null } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "defaultValue">) {
  return (
    <SelectField label={label} defaultValue={value === null ? "" : String(value)} {...props}>
      <option value="">Chưa rõ</option>
      <option value="true">Có</option>
      <option value="false">Không</option>
    </SelectField>
  );
}

// Form values to request values: an empty input means null.
export const str = (data: FormData, key: string) => String(data.get(key) ?? "").trim() || null;
export const num = (data: FormData, key: string) => {
  const v = str(data, key);
  return v === null ? null : Number(v);
};
export const tri = (data: FormData, key: string) => {
  const v = str(data, key);
  return v === null ? null : v === "true";
};
export const flag = (data: FormData, key: string) => data.get(key) === "on";
