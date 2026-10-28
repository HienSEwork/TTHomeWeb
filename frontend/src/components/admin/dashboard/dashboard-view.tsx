"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminQuery } from "@/lib/admin-api";
import { errorMessage } from "@/lib/api";
import { Notice } from "@/components/ui";
import { PageHeader } from "@/components/admin/parts";
import { ActionButton, Figure, FigureStrip, Panel, Segmented } from "@/components/admin/insights/blocks";
import { Track } from "@/components/admin/insights/charts";
import { DASH, formatDate, formatInt, formatPercent, unavailableText } from "@/components/admin/insights/format";
import type { DashboardData } from "@/components/admin/insights/types";

const RANGES: [number, string][] = [[7, "7 ngày"], [30, "30 ngày"], [90, "90 ngày"]];

// The screen's one question: what is waiting for someone to act on it?
function finding(d?: DashboardData) {
  if (!d) return "";
  const waiting = [
    d.appointmentsToConfirm ? `${formatInt(d.appointmentsToConfirm)} lịch hẹn chờ xác nhận` : null,
    d.pendingConsignments ? `${formatInt(d.pendingConsignments)} yêu cầu ký gửi chờ duyệt` : null,
  ].filter(Boolean);
  if (waiting.length) return `Đang có ${waiting.join(" và ")}.`;
  if (d.appointmentsToConfirm == null && d.pendingConsignments == null) return "Chưa lấy được số liệu các việc đang chờ.";
  return "Không có việc nào đang chờ xử lý.";
}

function QueueRow({ href, title, hint, count }: { href: string; title: string; hint: string; count: number | null }) {
  return (
    <Link
      href={href}
      className="group -mx-3 flex items-center justify-between gap-4 rounded-lg px-3 py-4 transition duration-150 hover:bg-sunken/60 active:scale-[0.995]"
    >
      <span>
        <span className="block text-base font-medium">{title}</span>
        <span className="block text-sm text-ink-soft">{hint}</span>
      </span>
      <span className="flex items-baseline gap-4">
        <span className={`text-[2.5rem] leading-none tabular-nums ${count == null ? "text-ink-soft/60" : ""}`}>{formatInt(count)}</span>
        <span className="text-sm font-semibold text-gold-deep group-hover:underline">Mở danh sách</span>
      </span>
    </Link>
  );
}

export function DashboardView() {
  const [days, setDays] = useState(7);
  const { data, error, loading, reload } = useAdminQuery<DashboardData>(`dashboard?days=${days}`);
  const vacantRatio = data?.vacantRooms != null && data.totalRooms ? data.vacantRooms / data.totalRooms : null;

  return (
    <div className="max-w-6xl" aria-busy={loading}>
      <PageHeader title="Tổng quan">
        <Segmented label="Khoảng thời gian" options={RANGES} value={days} onChange={setDays} />
      </PageHeader>
      <p className="rise mb-6 min-h-6 text-base text-ink-soft" style={{ "--i": 1 } as React.CSSProperties}>
        {finding(data)}
      </p>

      {error ? (
        <div className="flex flex-wrap items-center gap-3">
          <Notice>{errorMessage(error)}</Notice>
          <ActionButton onClick={reload}>Thử lại</ActionButton>
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Panel title="Việc đang chờ" index={2}>
              <div className="divide-y divide-line">
                <QueueRow href="/admin/appointments" title="Lịch hẹn chờ xác nhận" hint="Xác nhận hoặc dời lịch với khách" count={data?.appointmentsToConfirm ?? null} />
                <QueueRow href="/admin/consignments" title="Ký gửi chờ duyệt" hint="Xem và duyệt phòng chủ nhà gửi lên" count={data?.pendingConsignments ?? null} />
              </div>
            </Panel>
            <Panel
              title="Phòng trống"
              index={3}
              aside={<Link href="/admin/rooms" className="font-semibold text-gold-deep underline-offset-4 hover:underline">Quản lý phòng</Link>}
            >
              <p className="text-[1.75rem] leading-none tabular-nums">
                <span className={data?.vacantRooms == null ? "text-ink-soft/60" : ""}>{formatInt(data?.vacantRooms)}</span>
                {data?.totalRooms != null && <span className="ml-1.5 text-sm text-ink-soft">trên {formatInt(data.totalRooms)} phòng</span>}
              </p>
              <div className="mt-4">
                <Track ratio={vacantRatio ?? 0} from="0" to={data?.totalRooms == null ? DASH : formatInt(data.totalRooms)} />
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                {vacantRatio == null ? "Chưa có số liệu kho phòng." : `${formatPercent(vacantRatio)} số phòng đang trống.`}
              </p>
            </Panel>
          </div>

          <FigureStrip cols={3} index={4}>
            <Figure label="Lịch hẹn sắp tới" value={formatInt(data?.upcomingAppointments)} />
            <Figure label={`Khách mới trong ${days} ngày`} value={formatInt(data?.newCustomers)} />
            <Figure label={`Yêu cầu tư vấn mới trong ${days} ngày`} value={formatInt(data?.newConsultRequests)} />
          </FigureStrip>

          <p className="rise text-sm text-ink-soft" style={{ "--i": 5 } as React.CSSProperties}>
            {data && data.unavailable.length > 0 && <>{unavailableText(data.unavailable)} </>}
            {data && `Số liệu tính từ ${formatDate(data.from)} đến ${formatDate(data.to)}.`}
          </p>
        </div>
      )}
    </div>
  );
}
