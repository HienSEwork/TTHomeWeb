import type { Metadata } from "next";
import Link from "next/link";
import { FAQS, SITE } from "@tthome/data";
import { Container, buttonStyles } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { headingId } from "@/lib/articles";
import { localFaq } from "@/lib/i18n/content";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.faq.metaTitle, description: t.faq.metaDescription, alternates: { canonical: "/hoi-dap" } };
}

export default async function FaqPage() {
  const { lang, t } = await getServerI18n();
  const faqs = FAQS.map((f) => localFaq(f, lang));
  const groups = [...new Set(faqs.map((f) => f.group))];
  return (
    <Container className="py-8 sm:py-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
      <Breadcrumbs items={[{ label: t.faq.title }]} lang={lang} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[240px_1fr]">
        <nav aria-label={t.faq.groups} className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="text-title font-extrabold text-ink">{t.faq.title}</h1>
          <ul className="mt-6 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {groups.map((g) => (
              <li key={g}>
                <a href={`#${headingId(g)}`} className="inline-flex rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft ring-1 ring-line hover:text-ink lg:ring-0 lg:hover:bg-ink/5">
                  {g}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-10">
          {groups.map((g) => (
            <section key={g} aria-labelledby={headingId(g)}>
              <h2 id={headingId(g)} className="scroll-mt-24 text-xl font-extrabold text-ink">
                {g}
              </h2>
              <div className="mt-4">
                <FaqList items={faqs.filter((f) => f.group === g)} />
              </div>
            </section>
          ))}
          <div className="flex flex-col items-start gap-3 rounded-card bg-plate-tint p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold text-plate-dark">{t.faq.notFound}</p>
            <div className="flex gap-2">
              <a href={SITE.hotlineHref} className={buttonStyles({ variant: "plate" })}>
                {t.common.call(SITE.hotline)}
              </a>
              <Link href="/lien-he" className={buttonStyles({ variant: "secondary" })}>
                {t.faq.ask}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
