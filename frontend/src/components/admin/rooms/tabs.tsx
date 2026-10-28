"use client";

// Underline tabs on a full-width rule.
export function Tabs<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex overflow-x-auto border-b border-line">
      {options.map(([v, text]) => (
        <button
          key={v}
          role="tab"
          type="button"
          aria-selected={v === value}
          onClick={() => onChange(v)}
          className={`-mb-px h-11 shrink-0 border-b-2 px-4 text-sm font-semibold transition-colors duration-200 active:scale-[0.98] ${
            v === value ? "border-gold-deep text-ink" : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
