import type { ReactNode } from "react";

/** Page title row with optional description and actions. */
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** A table wrapper that scrolls sideways on small screens instead of squeezing columns. */
export function TableFrame({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export const th = "border-b border-line bg-wash/60 px-4 py-2.5 text-xs font-semibold text-muted whitespace-nowrap";
export const td = "border-b border-line px-4 py-3 align-middle";

/** Compact control for toolbars. */
export const toolbarControl =
  "h-9 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-plate focus:outline-none focus:ring-2 focus:ring-plate/20";

/** A white panel with a title row, used for dashboard blocks and side panels. */
export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-card border border-line bg-surface ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="text-[0.9375rem] font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Says which parts are missing because their service did not answer, so a blank never reads as zero. */
export function ServiceNotice({ parts }: { parts: string[] }) {
  if (parts.length === 0) return null;
  return (
    <p role="status" className="mb-4 rounded-card bg-warn-tint px-4 py-3 text-sm text-warn">
      Chưa lấy được số liệu {parts.join(", ")}. Các ô đó để trống; tải lại trang sau ít phút.
    </p>
  );
}

/** Placeholder for a list that is empty or could not be loaded. */
export function EmptyRow({ children }: { children: ReactNode }) {
  return <li className="px-5 py-6 text-center text-sm text-muted">{children}</li>;
}
