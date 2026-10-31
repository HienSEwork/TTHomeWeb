import type { Metadata } from "next";
import Link from "next/link";
import { Clock, GraduationCap, Wallet } from "lucide-react";
import { Container } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JobForm } from "@/components/form-job";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.jobs.metaTitle, description: t.jobs.metaDescription, alternates: { canonical: "/tuyen-dung" } };
}

const BENEFIT_ICON = { income: Wallet, training: GraduationCap, flexible: Clock } as const;

export default async function JobsPage() {
  const { lang, t } = await getServerI18n();
  return (
    <>
      <section className="border-b border-line bg-[linear-gradient(180deg,var(--color-ivory),#fff)]">
        <Container className="py-8 sm:py-12">
          <Breadcrumbs items={[{ label: t.jobs.crumb }]} lang={lang} />
          <p className="mt-6 text-sm font-semibold text-gold-ink">{t.jobs.eyebrow}</p>
          <h1 className="mt-2 max-w-4xl text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.1] font-extrabold tracking-tight text-balance text-ink">{t.jobs.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{t.jobs.lead}</p>
        </Container>
      </section>

      <Container className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:py-14">
        <div className="mx-auto w-full max-w-2xl lg:mx-0">
          <JobForm />
        </div>
        <aside className="flex flex-col gap-3 lg:pt-2">
          {(Object.keys(t.jobs.benefits) as (keyof typeof t.jobs.benefits)[]).map((key) => {
            const Icon = BENEFIT_ICON[key];
            return (
              <div key={key} className="flex gap-3 rounded-card border border-line bg-white p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-deep">
                  <Icon aria-hidden className="size-5" />
                </span>
                <div>
                  <h2 className="font-bold text-ink">{t.jobs.benefits[key].title}</h2>
                  <p className="mt-0.5 text-sm text-ink-soft">{t.jobs.benefits[key].text}</p>
                </div>
              </div>
            );
          })}
          <Link href="/tuyen-ctv" className="mt-1 text-sm font-semibold text-gold-ink underline underline-offset-4 hover:text-ink">
            {t.jobs.partnerLink}
          </Link>
        </aside>
      </Container>
    </>
  );
}
