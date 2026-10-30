import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPolicy, inventoryFigures, photo, SITE } from "@tthome/data";
import { Container, Plate, buttonStyles } from "@tthome/ui";
import { ArticleBody } from "@/components/article-body";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { localPolicy } from "@/lib/i18n/content";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.about.metaTitle, description: t.about.metaDescription, alternates: { canonical: "/ve-chung-toi" } };
}

export default async function AboutPage() {
  const { lang, t, fmt } = await getServerI18n();
  const inv = inventoryFigures();
  const policy = getPolicy("chinh-sach-bao-mat");
  const privacy = policy ? localPolicy(policy, lang) : undefined;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE.company,
          url: "https://tthome.vn",
          telephone: SITE.hotline,
          email: SITE.email,
          taxID: SITE.taxCode,
          address: { "@type": "PostalAddress", streetAddress: SITE.address, addressLocality: "TP. Cần Thơ", addressCountry: "VN" },
        }}
      />
      <Container className="py-8 sm:py-12">
        <Breadcrumbs items={[{ label: t.about.crumb }]} lang={lang} />
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <h1 className="text-display font-extrabold text-balance text-ink">{t.about.title}</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">{t.about.lead(inv.projects, inv.rooms)}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-line">
            <Image src={photo(12, 1200)} alt={t.about.photoAlt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            <Plate value={inv.vacant} unit={t.about.vacantUnit} size="lg" className="absolute bottom-4 left-4" />
          </div>
        </div>

        <section aria-labelledby="cach-lam" className="mt-16">
          <h2 id="cach-lam" className="text-title font-extrabold text-ink">
            {t.about.howTitle}
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {Object.values(t.about.principles).map((p) => (
              <li key={p.title} className="rounded-card border border-line bg-surface p-6">
                <h3 className="text-lg font-bold text-ink">{p.title}</h3>
                <p className="mt-2 text-ink-soft">{p.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="thong-tin" className="mt-16 grid gap-6 rounded-[22px] border border-line bg-ivory p-8 text-ink sm:p-10 md:grid-cols-2">
          <div>
            <h2 id="thong-tin" className="text-2xl font-extrabold">
              {t.about.companyTitle}
            </h2>
            <dl className="mt-5 space-y-3 text-ink-soft">
              <div><dt className="text-sm text-muted">{t.about.companyName}</dt><dd>{SITE.company}</dd></div>
              <div><dt className="text-sm text-muted">{t.about.taxCode}</dt><dd className="tabular">{SITE.taxCode}</dd></div>
              <div><dt className="text-sm text-muted">{t.about.office}</dt><dd>{SITE.address}</dd></div>
            </dl>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end md:justify-end">
            <Link href="/lien-he" className={buttonStyles({ variant: "wall", size: "lg" })}>
              {t.about.contactUs}
            </Link>
            <Link href="/tuyen-ctv" className="text-sm font-semibold text-ink-soft underline hover:text-ink">
              {t.about.partner}
            </Link>
          </div>
        </section>

        {privacy ? (
          <section id="chinh-sach-bao-mat" aria-labelledby="bao-mat" className="mt-16 scroll-mt-24 border-t border-line pt-12">
            <h2 id="bao-mat" className="text-title font-extrabold text-ink">
              {t.about.privacyTitle}
            </h2>
            <p className="mt-2 text-sm text-muted">{t.policy.updated(fmt.date(privacy.updatedAt))}</p>
            <div className="mt-8">
              <ArticleBody sections={privacy.sections} />
            </div>
          </section>
        ) : null}
      </Container>
    </>
  );
}
