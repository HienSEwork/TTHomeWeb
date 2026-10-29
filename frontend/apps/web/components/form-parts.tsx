import Link from "next/link";
import type { ReactNode } from "react";
import { CircleCheck } from "lucide-react";
import { buttonStyles, cn } from "@tthome/ui";

/** A titled group of fields inside a long form. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 border-t border-line pt-6 first:border-t-0 first:pt-0">
      <legend className="float-left w-full text-lg font-bold text-ink">{title}</legend>
      {description ? <p className="clear-both pt-1 text-sm text-muted">{description}</p> : null}
      <div className="clear-both grid gap-4 pt-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Consent checkbox with its error message. */
export function ConsentCheck({ checked, onChange, error, children }: { checked: boolean; onChange: (v: boolean) => void; error?: string; children: ReactNode }) {
  return (
    <div className="sm:col-span-2">
      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
          className="mt-0.5 size-4.5 shrink-0 accent-shutter"
        />
        <span>{children}</span>
      </label>
      {error ? <p className="mt-1.5 pl-7 text-[0.8125rem] text-danger">{error}</p> : null}
    </div>
  );
}

/** Radio buttons drawn as cards. */
export function ChoiceGroup<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
  error,
  className,
}: {
  legend: string;
  name: string;
  value: T | "";
  options: { value: T; label: string; detail?: string }[];
  onChange: (v: T) => void;
  error?: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={legend} className={cn("sm:col-span-2", className)}>
      <p className="text-sm font-semibold text-ink">{legend}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "cursor-pointer rounded-[10px] border px-3.5 py-2 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-plate",
              value === o.value ? "border-shutter bg-shutter-tint font-semibold text-shutter-dark" : "border-line-strong bg-surface text-ink hover:border-ink/40",
            )}
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
            <span className="block">{o.label}</span>
            {o.detail ? <span className="block text-xs font-normal text-muted">{o.detail}</span> : null}
          </label>
        ))}
      </div>
      {error ? <p className="mt-1.5 text-[0.8125rem] text-danger">{error}</p> : null}
    </div>
  );
}

/** What the person sees after a form is sent: what happens next and where to go. */
export function FormSuccess({ title, children, onReset, resetLabel }: { title: string; children: ReactNode; onReset?: () => void; resetLabel?: string }) {
  return (
    <div role="status" className="flex flex-col items-start rounded-card border border-shutter/30 bg-shutter-tint p-6 sm:p-8">
      <CircleCheck aria-hidden className="size-9 text-shutter" />
      <h2 className="mt-4 text-2xl font-extrabold text-ink">{title}</h2>
      <div className="mt-2 max-w-lg text-ink-soft">{children}</div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/tim-kiem" className={buttonStyles({ variant: "primary" })}>
          Xem thêm phòng
        </Link>
        {onReset ? (
          <button type="button" onClick={onReset} className={buttonStyles({ variant: "secondary" })}>
            {resetLabel ?? "Gửi thêm"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Message shown above the submit button when some fields need fixing. */
export function FormErrorSummary({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <p role="alert" className="rounded-lg bg-danger-tint px-3 py-2 text-sm font-medium text-danger sm:col-span-2">
      Còn {count} mục cần sửa trước khi gửi.
    </p>
  );
}
