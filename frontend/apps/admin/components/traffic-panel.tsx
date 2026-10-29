"use client";

import { useState } from "react";
import { TRAFFIC } from "@tthome/data";
import { formatCount } from "@tthome/ui";
import { DailyLineChart } from "./charts";
import { Tabs } from "./interactive";

const METRICS = [
  { value: "visitors", label: "Lượt khách", unit: "lượt khách" },
  { value: "views", label: "Lượt xem trang", unit: "lượt xem" },
  { value: "bookings", label: "Lịch hẹn", unit: "lịch hẹn" },
  { value: "consults", label: "Yêu cầu tư vấn", unit: "yêu cầu" },
] as const;

type Metric = (typeof METRICS)[number]["value"];

export function TrafficPanel() {
  const [metric, setMetric] = useState<Metric>("visitors");
  const meta = METRICS.find((m) => m.value === metric)!;
  const total = TRAFFIC.reduce((sum, d) => sum + d[metric], 0);
  return (
    <section className="min-w-0 rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-4">
        <h2 className="text-[0.9375rem] font-bold text-ink">30 ngày qua</h2>
        <p className="text-sm text-muted">
          Tổng <span className="font-bold text-ink tabular">{formatCount(total)}</span> {meta.unit}
        </p>
      </div>
      <div className="px-4">
        <Tabs label="Chỉ số" tabs={METRICS.map((m) => ({ value: m.value, label: m.label }))} value={metric} onChange={setMetric} />
      </div>
      <div className="px-5 pt-4 pb-4">
        <DailyLineChart data={TRAFFIC.map((d) => ({ day: d.day, value: d[metric] }))} label={meta.label} unit={meta.unit} />
      </div>
    </section>
  );
}
