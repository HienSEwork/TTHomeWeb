import { ApiError, errorMessage } from "@/lib/api";

const pad = (n: number) => String(n).padStart(2, "0");

export const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatDateTime = (iso?: string | null) => (iso ? `${formatDate(iso)} ${formatTime(iso)}` : "—");

// Backend instants are UTC; the inputs are in the browser's time zone.
export const toInstant = (local: string) => new Date(local).toISOString();
export const toLocalInput = (iso: string) => `${formatDate(iso)}T${formatTime(iso)}`;
export const dayStart = (date: string) => toInstant(`${date}T00:00`);
export const dayEnd = (date: string) => toInstant(`${date}T23:59`);

export const money = (vnd?: number | null) => (vnd == null ? "—" : `${new Intl.NumberFormat("vi-VN").format(vnd)} ₫`);

export const shortId = (id: string) => id.slice(0, 8);

// Builds a query string from the set values only; page 0 is kept.
export function query(params: Record<string, string | number | undefined>) {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") out.set(k, String(v));
  return out.toString();
}

// The shared 409 text says "duplicate"; here a conflict is a state or schedule clash.
export const mutationError = (e: unknown) =>
  e instanceof ApiError && e.code === "CONFLICT"
    ? "Thao tác không thực hiện được ở trạng thái hiện tại, hoặc nhân viên đã có lịch trùng giờ."
    : errorMessage(e);
