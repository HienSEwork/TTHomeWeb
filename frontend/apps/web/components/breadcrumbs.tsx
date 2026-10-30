import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getI18n, type Lang } from "@/lib/i18n";
import { JsonLd } from "./json-ld";

export type Crumb = { href?: string; label: string };

/** Visible breadcrumb plus BreadcrumbList structured data. */
export function Breadcrumbs({ items, lang }: { items: Crumb[]; lang?: Lang }) {
  const { t } = getI18n(lang);
  const all: Crumb[] = [{ href: "/", label: t.common.home }, ...items];
  return (
    <>
      <nav aria-label={t.common.breadcrumb} className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((c, i) => (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight aria-hidden className="size-3.5 text-line-strong" /> : null}
              {c.href && i < all.length - 1 ? (
                <Link href={c.href} className="hover:text-ink hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={i === all.length - 1 ? "page" : undefined} className="text-ink-soft">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            ...(c.href ? { item: `https://tthome.vn${c.href}` } : {}),
          })),
        }}
      />
    </>
  );
}
