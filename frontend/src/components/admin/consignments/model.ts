// Shapes mirror SubmissionResponse, ReviewLogResponse, ReviewRequest and PageResponse in consignment-service.
export type ReviewLogEntry = {
  fromStatus: string | null;
  toStatus: string;
  reviewerId: string | null;
  note: string | null;
  createdAt: string;
};

export type Submission = {
  id: string;
  code: string;
  landlordId: string | null;
  landlordName: string;
  landlordPhone: string;
  projectName: string | null;
  addressText: string;
  wardId: number | null;
  roomCount: number | null;
  roomsJson: string | null;
  expectedPriceMin: number | null;
  expectedPriceMax: number | null;
  note: string | null;
  status: string;
  reviewerId: string | null;
  rejectReason: string | null;
  createdAt: string;
  reviewLog: ReviewLogEntry[] | null;
};

export type SubmissionPage = { items: Submission[]; page: number; size: number; total: number };

export type Decision = "approve" | "reject" | "need_info";

export const PAGE_SIZE = 20;

type Tone = "neutral" | "ok" | "warn" | "danger";

// Status values come from the check constraint on consignment.submission.
export const STATUS: Record<string, { label: string; tone: Tone }> = {
  submitted: { label: "Chờ duyệt", tone: "warn" },
  need_info: { label: "Cần bổ sung", tone: "neutral" },
  approved: { label: "Đã duyệt", tone: "ok" },
  rejected: { label: "Từ chối", tone: "danger" },
  published: { label: "Đã đăng", tone: "ok" },
  withdrawn: { label: "Chủ nhà đã rút", tone: "neutral" },
};

export const FILTERS: { value: string; label: string }[] = [
  { value: "submitted", label: STATUS.submitted.label },
  { value: "need_info", label: STATUS.need_info.label },
  { value: "approved", label: STATUS.approved.label },
  { value: "rejected", label: STATUS.rejected.label },
  { value: "published", label: STATUS.published.label },
  { value: "withdrawn", label: STATUS.withdrawn.label },
  { value: "", label: "Tất cả" },
];

// The service only accepts a decision while the submission is in one of these.
export const isOpenForReview = (status: string) => status === "submitted" || status === "need_info";

export const statusLabel = (status: string) => STATUS[status]?.label ?? status;

const money = new Intl.NumberFormat("vi-VN");

// A missing bound prints as a dash; one bound alone prints on its own.
export function priceRange(min: number | null, max: number | null) {
  if (min === null && max === null) return "—";
  if (min === null || max === null || min === max) return `${money.format((min ?? max) as number)} đ`;
  return `${money.format(min)} – ${money.format(max)} đ`;
}

export const formatDate = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");
export const formatDateTime = (iso: string) => new Date(iso).toLocaleString("vi-VN");

export function listPath(status: string, q: string, page: number) {
  const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  return `consignment/submissions?${params}`;
}

// The landlord's own JSON; only keys the schema documents get a Vietnamese label.
const ROOM_KEYS: Record<string, string> = { type: "Loại", area: "Diện tích", price: "Giá", floor: "Tầng" };

export function parseRooms(json: string | null): Record<string, string>[] | null {
  if (!json) return [];
  try {
    const value: unknown = JSON.parse(json);
    if (!Array.isArray(value)) return null;
    return value.map((room) =>
      Object.fromEntries(
        Object.entries((room ?? {}) as Record<string, unknown>).map(([k, v]) => [ROOM_KEYS[k] ?? k, String(v)]),
      ),
    );
  } catch {
    return null;
  }
}
