"use client";

import { useId, useState } from "react";

export function Field({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = props.type === "password";
  return (
    <div className="group">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-soft transition-colors group-focus-within:text-gold-deep">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          {...props}
          type={isPassword && shown ? "text" : props.type}
          className="h-12 w-full rounded-xl bg-white px-4 text-base border border-gold/60 transition-colors duration-200 placeholder:text-ink/35 focus:border-gold-deep focus:outline-2 focus:outline-gold-deep/40"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-gold-deep"
            aria-pressed={shown}
          >
            {shown ? "Ẩn" : "Hiện"}
          </button>
        )}
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-soft">{hint}</p>}
    </div>
  );
}

export function Button({ busy, children, ...props }: { busy?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className="relative h-12 w-full overflow-hidden rounded-full bg-gold font-semibold text-ink transition duration-200 hover:bg-[#d9ab4d] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
    >
      <span className={busy ? "opacity-0" : ""}>{children}</span>
      {busy && <span className="absolute inset-0 grid place-items-center" aria-label="Đang xử lý"><Dots /></span>}
    </button>
  );
}

const Dots = () => (
  <span className="flex gap-1.5" aria-hidden>
    {[0, 1, 2].map((i) => (
      <span key={i} className="size-1.5 animate-bounce rounded-full bg-ink" style={{ animationDelay: `${i * 120}ms` }} />
    ))}
  </span>
);

export function TextButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className="text-sm font-semibold text-gold-deep underline-offset-4 hover:underline disabled:opacity-50" />;
}

// Segmented switch: the gold pill slides to the chosen option.
export function Tabs({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  const index = Math.max(0, options.findIndex(([v]) => v === value));
  return (
    <div role="tablist" className="relative grid rounded-full bg-cream p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-gold transition-transform duration-300 ease-out-quint"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map(([v, label]) => (
        <button
          key={v}
          role="tab"
          type="button"
          aria-selected={v === value}
          onClick={() => onChange(v)}
          className="relative h-10 rounded-full text-sm font-semibold text-ink"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Notice({ tone = "error", children }: { tone?: "error" | "ok"; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      key={String(children)}
      className={`${tone === "error" ? "shake bg-danger/10 text-danger" : "bg-ok/10 text-ok"} rounded-xl px-4 py-3 text-sm font-medium`}
    >
      {children}
    </p>
  );
}

export const OtpField = (props: Omit<React.ComponentProps<typeof Field>, "label">) => (
  <Field
    label="Mã xác nhận (6 số)"
    inputMode="numeric"
    autoComplete="one-time-code"
    maxLength={6}
    pattern="\d{6}"
    required
    {...props}
  />
);
