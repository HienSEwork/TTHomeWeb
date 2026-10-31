import type { Metadata } from "next";
import Link from "next/link";
import { Container, SectionHeader } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/form-contact";
import { StepsList } from "@/components/steps-list";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.ctv.metaTitle, description: t.ctv.metaDescription, alternates: { canonical: "/tuyen-ctv" } };
}

const COMMISSION = [
  { key: "low", example: 2_000_000 * 0.3 },
  { key: "mid", example: 3_500_000 * 0.4 },
  { key: "high", example: 6_000_000 * 0.5 },
  { key: "landlord", example: 500_000 },
] as const;

export default async function PartnerPage() {
  const { lang, t, fmt } = await getServerI18n();
  return (
    <>
      <section className="border-b border-line bg-[linear-gradient(180deg,var(--color-ivory),#fff)]">
        <Container className="py-8 sm:py-12">
          <Breadcrumbs items={[{ label: t.ctv.crumb }]} lang={lang} />
          <h1 className="mt-6 max-w-3xl text-display font-extrabold text-balance text-ink">{t.ctv.title}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">{t.ctv.lead}</p>
          <Link href="/tuyen-dung" className="mt-5 inline-block font-semibold text-gold-ink underline underline-offset-4 hover:text-ink">
            {t.jobs.title}
          </Link>
        </Container>
      </section>

      <Container className="py-12">
        <SectionHeader title={t.ctv.commissionTitle} description={t.ctv.commissionText} />
        <div className="mt-6 overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-line bg-wash text-ink-soft">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">{t.ctv.colDeal}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{t.ctv.colRate}</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">{t.ctv.colExample}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COMMISSION.map((c) => (
                <tr key={c.key}>
                  <th scope="row" className="px-5 py-4 font-semibold text-ink">{t.ctv.commission[c.key].band}</th>
                  <td className="px-5 py-4 text-ink-soft">{t.ctv.commission[c.key].rate}</td>
                  <td className="tabular px-5 py-4 text-right font-bold text-shutter">{fmt.vnd(c.example)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>

      <Container className="pb-12">
        <SectionHeader title={t.ctv.howTitle} />
        <div className="mt-6">
          <StepsList steps={Object.values(t.ctv.how)} />
        </div>
      </Container>

      <Container>
        <section aria-labelledby="dang-ky-ctv" className="max-w-3xl">
          <h2 id="dang-ky-ctv" className="text-title font-extrabold text-ink">
            {t.ctv.formTitle}
          </h2>
          <div className="mt-6">
            <ContactForm variant="ctv" />
          </div>
        </section>
      </Container>
    </>
  );
}
