import type { Metadata } from "next";
import { Download } from "lucide-react";
import { CUSTOMER_SOURCE } from "@tthome/data";
import { buttonStyles, formatCount, formatPercent } from "@tthome/ui";
import { BarList } from "@/components/bars";
import { PageHeader, Panel, ServiceNotice } from "@/components/page-parts";
import { TrafficPanel } from "@/components/traffic-panel";
import { api, optional } from "@/lib/api";
import { SERIES } from "@/lib/chart";
import { fmt } from "@/lib/format";
import { breakdown, dailySeries, unavailableLabels, vnDay, type ReportOverview } from "@/lib/report";

export const metadata: Metadata = { title: "Báo cáo" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const now = new Date();
  const from = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const to = now.toISOString();
  const r = await optional(api<ReportOverview>("/admin/reports/overview", { query: { from, to } }));
  const occupancy = [...(r?.projects ?? [])]
    .map((p) => ({ label: p.name, value: p.occupancy, hint: `${p.totalRooms - p.vacantCount}/${p.totalRooms}` }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <PageHeader
        title="Báo cáo"
        description={`30 ngày gần nhất, đến hết ngày ${fmt.date(vnDay(now))}.`}
        actions={
          <a href={`/admin/bao-cao/xuat?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`} className={buttonStyles({ variant: "secondary", size: "sm" })}>
            <Download aria-hidden />
            Xuất Excel
          </a>
        }
      />
      <ServiceNotice parts={unavailableLabels([...(r?.unavailable ?? []), ...(r ? [] : ["report"])])} />

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Lượt khách", value: r?.traffic ? formatCount(r.traffic.visitors) : "–", note: "phiên truy cập khác nhau" },
          { label: "Lịch hẹn đã đặt", value: r?.appointments ? formatCount(r.appointments.created) : "–", note: "từ web và hotline" },
          { label: "Tỷ lệ đặt lịch", value: r?.bookingRate == null ? "–" : formatPercent(r.bookingRate), note: "lịch hẹn trên lượt khách" },
          { label: "Yêu cầu tư vấn", value: r?.customers ? formatCount(r.customers.newConsultRequests) : "–", note: "qua form Tư vấn thuê phòng" },
        ].map((k) => (
          <div key={k.label} className="rounded-card border border-line bg-surface p-5">
            <dt className="text-sm font-medium text-ink-soft">{k.label}</dt>
            <dd className="mt-2 text-[1.75rem] leading-none font-extrabold tracking-tight text-ink tabular">{k.value}</dd>
            <dd className="mt-2 text-sm text-muted">{k.note}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <TrafficPanel
          days={r?.traffic ? dailySeries(r.traffic.viewsByDay, now) : null}
          totals={[
            { label: "Lượt xem", value: r?.traffic?.views ?? null },
            { label: "Khách mới", value: r?.customers?.newCustomers ?? null },
          ]}
        />
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
        <Panel title="Khách mới theo nguồn">
          <div className="px-5 py-5">
            {r?.customers ? (
              <BarList items={breakdown(r.customers.bySource, CUSTOMER_SOURCE)} color={SERIES.blue} />
            ) : (
              <p className="text-sm text-muted">Chưa lấy được số liệu khách hàng.</p>
            )}
          </div>
        </Panel>
        <Panel title="Tỷ lệ lấp đầy theo dự án">
          <div className="px-5 py-5">
            {occupancy.length ? (
              <BarList items={occupancy} max={1} unit="percent" color={SERIES.green} />
            ) : (
              <p className="text-sm text-muted">{r?.projects ? "Chưa có dự án nào." : "Chưa lấy được số liệu phòng."}</p>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
