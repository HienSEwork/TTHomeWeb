import Link from "next/link";
import { CalendarDays, ClipboardCheck, House, Users, type LucideIcon } from "lucide-react";
import { APPOINTMENT_STATUS, VISIT_MODE } from "@tthome/data";
import { Badge, buttonStyles, formatCount, formatPriceShort } from "@tthome/ui";
import { StackedBar } from "@/components/bars";
import { EmptyRow, PageHeader, Panel, ServiceNotice } from "@/components/page-parts";
import { TrafficPanel } from "@/components/traffic-panel";
import { api, optional, type Page } from "@/lib/api";
import { SERIES } from "@/lib/chart";
import { fmt } from "@/lib/format";
import {
  dailySeries,
  nameIndex,
  unavailableLabels,
  vnDay,
  vnDayBounds,
  type AppointmentDto,
  type ConsultDto,
  type DashboardResponse,
  type NamedDto,
  type ReportOverview,
  type SubmissionDto,
} from "@/lib/report";

export const dynamic = "force-dynamic";

function count(n: number | null | undefined): string {
  return n == null ? "–" : formatCount(n);
}

function Kpi({ icon: Icon, label, value, detail, href }: { icon: LucideIcon; label: string; value: string; detail: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="group rounded-card border border-line bg-surface p-5 transition-colors hover:border-ink/25">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-soft">
        <Icon aria-hidden className="size-4 text-muted" />
        {label}
      </div>
      <p className="mt-3 text-[2rem] leading-none font-extrabold tracking-tight text-ink tabular">{value}</p>
      <p className="mt-2 text-sm text-muted">{detail}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const today = vnDay(now);
  const [d, overview, appts, waiting, consults, projects, staff] = await Promise.all([
    optional(api<DashboardResponse>("/admin/dashboard", { query: { days: 7 } })),
    optional(api<ReportOverview>("/admin/reports/overview", { query: { from: new Date(now.getTime() - 30 * 86_400_000).toISOString(), to: now.toISOString() } })),
    optional(api<Page<AppointmentDto>>("/admin/booking/appointments", { query: { ...vnDayBounds(today), size: 100 } })),
    optional(api<Page<SubmissionDto>>("/admin/consignment/submissions", { query: { status: "submitted", size: 5 } })),
    optional(api<Page<ConsultDto>>("/admin/crm/consult-requests", { query: { status: "new", size: 5 } })),
    optional(api<Page<NamedDto>>("/admin/projects", { query: { size: 100 } })),
    optional(api<Page<NamedDto>>("/admin/users", { query: { role: "CONSULTANT", size: 100 } })),
  ]);

  const projectName = nameIndex(projects?.items);
  const staffName = nameIndex(staff?.items);
  const todayAppts = [...(appts?.items ?? [])].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const inv = overview?.inventory ?? null;
  const missing = unavailableLabels([...(d?.unavailable ?? []), ...(overview?.unavailable ?? []), ...(d ? [] : ["report"])]);

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        description={`Số liệu hôm nay, ${fmt.day(today).toLowerCase()}. Khách mới và lịch hẹn tính trong 7 ngày gần nhất.`}
        actions={
          <Link href="/bao-cao" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Mở báo cáo
          </Link>
        }
      />
      <ServiceNotice parts={missing} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={House} label="Phòng trống" value={count(d?.vacantRooms)} detail={`trên ${count(d?.totalRooms)} phòng đang quản lý`} href="/phong" />
        <Kpi
          icon={CalendarDays}
          label="Lịch hẹn sắp tới"
          value={count(d?.upcomingAppointments)}
          detail={
            <>
              <span className="font-semibold text-warn">{count(d?.appointmentsToConfirm)} lịch</span> chờ xác nhận
            </>
          }
          href="/lich-hen"
        />
        <Kpi icon={Users} label="Khách mới trong tuần" value={count(d?.newCustomers)} detail={`${count(d?.newConsultRequests)} yêu cầu tư vấn chưa gọi`} href="/khach-hang" />
        <Kpi icon={ClipboardCheck} label="Ký gửi chờ duyệt" value={count(d?.pendingConsignments)} detail="Cần phản hồi chủ nhà trong 24 giờ" href="/ky-gui" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <TrafficPanel
          days={overview?.traffic ? dailySeries(overview.traffic.viewsByDay, now) : null}
          totals={[
            { label: "Lượt khách", value: overview?.traffic?.visitors ?? null },
            { label: "Lịch hẹn", value: overview?.appointments?.created ?? null },
            { label: "Yêu cầu tư vấn", value: overview?.customers?.newConsultRequests ?? null },
          ]}
        />
        <Panel title="Tình trạng phòng">
          <div className="px-5 py-5">
            {inv && inv.rooms > 0 ? (
              <>
                <StackedBar
                  label="Tình trạng phòng"
                  items={[
                    { label: "Còn trống", value: inv.vacant, color: SERIES.green },
                    { label: "Đang giữ chỗ", value: inv.reserved, color: SERIES.yellow },
                    { label: "Đã thuê", value: inv.rented, color: SERIES.blue },
                    { label: "Đang ẩn", value: inv.hidden, color: SERIES.red },
                  ]}
                />
                <p className="mt-5 border-t border-line pt-4 text-sm text-muted">
                  {inv.projects} dự án, {inv.rooms} phòng. Tỷ lệ lấp đầy{" "}
                  <span className="font-semibold text-ink">{Math.round(((inv.rented + inv.reserved) / inv.rooms) * 100)}%</span>.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">{inv ? "Chưa có phòng nào." : "Chưa lấy được số liệu phòng."}</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title={`Lịch hẹn hôm nay (${todayAppts.length})`}
          action={
            <Link href="/lich-hen" className="text-sm font-semibold text-shutter hover:underline">
              Tất cả lịch hẹn
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {todayAppts.map((a) => {
              const s = APPOINTMENT_STATUS[a.status];
              const staffLabel = a.staffId ? staffName.get(a.staffId) : null;
              return (
                <li key={a.id} className="flex gap-4 px-5 py-3">
                  <p className="w-12 shrink-0 pt-0.5 font-bold text-ink tabular">{fmt.time(a.scheduledAt)}</p>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{a.contactName ?? a.contactPhone ?? a.code}</p>
                    <p className="truncate text-sm text-muted">{projectName.get(a.projectId) ?? "Dự án không rõ"}</p>
                    <p className="mt-1 text-xs text-muted">
                      {VISIT_MODE[a.mode]}, {staffLabel ?? <span className="font-semibold text-warn">chưa phân công</span>}
                    </p>
                  </div>
                  <Badge tone={s.tone} className="self-start">
                    {s.label}
                  </Badge>
                </li>
              );
            })}
            {todayAppts.length === 0 ? <EmptyRow>{appts ? "Hôm nay chưa có lịch hẹn." : "Chưa lấy được lịch hẹn."}</EmptyRow> : null}
          </ul>
        </Panel>

        <Panel
          title="Ký gửi chờ duyệt"
          action={
            <Link href="/ky-gui" className="text-sm font-semibold text-shutter hover:underline">
              Duyệt
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {(waiting?.items ?? []).map((s) => (
              <li key={s.id} className="px-5 py-3">
                <p className="font-semibold text-ink">{s.addressText}</p>
                <p className="text-sm text-muted">
                  {s.roomCount ?? "?"} phòng{s.expectedPriceMin ? ` từ ${formatPriceShort(s.expectedPriceMin)}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {s.landlordName}, gửi lúc {fmt.dateTime(s.createdAt)}
                </p>
              </li>
            ))}
            {!waiting?.items.length ? <EmptyRow>{waiting ? "Không có hồ sơ nào đang chờ." : "Chưa lấy được hồ sơ ký gửi."}</EmptyRow> : null}
          </ul>
        </Panel>

        <Panel
          title="Yêu cầu tư vấn mới"
          action={
            <Link href="/khach-hang?tab=tu-van" className="text-sm font-semibold text-shutter hover:underline">
              Phân công
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {(consults?.items ?? []).map((c) => (
              <li key={c.id} className="px-5 py-3">
                <p className="font-semibold text-ink">
                  {c.fullName ?? "Khách chưa để tên"} <span className="font-normal text-muted tabular">{c.phone}</span>
                </p>
                <p className="text-sm text-muted">
                  {[c.areaText, c.budgetMax ? `tối đa ${formatPriceShort(c.budgetMax)}` : null, c.moveInDate ? `dọn vào ${fmt.date(c.moveInDate)}` : null]
                    .filter(Boolean)
                    .join(", ") || "Chưa ghi nhu cầu"}
                </p>
              </li>
            ))}
            {!consults?.items.length ? <EmptyRow>{consults ? "Không có yêu cầu mới." : "Chưa lấy được yêu cầu tư vấn."}</EmptyRow> : null}
          </ul>
        </Panel>
      </div>
    </>
  );
}
