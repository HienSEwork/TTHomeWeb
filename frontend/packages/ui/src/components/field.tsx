import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const control =
  "w-full rounded-[10px] border border-line-strong bg-surface px-3 text-[0.9375rem] text-ink placeholder:text-muted transition-colors focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/20 aria-[invalid=true]:border-danger";

type FieldShellProps = {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  /** Text after an optional field's label; defaults to Vietnamese. */
  optionalLabel?: string;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
};

/** Label, control, then hint or error, wired with ids for screen readers. */
export function FieldShell({ label, hint, error, optional, optionalLabel = "(không bắt buộc)", className, children }: FieldShellProps) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional ? <span className="ml-1 font-normal text-muted">{optionalLabel}</span> : null}
      </label>
      {children({ id, describedBy: note ? noteId : undefined, invalid: Boolean(error) })}
      {note ? (
        <p id={noteId} className={cn("text-[0.8125rem]", error ? "text-danger" : "text-muted")}>
          {note}
        </p>
      ) : null}
    </div>
  );
}

type Common = { label: string; hint?: string; error?: string; optional?: boolean; optionalLabel?: string; wrapperClassName?: string };

export function TextField({ label, hint, error, optional, optionalLabel, wrapperClassName, className, ...props }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} optionalLabel={optionalLabel} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={cn(control, "h-11", className)} {...props} />
      )}
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  optionalLabel,
  wrapperClassName,
  className,
  children,
  ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} optionalLabel={optionalLabel} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <select id={id} aria-describedby={describedBy} aria-invalid={invalid} className={cn(control, "h-11 pr-8", className)} {...props}>
          {children}
        </select>
      )}
    </FieldShell>
  );
}

export function TextAreaField({ label, hint, error, optional, optionalLabel, wrapperClassName, className, ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} optionalLabel={optionalLabel} className={wrapperClassName}>
      {({ id, describedBy, invalid }) => (
        <textarea id={id} aria-describedby={describedBy} aria-invalid={invalid} className={cn(control, "min-h-28 py-2.5", className)} {...props} />
      )}
    </FieldShell>
  );
}

/** A chip that behaves like a checkbox, for filters and multi-select choices. */
export function ToggleChip({
  checked,
  onChange,
  children,
  name,
  value,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  name?: string;
  value?: string;
}) {
  return (
    <label
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors select-none has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus [&_svg]:size-4",
        checked ? "border-selected-line bg-selected text-on-selected" : "border-line-strong bg-surface text-ink hover:border-ink/40",
      )}
    >
      <input type="checkbox" className="sr-only" name={name} value={value} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}
