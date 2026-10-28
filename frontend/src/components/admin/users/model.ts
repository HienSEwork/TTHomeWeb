import { ApiError, errorMessage } from "@/lib/api";

export type AdminUser = {
  id: string;
  phone: string | null;
  email: string | null;
  fullName: string | null;
  userType: string;
  status: string;
  roles: string[];
  phoneVerified: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  createdAt: string;
};

export type PageOf<T> = { items: T[]; page: number; size: number; total: number };
export type RoleRow = { code: string; name: string; permissions: string[] };
export type PermissionRow = { code: string; description: string };

export const PAGE_SIZE = 20;
// The permissions of this role are fixed on the server.
export const FIXED_ROLE = "ADMIN";

export const ROLE_LABELS: Record<string, string> = {
  TENANT: "Khách thuê",
  LANDLORD: "Chủ nhà",
  AGENT: "Môi giới / CTV",
  CONSULTANT: "Nhân viên tư vấn",
  ADMIN: "Quản trị viên",
};

export const roleLabel = (code: string, fallback = code) => ROLE_LABELS[code] ?? fallback;

export const PERMISSION_LABELS: Record<string, string> = {
  "dashboard.view": "Xem tổng quan",
  "listing.manage": "Quản lý phòng và dự án",
  "consignment.review": "Duyệt ký gửi",
  "booking.manage": "Quản lý lịch hẹn xem phòng",
  "crm.manage": "Quản lý khách và tư vấn",
  "user.manage": "Quản lý người dùng và vai trò",
  "cms.manage": "Quản lý nội dung",
  "catalog.manage": "Quản lý khu vực và tiện nghi",
  "collaborator.manage": "Quản lý cộng tác viên và hoa hồng",
  "report.view": "Xem báo cáo",
  "audit.view": "Xem nhật ký hoạt động",
};

export const STATUSES: Record<string, { label: string; tone: "neutral" | "ok" | "warn" | "danger" }> = {
  ACTIVE: { label: "Hoạt động", tone: "ok" },
  LOCKED: { label: "Đã khóa", tone: "danger" },
  DISABLED: { label: "Vô hiệu hóa", tone: "neutral" },
  PENDING_DELETE: { label: "Chờ xóa", tone: "warn" },
};

export const displayName = (u: AdminUser) => u.fullName || u.email || u.phone || u.id;

export const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

// Local date, ISO order, so rows compare at a glance.
export const formatDate = (iso: string) => new Date(iso).toLocaleString("sv-SE").slice(0, 16);

// The shared mapping words CONFLICT and NOT_FOUND for sign-up; here they mean account state.
export const actionError = (e: unknown) => {
  if (e instanceof ApiError && e.code === "CONFLICT") return "Trạng thái hiện tại của tài khoản không cho phép thao tác này.";
  if (e instanceof ApiError && e.code === "NOT_FOUND") return "Không tìm thấy mục này. Hãy tải lại trang.";
  return errorMessage(e);
};
