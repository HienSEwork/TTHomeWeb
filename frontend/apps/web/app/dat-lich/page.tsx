import type { Metadata } from "next";
import { CalendarDays, Phone, Wallet } from "lucide-react";
import { getProjectBySlug, PROJECTS, SITE } from "@tthome/data";
import { Container } from "@tthome/ui";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BookingForm, type BookingTarget } from "@/components/form-booking";

export const metadata: Metadata = {
  title: "Đặt lịch xem phòng, nhờ tư vấn",
  description: "Chọn ngày giờ, để lại số điện thoại. Nhân viên TTHOME gọi xác nhận trong 30 phút và dẫn bạn đi xem phòng miễn phí.",
  alternates: { canonical: "/dat-lich" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function findTarget(projectParam?: string, roomParam?: string): BookingTarget {
  if (!projectParam) return null;
  const project = getProjectBySlug(projectParam) ?? PROJECTS.find((p) => p.code === projectParam.toUpperCase());
  if (!project) return null;
  const room = roomParam ? project.rooms.find((r) => r.code.toLowerCase() === roomParam.toLowerCase()) : undefined;
  return { projectName: project.name, roomName: room?.name, districtSlug: project.districtSlug };
}

const PROMISES = [
  { icon: Wallet, title: "Miễn phí", text: "Không thu phí xem phòng hay phí tư vấn từ người thuê." },
  { icon: CalendarDays, title: "Xem nhiều phòng một buổi", text: "Nhân viên chọn sẵn 3–5 phòng hợp ngân sách, đi liền một lượt." },
  { icon: Phone, title: "Gọi lại trong 30 phút", text: `Từ ${SITE.hours.toLowerCase()}.` },
];

export default async function BookingPage({ searchParams }: Props) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const target = findTarget(one(params.project), one(params.room));

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Đặt lịch xem phòng" }]} />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <h1 className="text-title font-extrabold text-ink">Đặt lịch xem phòng</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Cho chúng tôi biết khu vực và thời gian bạn rảnh. Chưa chọn được phòng cũng không sao, nhân viên sẽ gợi ý theo nhu cầu của bạn.
          </p>
          <div className="mt-8">
            <BookingForm target={target} />
          </div>
        </div>
        <aside className="flex flex-col gap-4 lg:pt-20">
          <ul className="flex flex-col gap-5 rounded-card border border-line bg-surface p-6">
            {PROMISES.map(({ icon: Icon, title, text }) => (
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
            <p className="text-sm text-muted">Cần xem gấp hôm nay?</p>
            <a href={SITE.hotlineHref} className="tabular mt-1 block text-2xl font-extrabold text-gold-ink hover:underline">
              {SITE.hotline}
            </a>
          </div>
        </aside>
      </div>
    </Container>
  );
}
