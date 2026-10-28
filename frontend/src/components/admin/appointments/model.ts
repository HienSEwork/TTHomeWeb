export type HistoryEntry = { fromStatus: string; toStatus: string; changedBy: string | null; note: string | null; createdAt: string };

export type Appointment = {
  id: string;
  code: string;
  customerId: string | null;
  userId: string | null;
  projectId: string;
  roomId: string | null;
  mode: string;
  scheduledAt: string;
  durationMin: number;
  status: string;
  staffId: string | null;
  contactName: string | null;
  contactPhone: string | null;
  note: string | null;
  cancelReason: string | null;
  createdAt: string;
  history: HistoryEntry[] | null; // filled by the detail call only
};

type Tone = "neutral" | "ok" | "warn" | "danger";

export const STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Chờ xác nhận", tone: "warn" },
  confirmed: { label: "Đã xác nhận", tone: "ok" },
  rescheduled: { label: "Đã đổi lịch", tone: "neutral" },
  completed: { label: "Đã xem phòng", tone: "neutral" },
  cancelled: { label: "Đã hủy", tone: "danger" },
  no_show: { label: "Không đến", tone: "danger" },
};

export const STATUS_TABS = [
  { value: "", label: "Tất cả" },
  ...Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label })),
];

// Mirrors the allowed moves of the booking service; the server stays the judge.
export const MOVES: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled", "no_show"],
  rescheduled: ["confirmed", "completed", "cancelled", "no_show"],
};

export const MOVE_LABEL: Record<string, string> = {
  confirmed: "Xác nhận lịch",
  completed: "Đã xem phòng",
  cancelled: "Hủy lịch",
  no_show: "Khách không đến",
};

export const isOpen = (status: string) => status in MOVES;

// The service writes these two history notes in English.
export const HISTORY_NOTE: Record<string, string> = {
  "Staff assigned": "Đã phân công nhân viên",
  "Staff removed": "Đã bỏ phân công nhân viên",
};
