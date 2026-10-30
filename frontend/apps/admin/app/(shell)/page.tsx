import Link from "next/link";
import { CalendarDays, ClipboardCheck, House, Users, type LucideIcon } from "lucide-react";
import {
  APPOINTMENT_STATUS,
  APPOINTMENTS,
  CONSULTS,
  dashboardFigures,
  inventoryFigures,
  staffName,
  SUBMISSIONS,
  SYNC_RUNS,
  SYNC_STATUS,
  TODAY,
  VISIT_MODE,
} from "@tthome/data";
import { Badge, StatusDot, buttonStyles, formatCount, formatPriceShort } from "@tthome/ui";
import { StackedBar } from "@/components/bars";
import { SERIES } from "@/lib/chart";
import { PageHeader, Panel } from "@/components/page-parts";
import { TrafficPanel } from "@/components/traffic-panel";
import { groupByDay } from "@/lib/filters";
import { fmt } from "@/lib/format";

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


export default function DashboardPage() {
  const f = dashboardFigures();
  const inv = inventoryFigures();
  const today = groupByDay(APPOINTMENTS, (a) => a.scheduledAt).find((g) => g.day === TODAY)?.items ?? [];
  const waiting = SUBMISSIONS.filter((s) => s.status === "submitted");
  const newConsults = CONSULTS.filter((c) => c.status === "new");
  const lastSync = SYNC_RUNS[0]!;

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        description="Số liệu hôm nay, thứ Năm 29/10/2026. Phòng và giá đồng bộ từ Meey CRM mỗi 2 phút."
        actions={
          <Link href="/bao-cao" className={buttonStyles({ variant: "secondary", size: "sm" })}>
            Mở báo cáo
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={House} label="Phòng trống" value={formatCount(f.vacantRooms)} detail={`trên ${f.totalRooms} phòng đang quản lý`} href="/phong" />
        <Kpi
          icon={CalendarDays}
          label="Lịch hẹn sắp tới"
          value={formatCount(f.upcomingAppointments)}
          detail={
            <>
              <span className="font-semibold text-warn">{f.appointmentsToConfirm} lịch</span> chờ xác nhận
            </>
          }
          href="/lich-hen"
        />
        <Kpi icon={Users} label="Khách mới trong tuần" value={formatCount(f.newCustomers)} detail={`${f.newConsultRequests} yêu cầu tư vấn chưa gọi`} href="/khach-hang" />
        <Kpi icon={ClipboardCheck} label="Ký gửi chờ duyệt" value={formatCount(f.pendingConsignments)} detail="Cần phản hồi chủ nhà trong 24 giờ" href="/ky-gui" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <TrafficPanel />
        <Panel title="Tình trạng phòng">
          <div className="px-5 py-5">
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
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title={`Lịch hẹn hôm nay (${today.length})`}
          action={
            <Link href="/lich-hen" className="text-sm font-semibold text-shutter hover:underline">
              Tất cả lịch hẹn
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {today.map((a) => {
              const s = APPOINTMENT_STATUS[a.status];
              return (
                <li key={a.code} className="flex gap-4 px-5 py-3">
                  <p className="w-12 shrink-0 pt-0.5 font-bold text-ink tabular">{fmt.time(a.scheduledAt)}</p>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{a.customer}</p>
                    <p className="truncate text-sm text-muted">
                      {a.roomName}, {a.projectName}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {VISIT_MODE[a.mode]}, {staffName(a.staffId) ?? <span className="font-semibold text-warn">chưa phân công</span>}
                    </p>
                  </div>
                  <Badge tone={s.tone} className="self-start">
                    {s.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel
            title="Ký gửi chờ duyệt"
            action={
              <Link href="/ky-gui" className="text-sm font-semibold text-shutter hover:underline">
                Duyệt
              </Link>
            }
          >
            <ul className="divide-y divide-line">
              {waiting.map((s) => (
                <li key={s.code} className="px-5 py-3">
                  <p className="font-semibold text-ink">{s.address}</p>
                  <p className="text-sm text-muted">
                    {s.district}, {s.roomCount} phòng từ {formatPriceShort(s.priceFrom)}, {s.photos} ảnh
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {s.landlord}, gửi lúc {fmt.dateTime(s.submittedAt)}
                  </p>
                </li>
              ))}
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
              {newConsults.map((c) => (
                <li key={c.id} className="px-5 py-3">
                  <p className="font-semibold text-ink">
                    {c.name} <span className="font-normal text-muted tabular">{c.phone}</span>
                  </p>
                  <p className="text-sm text-muted">
                    {c.area}, {c.budget}, dọn vào {c.moveIn.toLowerCase()}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel
          title="Đồng bộ Meey CRM"
          action={
            <Link href="/dong-bo" className="text-sm font-semibold text-shutter hover:underline">
              Chi tiết
            </Link>
          }
        >
          <div className="px-5 py-4">
            <StatusDot tone={SYNC_STATUS[lastSync.status].tone}>
              Lần gần nhất {fmt.dateTime(lastSync.startedAt)}: {SYNC_STATUS[lastSync.status].label.toLowerCase()}
            </StatusDot>
            <p className="mt-1 pl-4 text-sm text-muted">Độ trễ dữ liệu khoảng 1 phút, dưới mức 5 phút cam kết.</p>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            {SYNC_RUNS.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
                <span className="text-ink-soft tabular">{fmt.dateTime(r.startedAt)}</span>
                <span className="text-muted tabular">{formatCount(r.records)} bản ghi</span>
                <Badge tone={SYNC_STATUS[r.status].tone}>{r.errors ? `${r.errors} lỗi` : SYNC_STATUS[r.status].label}</Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
