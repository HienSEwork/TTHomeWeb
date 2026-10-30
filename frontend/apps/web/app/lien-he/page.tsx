import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@tthome/data";
import { Container } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactMap } from "@/components/contact-map";
import { ContactForm } from "@/components/form-contact";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.contact.metaTitle, description: t.contact.metaDescription(SITE.hotline, SITE.address), alternates: { canonical: "/lien-he" } };
}

export default async function ContactPage() {
  const { lang, t } = await getServerI18n();
  const rows = [
    { icon: Phone, label: t.contact.hotline, value: SITE.hotline, href: SITE.hotlineHref },
    { icon: Mail, label: t.contact.email, value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: MapPin, label: t.contact.office, value: SITE.address },
    { icon: Clock, label: t.contact.hours, value: t.common.hours },
  ];
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: t.contact.crumb }]} lang={lang} />
      <h1 className="mt-6 text-title font-extrabold text-ink">{t.contact.title}</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">{t.contact.lead}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <dl className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
          {rows.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex gap-4 p-5">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-shutter" />
              <div>
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-0.5 font-semibold text-ink">
                  {href ? (
                    <a href={href} className="hover:text-plate hover:underline">
                      {value}
                    </a>
                  ) : (
                    value
                  )}
                </dd>
              </div>
            </div>
          ))}
        </dl>
        <ContactMap />
      </div>

      <section aria-labelledby="gui-tin" className="mt-14 max-w-3xl">
        <h2 id="gui-tin" className="text-2xl font-extrabold text-ink">
          {t.contact.formTitle}
        </h2>
        <div className="mt-5">
          <ContactForm />
        </div>
      </section>
    </Container>
  );
}
