export const DASH = "—";

const number = new Intl.NumberFormat("vi-VN");
const percent = new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatInt = (n: number | null | undefined) => (n == null ? DASH : number.format(n));
// A ratio (0.125) as a percentage with one decimal.
export const formatPercent = (ratio: number | null | undefined) => (ratio == null ? DASH : `${percent.format(ratio * 100)}%`);
export const formatVnd = (n: number | null | undefined) => (n == null ? DASH : `${number.format(n)} ₫`);

const pad = (n: number) => String(n).padStart(2, "0");

// ISO date, the form that stays comparable down a column.
export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// The backend stores these as free text; known values get a Vietnamese label, others show as stored.
const LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  rescheduled: "Đã dời lịch",
  done: "Đã xem phòng",
  completed: "Đã hoàn tất",
  no_show: "Khách vắng mặt",
  cancelled: "Đã hủy",
  new: "Mới",
  contacted: "Đã liên hệ",
  lost: "Đã mất",
  web: "Website",
  view: "Lượt xem",
};
export const labelOf = (key: string) => LABELS[key] ?? key;

const SERVICE_NAMES: Record<string, string> = {
  listing: "kho phòng",
  booking: "lịch hẹn",
  crm: "khách hàng",
  consignment: "ký gửi",
};
export const unavailableText = (names: string[]) => `Chưa lấy được số liệu: ${names.map((n) => SERVICE_NAMES[n] ?? n).join(", ")}.`;

// Smallest 1/2/5 x 10^k step for which four steps pass the maximum; zero keeps a 0-4 scale.
export function niceStep(max: number) {
  if (max <= 0) return 1;
  for (let exp = 0; ; exp++) {
    for (const m of [1, 2, 5]) {
      const step = m * 10 ** exp;
      if (step * 4 > max) return step;
    }
  }
}

const DAY = 86_400_000;
const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// The backend leaves days without views out; the chart shows them as zero. `to` is exclusive.
export function fillDays(rows: { day: string; count: number }[], fromIso: string, toIso: string) {
  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const start = Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${dayKey(Date.parse(toIso) - 1)}T00:00:00Z`);
  const out: { day: string; count: number }[] = [];
  for (let t = start; t <= end && out.length < 400; t += DAY) out.push({ day: dayKey(t), count: byDay.get(dayKey(t)) ?? 0 });
  return out;
}
