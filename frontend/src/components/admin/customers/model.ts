import type { Option } from "@/components/admin/operations/types";

export type Customer = {
  id: string;
  userId: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  zalo: string | null;
  source: string;
  stage: string;
  lostReason: string | null;
  ownerUserId: string | null;
  referrerUserId: string | null;
  priority: number;
  lastContactAt: string | null;
  nextFollowupAt: string | null;
  createdAt: string;
};

export type Interaction = { id: string; kind: string; direction: string | null; summary: string; actorId: string | null; createdAt: string };
export type CustomerNote = { id: string; authorId: string; body: string; privateNote: boolean; createdAt: string };

export type ConsultRequest = {
  id: string;
  customerId: string | null;
  fullName: string;
  phone: string;
  areaText: string | null;
  budgetMax: number | null;
  moveInDate: string | null;
  message: string | null;
  channel: string | null;
  status: string;
  assignedTo: string | null;
  createdAt: string;
};

type Tone = "neutral" | "ok" | "warn" | "danger";

export const STAGES: Record<string, { label: string; tone: Tone }> = {
  new: { label: "Mới", tone: "warn" },
  contacted: { label: "Đã liên hệ", tone: "neutral" },
  viewing: { label: "Đang xem phòng", tone: "neutral" },
  deposited: { label: "Đã đặt cọc", tone: "ok" },
  rented: { label: "Đã thuê", tone: "ok" },
  lost: { label: "Mất khách", tone: "danger" },
};

export const SOURCES: Record<string, string> = {
  web: "Website",
  zalo: "Zalo",
  facebook: "Facebook",
  tiktok: "TikTok",
  ctv: "Cộng tác viên",
  meey: "Meey",
  hotline: "Hotline",
  walk_in: "Khách tự đến",
  other: "Khác",
};

export const KINDS: Record<string, string> = {
  call: "Cuộc gọi",
  meeting: "Gặp trực tiếp",
  zalo: "Zalo",
  sms: "SMS",
  email: "Email",
  chat: "Chat",
  stage_change: "Đổi giai đoạn",
  system: "Hệ thống",
};

// Kinds a person can log by hand; the others are written by the service.
export const MANUAL_KINDS = ["call", "meeting", "zalo", "sms", "email", "chat"];

export const DIRECTIONS: Record<string, string> = { in: "Khách liên hệ", out: "Nhân viên liên hệ" };

export const CONSULT_STATUS: Record<string, { label: string; tone: Tone }> = {
  new: { label: "Mới", tone: "warn" },
  assigned: { label: "Đã giao", tone: "neutral" },
  contacted: { label: "Đã liên hệ", tone: "neutral" },
  done: { label: "Hoàn tất", tone: "ok" },
  spam: { label: "Spam", tone: "danger" },
};

// Mirrors the CRM service; the server stays the judge.
export const CONSULT_MOVES: Record<string, string[]> = {
  new: ["spam"],
  assigned: ["contacted", "done", "spam"],
  contacted: ["done", "spam"],
};

export const CONSULT_MOVE_LABEL: Record<string, string> = { contacted: "Đã liên hệ", done: "Hoàn tất", spam: "Đánh dấu spam" };

export const toOptions = (labels: Record<string, string | { label: string }>): Option[] =>
  Object.entries(labels).map(([value, l]) => ({ value, label: typeof l === "string" ? l : l.label }));

// The service writes "new -> contacted: reason" with raw stage codes.
export const stageChangeText = (summary: string) =>
  summary.replace(/^(\w+) -> (\w+)/, (_, from: string, to: string) => `${STAGES[from]?.label ?? from} → ${STAGES[to]?.label ?? to}`);
