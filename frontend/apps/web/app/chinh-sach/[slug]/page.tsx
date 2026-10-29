import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPolicy, POLICIES } from "@tthome/data";
import { Container, cn, formatDate } from "@tthome/ui";
import { ArticleBody } from "@/components/article-body";
import { Breadcrumbs } from "@/components/breadcrumbs";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const policy = getPolicy((await params).slug);
  if (!policy) return {};
  return { title: policy.title, alternates: { canonical: `/chinh-sach/${policy.slug}` } };
}

export default async function PolicyPage({ params }: Props) {
  const policy = getPolicy((await params).slug);
  if (!policy) notFound();
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Chính sách" }, { label: policy.title }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Các chính sách" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {POLICIES.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/chinh-sach/${p.slug}`}
                  aria-current={p.slug === policy.slug ? "page" : undefined}
                  className={cn(
                    "inline-flex rounded-lg px-3 py-1.5 text-sm font-medium",
                    p.slug === policy.slug ? "bg-gold-soft font-semibold text-gold-ink" : "text-ink-soft ring-1 ring-line hover:text-ink lg:ring-0 lg:hover:bg-ink/5",
                  )}
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article>
          <h1 className="text-title font-extrabold text-ink">{policy.title}</h1>
          <p className="mt-2 text-sm text-muted">Cập nhật ngày {formatDate(policy.updatedAt)}.</p>
          <div className="mt-8">
            <ArticleBody sections={policy.sections} />
          </div>
        </article>
      </div>
    </Container>
  );
}
