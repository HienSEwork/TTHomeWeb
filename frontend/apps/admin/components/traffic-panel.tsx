import { formatCount } from "@tthome/ui";
import { DailyLineChart } from "./charts";

/** Page views per day for the period, with the period's headline totals. Null data means report-service did not answer. */
export function TrafficPanel({
  days,
  totals,
}: {
  days: { day: string; value: number }[] | null;
  totals: { label: string; value: number | null }[];
}) {
  return (
    <section className="min-w-0 rounded-card border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-4">
        <h2 className="text-[0.9375rem] font-bold text-ink">Lượt xem trang, 30 ngày qua</h2>
        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          {totals.map((t) => (
            <div key={t.label} className="flex gap-1.5">
              <dt>{t.label}</dt>
              <dd className="font-bold text-ink tabular">{t.value == null ? "–" : formatCount(t.value)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="px-5 pt-4 pb-4">
        {days ? (
          <DailyLineChart data={days} label="Lượt xem trang" unit="lượt xem" />
        ) : (
          <p className="py-16 text-center text-sm text-muted">Chưa lấy được số liệu truy cập. Tải lại trang sau ít phút.</p>
        )}
      </div>
    </section>
  );
}
