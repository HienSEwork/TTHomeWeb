import type { Metadata } from "next";
import { CUSTOMER_SOURCE, PROJECTS, SOURCE_BREAKDOWN, TRAFFIC } from "@tthome/data";
import { formatCount, formatPercent } from "@tthome/ui";
import { BarList } from "@/components/bars";
import { PageHeader, Panel } from "@/components/page-parts";
import { TrafficPanel } from "@/components/traffic-panel";
import { SERIES } from "@/lib/chart";
import { ExportButton } from "./export-button";

export const metadata: Metadata = { title: "Báo cáo" };

export default function ReportsPage() {
  const visitors = TRAFFIC.reduce((n, d) => n + d.visitors, 0);
  const bookings = TRAFFIC.reduce((n, d) => n + d.bookings, 0);
  const consults = TRAFFIC.reduce((n, d) => n + d.consults, 0);
  const occupancy = PROJECTS.map((p) => {
    const taken = p.rooms.filter((r) => r.status === "rented" || r.status === "reserved").length;
    return { label: p.name, value: taken / p.rooms.length, hint: `${taken}/${p.rooms.length}` };
  }).sort((a, b) => b.value - a.value);

  const rows: (string | number)[][] = [
    ["Ngày", "Lượt khách", "Lượt xem", "Lịch hẹn", "Yêu cầu tư vấn"],
    ...TRAFFIC.map((d) => [d.day, d.visitors, d.views, d.bookings, d.consults]),
  ];

  return (
    <>
      <PageHeader title="Báo cáo" description="30 ngày gần nhất, đến hết ngày 29/10/2026." actions={<ExportButton rows={rows} filename="tthome-bao-cao-30-ngay.csv" />} />

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Lượt khách", value: formatCount(visitors), note: "người truy cập khác nhau mỗi ngày" },
          { label: "Lịch hẹn đã đặt", value: formatCount(bookings), note: "từ web và hotline" },
          { label: "Tỷ lệ đặt lịch", value: formatPercent(bookings / visitors), note: "lịch hẹn trên lượt khách" },
          { label: "Yêu cầu tư vấn", value: formatCount(consults), note: "qua form Tư vấn thuê phòng" },
        ].map((k) => (
          <div key={k.label} className="rounded-card border border-line bg-surface p-5">
            <dt className="text-sm font-medium text-ink-soft">{k.label}</dt>
            <dd className="mt-2 text-[1.75rem] leading-none font-extrabold tracking-tight text-ink tabular">{k.value}</dd>
            <dd className="mt-2 text-sm text-muted">{k.note}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <TrafficPanel />
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
        <Panel title="Khách mới theo nguồn">
          <div className="px-5 py-5">
            <BarList items={SOURCE_BREAKDOWN.map((s) => ({ label: CUSTOMER_SOURCE[s.source], value: s.customers }))} color={SERIES.gold} />
          </div>
        </Panel>
        <Panel title="Tỷ lệ lấp đầy theo dự án">
          <div className="px-5 py-5">
            <BarList items={occupancy} max={1} unit="percent" color={SERIES.sage} />
          </div>
        </Panel>
      </div>
    </>
  );
}
