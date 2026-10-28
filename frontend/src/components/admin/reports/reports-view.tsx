"use client";

import { useState } from "react";
import { useAdminQuery } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { Notice } from "@/components/ui";
import { DataTable, PageHeader } from "@/components/admin/parts";
import { ActionButton, DateInput, Figure, FigureStrip, Panel, Segmented } from "@/components/admin/insights/blocks";
import { BarList, DayBars, StackBar } from "@/components/admin/insights/charts";
import { fillDays, formatDate, formatInt, formatPercent, formatVnd, unavailableText } from "@/components/admin/insights/format";
import type { ProjectFigures, ReportOverview } from "@/components/admin/insights/types";
import { downloadExcel } from "./download";
import { lastDays, Period, periodProblem, periodQuery } from "./period";

const PRESETS: [number, string][] = [[7, "7 ngày"], [30, "30 ngày"], [90, "90 ngày"]];

const Sub = ({ children }: { children: React.ReactNode }) => <h3 className="mb-1 mt-4 text-sm text-ink-soft first:mt-0">{children}</h3>;
const Missing = ({ what }: { what: string }) => <p className="py-3 text-sm text-ink-soft">Chưa lấy được số liệu {what}.</p>;
const Pair = ({ label, value }: { label: string; value: string }) => (
  <div className="flex h-8 items-center justify-between text-sm">
    <span className="text-ink-soft">{label}</span>
    <span className="tabular-nums">{value}</span>
  </div>
);

const PROJECT_COLUMNS = [
  { header: "Dự án", render: (p: ProjectFigures) => p.name, className: "font-medium" },
  { header: "Phòng", render: (p: ProjectFigures) => formatInt(p.totalRooms), numeric: true },
  { header: "Trống", render: (p: ProjectFigures) => formatInt(p.vacantCount), numeric: true },
  { header: "Lấp đầy", render: (p: ProjectFigures) => formatPercent(p.occupancy), numeric: true },
  { header: "Giá thấp nhất", render: (p: ProjectFigures) => formatVnd(p.minPrice), numeric: true },
];

export function ReportsView() {
  const [period, setPeriod] = useState<Period>(() => lastDays(30));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>();
  const problem = periodProblem(period);
  const query = problem ? null : periodQuery(period);
  const { data, error, loading, reload } = useAdminQuery<ReportOverview>(query && `reports/overview?${query}`);

  const preset = PRESETS.find(([n]) => JSON.stringify(lastDays(n)) === JSON.stringify(period))?.[0] ?? null;

  const save = async () => {
    if (!query) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      await downloadExcel(query);
    } catch (e) {
      setSaveError(e);
    } finally {
      setSaving(false);
    }
  };

  const t = data?.traffic;
  const days = data && t ? fillDays(t.viewsByDay, data.from, data.to) : [];
  const inv = data?.inventory;

  return (
    <div className="max-w-6xl" aria-busy={loading}>
      <PageHeader title="Báo cáo">
        <ActionButton primary onClick={save} disabled={!query || saving}>
          {saving ? "Đang tạo file…" : "Tải file Excel"}
        </ActionButton>
      </PageHeader>

      <div className="rise mb-6 flex flex-wrap items-end gap-x-5 gap-y-3" style={{ "--i": 1 } as React.CSSProperties}>
        <Segmented
          label="Khoảng nhanh"
          options={PRESETS}
          value={preset}
          onChange={(n) => setPeriod(lastDays(n))}
        />
        <DateInput label="Từ ngày" value={period.from} max={period.to || undefined} onChange={(e) => setPeriod({ ...period, from: e.target.value })} />
        <DateInput label="Đến ngày" value={period.to} min={period.from || undefined} onChange={(e) => setPeriod({ ...period, to: e.target.value })} />
      </div>

      {problem && <Notice>{problem}</Notice>}
      {saveError != null && <Notice>{errorMessage(saveError)}</Notice>}

      {!problem && error ? (
        <div className="flex flex-wrap items-center gap-3">
          <Notice>{errorMessage(error)}</Notice>
          <ActionButton onClick={reload}>Thử lại</ActionButton>
        </div>
      ) : (
        data &&
        t && (
          <div className={`grid gap-6 transition-opacity duration-200 ${loading ? "opacity-60" : ""}`}>
            <p className="rise -mt-2 text-base text-ink-soft" style={{ "--i": 2 } as React.CSSProperties}>
              {t.visitors === 0
                ? "Chưa có khách truy cập trong kỳ này."
                : `${formatInt(t.visitors)} khách truy cập, ${formatInt(t.views)} lượt xem${data.bookingRate == null ? "" : `, tỷ lệ đặt lịch ${formatPercent(data.bookingRate)}`}.`}{" "}
              {data.unavailable.length > 0 && unavailableText(data.unavailable)}
            </p>

            <FigureStrip cols={4} index={3}>
              <Figure label="Khách truy cập" value={formatInt(t.visitors)} />
              <Figure label="Lượt xem trang" value={formatInt(t.views)} />
              <Figure label="Lịch hẹn đã tạo" value={formatInt(data.appointments?.created)} />
              <Figure label="Tỷ lệ đặt lịch" value={formatPercent(data.bookingRate)} note="Lịch hẹn trên khách truy cập" />
            </FigureStrip>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Panel title="Lượt xem theo ngày" index={4} aside={`${formatDate(data.from)} đến ${formatDate(new Date(Date.parse(data.to) - 1).toISOString())}`}>
                <DayBars days={days} label={`Lượt xem theo ngày, tổng ${formatInt(t.views)}`} />
              </Panel>
              <Panel title="Sự kiện trên trang" index={5}>
                <BarList values={t.eventsByName} />
              </Panel>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-2">
              <div className="grid gap-6">
                <Panel title="Lịch hẹn" index={6}>
                  {data.appointments ? (
                    <>
                      <Pair label="Đã tạo trong kỳ" value={formatInt(data.appointments.created)} />
                      <Pair label="Sắp tới, còn mở" value={formatInt(data.appointments.upcomingOpen)} />
                      <Pair label="Chờ xác nhận" value={formatInt(data.appointments.pendingConfirmation)} />
                      <Sub>Theo trạng thái</Sub>
                      <BarList values={data.appointments.createdByStatus} />
                    </>
                  ) : (
                    <Missing what="lịch hẹn" />
                  )}
                </Panel>
                <Panel title="Yêu cầu tư vấn" index={7}>
                  {data.customers ? (
                    <>
                      <Pair label="Mới trong kỳ" value={formatInt(data.customers.newConsultRequests)} />
                      <Sub>Theo trạng thái</Sub>
                      <BarList values={data.customers.consultRequestsByStatus} />
                    </>
                  ) : (
                    <Missing what="yêu cầu tư vấn" />
                  )}
                </Panel>
              </div>
              <Panel title="Khách hàng" index={8}>
                {data.customers ? (
                  <>
                    <Pair label="Khách mới trong kỳ" value={formatInt(data.customers.newCustomers)} />
                    <Sub>Theo nguồn</Sub>
                    <BarList values={data.customers.bySource} />
                    <Sub>Theo giai đoạn</Sub>
                    <BarList values={data.customers.byStage} />
                  </>
                ) : (
                  <Missing what="khách hàng" />
                )}
              </Panel>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <Panel title="Kho phòng" index={9} aside={inv ? `${formatInt(inv.projects)} dự án, ${formatInt(inv.rooms)} phòng` : undefined}>
                {inv ? (
                  <StackBar
                    parts={[
                      { label: "Trống", value: inv.vacant, tone: "bg-gold" },
                      { label: "Đang giữ chỗ", value: inv.reserved, tone: "bg-gold-pale" },
                      { label: "Đã thuê", value: inv.rented, tone: "bg-ink-soft/50" },
                      { label: "Đang ẩn", value: inv.hidden, tone: "bg-line" },
                    ]}
                  />
                ) : (
                  <Missing what="kho phòng" />
                )}
              </Panel>
              <Panel title="Dự án" index={10} aside="Nhiều phòng nhất trước">
                {data.projects ? (
                  <DataTable rows={data.projects} columns={PROJECT_COLUMNS} rowKey={(p) => p.id} empty="Chưa có dự án nào." />
                ) : (
                  <Missing what="dự án" />
                )}
              </Panel>
            </div>
          </div>
        )
      )}
      {!problem && !data && !error && <p className="text-ink-soft">Đang tải…</p>}
    </div>
  );
}
