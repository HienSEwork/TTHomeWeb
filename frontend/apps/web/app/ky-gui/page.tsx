import type { Metadata } from "next";
import Link from "next/link";
import { FAQS } from "@tthome/data";
import { Container, SectionHeader } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ConsignForm } from "@/components/form-consign";
import { FaqList } from "@/components/faq-list";
import { StepsList } from "@/components/steps-list";
import { localFaq } from "@/lib/i18n/content";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.consign.metaTitle, description: t.consign.metaDescription, alternates: { canonical: "/ky-gui" } };
}

export default async function ConsignPage() {
  const { lang, t } = await getServerI18n();
  const steps = Object.values(t.consign.steps);
  const benefits = Object.values(t.consign.benefits);
  return (
    <>
      <section className="border-b border-line bg-surface">
        <Container className="py-8 sm:py-12">
          <Breadcrumbs items={[{ label: t.consign.crumb }]} lang={lang} />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <h1 className="text-display font-extrabold text-balance text-ink">{t.consign.title}</h1>
              <p className="mt-4 max-w-xl text-lg text-ink-soft">{t.consign.lead}</p>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              {benefits.map((b) => (
                <div key={b.figure} className="rounded-card bg-wash p-4">
                  <dt className="tabular text-2xl font-extrabold text-shutter">{b.figure}</dt>
                  <dd className="mt-1 text-sm text-ink-soft">{b.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <SectionHeader title={t.consign.howTitle} />
        <div className="mt-6">
          <StepsList steps={steps} />
        </div>
      </Container>

      <Container className="grid gap-10 pb-4 lg:grid-cols-[1fr_360px]">
        <section aria-labelledby="form-ky-gui" className="min-w-0">
          <h2 id="form-ky-gui" className="text-title font-extrabold text-ink">
            {t.consign.formTitle}
          </h2>
          <p className="mt-2 text-ink-soft">
            {t.consign.sentBefore}{" "}
            <Link href="/tai-khoan/phong-ky-gui" className="font-semibold text-plate underline">
              {t.consign.myListings}
            </Link>
            .
          </p>
          <div className="mt-6">
            <ConsignForm />
          </div>
        </section>
        <aside aria-labelledby="hoi-ky-gui" className="lg:pt-24">
          <h2 id="hoi-ky-gui" className="text-lg font-bold text-ink">
            {t.consign.faqTitle}
          </h2>
          <div className="mt-3">
            <FaqList items={FAQS.filter((f) => f.audience === "landlord").map((f) => localFaq(f, lang))} />
          </div>
        </aside>
      </Container>
    </>
  );
}
