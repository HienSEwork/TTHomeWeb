// The period is picked as local calendar days (first and last inclusive); the API takes [from, to) instants.
const pad = (n: number) => String(n).padStart(2, "0");

export const toDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function lastDays(n: number, now = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1));
  return { from: toDateString(from), to: toDateString(now) };
}

const localMidnight = (date: string, plusDays = 0) => {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + plusDays);
  return d;
};

export const MAX_DAYS = 366;

export type Period = { from: string; to: string };

// Null when the period is incomplete or the API would refuse it.
export function periodProblem({ from, to }: Period) {
  if (!from || !to) return "Hãy chọn đủ ngày bắt đầu và ngày kết thúc.";
  if (from > to) return "Ngày bắt đầu phải trước ngày kết thúc.";
  const days = Math.round((localMidnight(to, 1).getTime() - localMidnight(from).getTime()) / 86_400_000);
  if (days > MAX_DAYS) return `Khoảng thời gian tối đa là ${MAX_DAYS} ngày.`;
  return null;
}

export const periodQuery = ({ from, to }: Period) =>
  new URLSearchParams({ from: localMidnight(from).toISOString(), to: localMidnight(to, 1).toISOString() }).toString();
