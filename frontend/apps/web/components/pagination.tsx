import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@tthome/ui";

export const PAGE_SIZE = 20;

/** The page to show (1-based), clamped to the pages that exist. */
export function pageFrom(raw: string | string[] | undefined, total: number, size = PAGE_SIZE): number {
  const pages = Math.max(1, Math.ceil(total / size));
  const n = Number.parseInt(Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? ""), 10);
  return Number.isFinite(n) ? Math.min(Math.max(1, n), pages) : 1;
}

/** Page numbers to show: always the first, last and the ones around the current page, with gaps as null. */
export function pageWindow(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const out: (number | null)[] = [];
  [...keep].sort((a, b) => a - b).forEach((n, i, all) => {
    if (i > 0 && n - all[i - 1]! > 1) out.push(null);
    out.push(n);
  });
  return out;
}

/** Links to the other result pages; keeps every other query parameter. Renders nothing for a single page. */
export function Pagination({
  page,
  total,
  size = PAGE_SIZE,
  basePath,
  params,
  labels,
}: {
  page: number;
  total: number;
  size?: number;
  basePath: string;
  params: Record<string, string | string[] | undefined>;
  labels: { label: string; prev: string; next: string; page: (n: number) => string; range: (from: number, to: number, total: number) => string };
}) {
  const pages = Math.ceil(total / size);
  if (pages <= 1) return null;
  const href = (n: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "trang" || v === undefined) continue;
      for (const one of Array.isArray(v) ? v : [v]) q.append(k, one);
    }
    if (n > 1) q.set("trang", String(n));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const step = "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-full px-3 text-sm font-semibold transition-colors";
  return (
    <nav aria-label={labels.label} className="mt-10 flex flex-col items-center gap-3">
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link href={href(page - 1)} rel="prev" className={cn(step, "border border-line-strong bg-white text-ink hover:bg-ivory")}>
              <ChevronLeft aria-hidden className="size-4" />
              <span className="max-sm:sr-only">{labels.prev}</span>
            </Link>
          ) : null}
        </li>
        {pageWindow(page, pages).map((n, i) =>
          n === null ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted">
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                href={href(n)}
                aria-label={labels.page(n)}
                aria-current={n === page ? "page" : undefined}
                className={cn(step, n === page ? "bg-[#1C1A17] text-white" : "border border-line-strong bg-white text-ink hover:bg-ivory")}
              >
                {n}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < pages ? (
            <Link href={href(page + 1)} rel="next" className={cn(step, "border border-line-strong bg-white text-ink hover:bg-ivory")}>
              <span className="max-sm:sr-only">{labels.next}</span>
              <ChevronRight aria-hidden className="size-4" />
            </Link>
          ) : null}
        </li>
      </ul>
      <p className="text-sm text-muted">{labels.range((page - 1) * size + 1, Math.min(page * size, total), total)}</p>
    </nav>
  );
}
