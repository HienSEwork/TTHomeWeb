import type { Metadata } from "next";
import { CalendarDays, Phone, Wallet } from "lucide-react";
import { getProjectBySlug, PROJECTS, SITE } from "@tthome/data";
import { Container } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BookingForm, type BookingTarget } from "@/components/form-booking";
import type { Lang } from "@/lib/i18n";
import { localRoomName } from "@/lib/i18n/content";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.booking.metaTitle, description: t.booking.metaDescription, alternates: { canonical: "/dat-lich" } };
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function findTarget(lang: Lang, projectParam?: string, roomParam?: string): BookingTarget {
  if (!projectParam) return null;
  const project = getProjectBySlug(projectParam) ?? PROJECTS.find((p) => p.code === projectParam.toUpperCase());
  if (!project) return null;
  const room = roomParam ? project.rooms.find((r) => r.code.toLowerCase() === roomParam.toLowerCase()) : undefined;
  return { projectName: project.name, roomName: room ? localRoomName(room.name, lang) : undefined, districtSlug: project.districtSlug };
}

export default async function BookingPage({ searchParams }: Props) {
  const params = await searchParams;
  const { lang, t } = await getServerI18n();
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const target = findTarget(lang, one(params.project), one(params.room));
  const promises = [
    { icon: Wallet, ...t.booking.promises.free },
    { icon: CalendarDays, ...t.booking.promises.many },
    { icon: Phone, title: t.booking.callbackTitle, text: t.booking.callbackText(t.common.hours) },
  ];

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: t.booking.title }]} lang={lang} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <h1 className="text-title font-extrabold text-ink">{t.booking.title}</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">{t.booking.lead}</p>
          <div className="mt-8">
            <BookingForm target={target} />
          </div>
        </div>
        <aside className="flex flex-col gap-4 lg:pt-20">
          <ul className="flex flex-col gap-5 rounded-card border border-line bg-surface p-6">
            {promises.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-shutter" />
                <div>
                  <p className="font-bold text-ink">{title}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="rounded-card border border-gold/50 bg-gold-soft p-6 text-ink">
            <p className="text-sm text-muted">{t.booking.urgent}</p>
            <a href={SITE.hotlineHref} className="tabular mt-1 block text-2xl font-extrabold text-gold-ink hover:underline">
              {SITE.hotline}
            </a>
          </div>
        </aside>
      </div>
    </Container>
  );
}
