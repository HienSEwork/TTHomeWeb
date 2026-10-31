import { TODAY } from "./catalog";
import { PROJECTS } from "./listings";
import type { RoomStatus } from "./types";

type Tone = "neutral" | "shutter" | "plate" | "wall" | "danger" | "warn" | "ink" | "success";
type Meta = { label: string; tone: Tone };

export type AppointmentStatus = "pending" | "confirmed" | "rescheduled" | "completed" | "cancelled" | "no_show";
export type VisitMode = "in_person" | "online";
export type SubmissionStatus = "submitted" | "need_info" | "approved" | "rejected" | "published" | "withdrawn";
export type CustomerStage = "new" | "contacted" | "viewing" | "deposited" | "rented" | "lost";
export type CustomerSource = "web" | "zalo" | "facebook" | "tiktok" | "ctv" | "meey" | "hotline" | "walk_in" | "other";
export type ConsultStatus = "new" | "assigned" | "contacted" | "done" | "spam";
export type UserType = "tenant" | "landlord" | "agent" | "consultant" | "admin";
export type UserStatus = "active" | "locked" | "disabled" | "pending_delete";
export type ApplicationStatus = "new" | "contacted" | "approved" | "rejected";
export type SyncStatus = "running" | "ok" | "partial" | "failed";

export const ROOM_STATUS: Record<RoomStatus, Meta> = {
  available: { label: "Còn trống", tone: "success" },
  reserved: { label: "Đang giữ chỗ", tone: "wall" },
  rented: { label: "Đã thuê", tone: "neutral" },
  hidden: { label: "Đang ẩn", tone: "danger" },
};

export const APPOINTMENT_STATUS: Record<AppointmentStatus, Meta> = {
  pending: { label: "Chờ xác nhận", tone: "wall" },
  confirmed: { label: "Đã xác nhận", tone: "plate" },
  rescheduled: { label: "Đã đổi lịch", tone: "warn" },
  completed: { label: "Đã xem", tone: "shutter" },
  cancelled: { label: "Đã hủy", tone: "neutral" },
  no_show: { label: "Khách không đến", tone: "danger" },
};

export const VISIT_MODE: Record<VisitMode, string> = { in_person: "Xem trực tiếp", online: "Xem online" };

export const SUBMISSION_STATUS: Record<SubmissionStatus, Meta> = {
  submitted: { label: "Chờ duyệt", tone: "wall" },
  need_info: { label: "Cần bổ sung", tone: "warn" },
  approved: { label: "Đã duyệt", tone: "plate" },
  rejected: { label: "Từ chối", tone: "danger" },
  published: { label: "Đã đăng", tone: "shutter" },
  withdrawn: { label: "Chủ nhà rút", tone: "neutral" },
};

export const CUSTOMER_STAGE: Record<CustomerStage, Meta> = {
  new: { label: "Mới", tone: "wall" },
  contacted: { label: "Đã liên hệ", tone: "plate" },
  viewing: { label: "Đang xem phòng", tone: "plate" },
  deposited: { label: "Đã cọc", tone: "shutter" },
  rented: { label: "Đã thuê", tone: "shutter" },
  lost: { label: "Không thành", tone: "neutral" },
};

export const CUSTOMER_SOURCE: Record<CustomerSource, string> = {
  web: "Website", zalo: "Zalo", facebook: "Facebook", tiktok: "TikTok", ctv: "Cộng tác viên",
  meey: "Meey CRM", hotline: "Hotline", walk_in: "Đến văn phòng", other: "Khác",
};

export const CONSULT_STATUS: Record<ConsultStatus, Meta> = {
  new: { label: "Mới", tone: "wall" },
  assigned: { label: "Đã phân công", tone: "plate" },
  contacted: { label: "Đã gọi", tone: "plate" },
  done: { label: "Xong", tone: "shutter" },
  spam: { label: "Rác", tone: "neutral" },
};

export const USER_TYPE: Record<UserType, string> = {
  tenant: "Người thuê", landlord: "Chủ nhà", agent: "Cộng tác viên", consultant: "Nhân viên tư vấn", admin: "Quản trị viên",
};

export const USER_STATUS: Record<UserStatus, Meta> = {
  active: { label: "Hoạt động", tone: "shutter" },
  locked: { label: "Đang khóa", tone: "danger" },
  disabled: { label: "Vô hiệu", tone: "neutral" },
  pending_delete: { label: "Chờ xóa", tone: "warn" },
};

export const APPLICATION_STATUS: Record<ApplicationStatus, Meta> = {
  new: { label: "Mới", tone: "wall" },
  contacted: { label: "Đã liên hệ", tone: "plate" },
  approved: { label: "Đã nhận", tone: "shutter" },
  rejected: { label: "Từ chối", tone: "neutral" },
};

export const SYNC_STATUS: Record<SyncStatus, Meta> = {
  running: { label: "Đang chạy", tone: "plate" },
  ok: { label: "Thành công", tone: "shutter" },
  partial: { label: "Có lỗi một phần", tone: "warn" },
  failed: { label: "Thất bại", tone: "danger" },
};

export type Staff = { id: string; name: string; team: string; phone: string };

export const STAFF: Staff[] = [
  { id: "s1", name: "Trần Minh Khoa", team: "Tân An, An Cư, Cái Khế", phone: "0903 112 451" },
  { id: "s2", name: "Lê Ngọc Hân", team: "Xuân Khánh, Hưng Lợi", phone: "0938 220 174" },
  { id: "s3", name: "Phạm Gia Huy", team: "Bình Thủy, Ô Môn", phone: "0909 441 238" },
  { id: "s4", name: "Võ Thu Trang", team: "Cái Răng, Phong Điền", phone: "0918 760 093" },
  { id: "s5", name: "Nguyễn Đức Anh", team: "An Khánh, An Hòa", phone: "0977 301 822" },
];

const NAMES = [
  "Nguyễn Thảo Vy", "Trần Quốc Bảo", "Lê Hoàng Nam", "Phạm Khánh Linh", "Đỗ Minh Thư", "Huỳnh Gia Bảo",
  "Võ Thanh Tâm", "Bùi Ngọc Ánh", "Đặng Tuấn Kiệt", "Hồ Mỹ Duyên", "Ngô Phương Anh", "Dương Hải Đăng",
  "Lý Bảo Ngọc", "Trương Hữu Phúc", "Mai Anh Thư", "Châu Gia Hân", "Tạ Quang Vinh", "Lâm Tường Vi",
];

function phone(i: number): string {
  const prefixes = ["090", "093", "097", "086", "091", "070"];
  const n = String(1_000_000 + ((i * 7_919_311) % 9_000_000)).slice(-7);
  return `${prefixes[i % prefixes.length]}${n.slice(0, 1)} ${n.slice(1, 4)} ${n.slice(4)}`;
}

/** A moment `dayOffset` days from TODAY at hour:minute Vietnam time, as an ISO string in UTC. */
function at(dayOffset: number, hour: number, minute = 0): string {
  const day = new Date(Date.parse(`${TODAY}T00:00:00Z`) + dayOffset * 86_400_000).toISOString().slice(0, 10);
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return new Date(`${day}T${hh}:${mm}:00+07:00`).toISOString();
}

const roomRefs = PROJECTS.flatMap((p) => p.rooms.filter((r) => r.status !== "hidden").map((r) => ({ project: p, room: r })));

export type Appointment = {
  code: string;
  customer: string;
  phone: string;
  projectName: string;
  projectCode: string;
  roomCode: string;
  roomName: string;
  scheduledAt: string;
  mode: VisitMode;
  status: AppointmentStatus;
  staffId: string | null;
  note: string;
  createdAt: string;
};

const APPOINTMENT_PLAN: [number, number, AppointmentStatus, VisitMode][] = [
  [0, 9, "confirmed", "in_person"], [0, 10, "pending", "in_person"], [0, 14, "confirmed", "online"], [0, 16, "pending", "in_person"],
  [0, 18, "rescheduled", "in_person"], [1, 9, "pending", "in_person"], [1, 11, "confirmed", "in_person"], [1, 15, "pending", "online"],
  [1, 17, "confirmed", "in_person"], [2, 10, "pending", "in_person"], [2, 19, "confirmed", "in_person"], [3, 9, "pending", "online"],
  [-1, 10, "completed", "in_person"], [-1, 14, "no_show", "in_person"], [-1, 17, "completed", "online"], [-2, 9, "cancelled", "in_person"],
  [-2, 15, "completed", "in_person"], [-3, 11, "completed", "in_person"],
];

export const APPOINTMENTS: Appointment[] = APPOINTMENT_PLAN.map(([day, hour, status, mode], i) => {
  const ref = roomRefs[(i * 5) % roomRefs.length]!;
  return {
    code: `LH${String(2400 + i).padStart(5, "0")}`,
    customer: NAMES[i % NAMES.length]!,
    phone: phone(i),
    projectName: ref.project.name,
    projectCode: ref.project.code,
    roomCode: ref.room.code,
    roomName: ref.room.name,
    scheduledAt: at(day, hour, i % 2 ? 30 : 0),
    mode,
    status,
    staffId: status === "pending" && i % 3 === 0 ? null : STAFF[i % STAFF.length]!.id,
    note: i % 4 === 0 ? "Khách đi cùng bạn, muốn xem thêm phòng tầng cao." : i % 5 === 0 ? "Hỏi về hợp đồng 6 tháng." : "",
    createdAt: at(day - 2, 10 + (i % 8)),
  };
});

export type Interaction = { at: string; kind: "call" | "zalo" | "meeting" | "note" | "stage_change"; by: string; text: string };

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: CustomerSource;
  stage: CustomerStage;
  budgetMax: number;
  wantedArea: string;
  moveIn: string;
  staffId: string | null;
  lastContactAt: string;
  createdAt: string;
  interactions: Interaction[];
};

const SOURCES: CustomerSource[] = ["web", "web", "zalo", "facebook", "hotline", "ctv", "web", "tiktok", "meey"];
const STAGES: CustomerStage[] = ["new", "contacted", "viewing", "viewing", "deposited", "rented", "lost", "new", "contacted"];
const AREAS = ["Phường Ninh Kiều, gần ĐH Cần Thơ", "Phường Bến Thành, TP.HCM", "Phường Cái Răng", "Phường Gia Định, gần Văn Lang", "Phường Tân An, gần Y Dược", "Phường Đông Hòa, Làng Đại học", "Phường Cái Khế", "Phường Gò Vấp, TP.HCM"];

export const CUSTOMERS: Customer[] = NAMES.map((name, i) => ({
  id: `kh-${1000 + i}`,
  name,
  phone: phone(i + 40),
  email: i % 3 === 0 ? null : `${name.split(" ").pop()!.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")}${i}@gmail.com`,
  source: SOURCES[i % SOURCES.length]!,
  stage: STAGES[i % STAGES.length]!,
  budgetMax: [4_000_000, 5_000_000, 6_500_000, 3_500_000, 8_000_000, 5_500_000][i % 6]!,
  wantedArea: AREAS[i % AREAS.length]!,
  moveIn: at(5 + (i % 20), 9).slice(0, 10),
  staffId: i % 6 === 5 ? null : STAFF[i % STAFF.length]!.id,
  lastContactAt: at(-(i % 6), 9 + (i % 9)),
  createdAt: at(-(i * 2 + 1), 10),
  interactions: [
    { at: at(-(i % 6), 9 + (i % 9)), kind: "call", by: STAFF[i % STAFF.length]!.name, text: "Gọi tư vấn, khách muốn phòng có cửa sổ và máy giặt riêng." },
    { at: at(-(i % 6) - 1, 15), kind: "zalo", by: STAFF[i % STAFF.length]!.name, text: "Gửi 3 phòng phù hợp qua Zalo." },
    { at: at(-(i * 2 + 1), 10), kind: "stage_change", by: "Hệ thống", text: "Tạo khách từ form đặt lịch trên website." },
  ],
}));

export type ConsultRequest = {
  id: string;
  name: string;
  phone: string;
  area: string;
  budget: string;
  moveIn: string;
  note: string;
  status: ConsultStatus;
  staffId: string | null;
  createdAt: string;
};

export const CONSULTS: ConsultRequest[] = [
  { id: "tv1", name: "Phan Bảo Trâm", phone: phone(71), area: "Xuân Khánh", budget: "3 – 4 triệu", moveIn: "Đầu tháng 11", note: "Cần phòng cho 2 người, có ban công.", status: "new", staffId: null, createdAt: at(0, 8, 42) },
  { id: "tv2", name: "Kiều Văn Thịnh", phone: phone(72), area: "Cái Răng", budget: "Dưới 2,5 triệu", moveIn: "Ngay", note: "", status: "new", staffId: null, createdAt: at(0, 7, 15) },
  { id: "tv3", name: "Ông Thị Mai", phone: phone(73), area: "Hưng Lợi", budget: "2 – 2,5 triệu", moveIn: "15/11", note: "Sinh viên năm nhất Đại học Cần Thơ.", status: "assigned", staffId: "s4", createdAt: at(-1, 20, 5) },
  { id: "tv4", name: "Lưu Đức Mạnh", phone: phone(74), area: "Tân An", budget: "4,5 – 6 triệu", moveIn: "Tháng 12", note: "Làm việc gần Bến Ninh Kiều, muốn đi bộ được.", status: "contacted", staffId: "s1", createdAt: at(-1, 14, 30) },
  { id: "tv5", name: "Hà My", phone: phone(75), area: "An Cư", budget: "3,5 triệu", moveIn: "Đầu tháng 11", note: "Có nuôi một con mèo.", status: "done", staffId: "s1", createdAt: at(-2, 9, 10) },
  { id: "tv6", name: "test test", phone: "0000 000 000", area: "", budget: "", moveIn: "", note: "asdf", status: "spam", staffId: null, createdAt: at(-2, 3, 2) },
];

export type Submission = {
  code: string;
  landlord: string;
  phone: string;
  address: string;
  /** The city, on the post-2025 map; the ward is part of the address. */
  district: string;
  roomCount: number;
  priceFrom: number;
  roomTypes: string;
  photos: number;
  status: SubmissionStatus;
  submittedAt: string;
  note: string;
  log: { at: string; by: string; text: string }[];
};

export const SUBMISSIONS: Submission[] = [
  {
    code: "KG01284", landlord: "Nguyễn Văn Phước", phone: phone(81), address: "62/4 Nguyễn Trãi, Phường Ninh Kiều", district: "TP. Cần Thơ",
    roomCount: 6, priceFrom: 6_500_000, roomTypes: "Studio, 1 phòng ngủ", photos: 14, status: "submitted", submittedAt: at(0, 9, 12),
    note: "Tòa mới xây xong, có thang máy.", log: [{ at: at(0, 9, 12), by: "Chủ nhà", text: "Gửi ký gửi qua website." }],
  },
  {
    code: "KG01283", landlord: "Trần Thị Bích", phone: phone(82), address: "15 Đường số 3, KDC Hồng Loan, Phường Cái Răng", district: "TP. Cần Thơ",
    roomCount: 4, priceFrom: 4_200_000, roomTypes: "Phòng trọ", photos: 6, status: "submitted", submittedAt: at(-1, 16, 40),
    note: "", log: [{ at: at(-1, 16, 40), by: "Chủ nhà", text: "Gửi ký gửi qua website." }],
  },
  {
    code: "KG01281", landlord: "Lê Quang Vinh", phone: phone(83), address: "88 Lê Hồng Phong, Phường Bình Thủy", district: "TP. Cần Thơ",
    roomCount: 10, priceFrom: 3_600_000, roomTypes: "Studio, phòng trọ", photos: 3, status: "need_info", submittedAt: at(-2, 11, 5),
    note: "Thiếu ảnh WC và giấy phép PCCC.",
    log: [
      { at: at(-2, 11, 5), by: "Chủ nhà", text: "Gửi ký gửi qua website." },
      { at: at(-1, 10, 20), by: "Lê Ngọc Hân", text: "Yêu cầu bổ sung ảnh WC và giấy chứng nhận PCCC." },
    ],
  },
  {
    code: "KG01277", landlord: "Đỗ Thanh Hải", phone: phone(84), address: "21/4 Cộng Hòa, Phường Tân Sơn Nhất", district: "TP. Hồ Chí Minh",
    roomCount: 12, priceFrom: 2_300_000, roomTypes: "Ký túc xá", photos: 18, status: "approved", submittedAt: at(-4, 13, 0),
    note: "Hẹn chụp ảnh 31/10.", log: [{ at: at(-3, 9, 0), by: "Võ Thu Trang", text: "Duyệt, hẹn đội chụp ảnh." }],
  },
  {
    code: "KG01270", landlord: "Phạm Hồng Nhung", phone: phone(85), address: "5 Lý Tự Trọng, Phường Ninh Kiều", district: "TP. Cần Thơ",
    roomCount: 5, priceFrom: 5_800_000, roomTypes: "Studio", photos: 22, status: "published", submittedAt: at(-9, 10, 0),
    note: "", log: [{ at: at(-6, 15, 0), by: "Trần Minh Khoa", text: "Đã đăng 5 phòng." }],
  },
  {
    code: "KG01266", landlord: "Vũ Minh Tuấn", phone: phone(86), address: "Hẻm 120 Phan Đăng Lưu, Phường Gia Định", district: "TP. Hồ Chí Minh",
    roomCount: 3, priceFrom: 2_000_000, roomTypes: "Phòng trọ", photos: 2, status: "rejected", submittedAt: at(-11, 8, 0),
    note: "Phòng không có cửa sổ, không đạt tiêu chuẩn.", log: [{ at: at(-10, 9, 0), by: "Phạm Gia Huy", text: "Từ chối: phòng không có cửa sổ và lối thoát hiểm." }],
  },
];

export type UserAccount = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  type: UserType;
  status: UserStatus;
  roles: string[];
  createdAt: string;
  lastLoginAt: string | null;
};

export const USERS: UserAccount[] = [
  { id: "u1", name: "Quản trị TTHome", phone: "0901 000 001", email: "admin@tthome.vn", type: "admin", status: "active", roles: ["admin"], createdAt: at(-120, 9), lastLoginAt: at(0, 8, 2) },
  ...STAFF.map((s, i): UserAccount => ({
    id: `u${i + 2}`, name: s.name, phone: s.phone, email: `${s.id}@tthome.vn`, type: "consultant", status: "active",
    roles: i === 0 ? ["consultant", "content_editor"] : ["consultant"], createdAt: at(-90 + i * 5, 9), lastLoginAt: at(-(i % 2), 8 + i),
  })),
  ...NAMES.slice(0, 10).map((name, i): UserAccount => ({
    id: `u${i + 10}`, name, phone: phone(i + 40), email: i % 2 ? null : `user${i}@gmail.com`,
    type: i % 4 === 3 ? "landlord" : i === 5 ? "agent" : "tenant",
    status: i === 7 ? "locked" : i === 8 ? "pending_delete" : "active",
    roles: [i % 4 === 3 ? "landlord" : i === 5 ? "agent" : "tenant"], createdAt: at(-(i * 6 + 3), 12), lastLoginAt: i === 8 ? null : at(-(i % 5), 20),
  })),
];

export const ROLES = [
  { code: "admin", name: "Quản trị viên", users: 1, permissions: ["Toàn quyền"] },
  { code: "consultant", name: "Nhân viên tư vấn", users: 5, permissions: ["Xem và cập nhật lịch hẹn", "Quản lý khách được giao", "Xem quỹ phòng"] },
  { code: "content_editor", name: "Biên tập nội dung", users: 1, permissions: ["Quản lý bài viết", "Quản lý banner và FAQ"] },
  { code: "landlord", name: "Chủ nhà", users: 3, permissions: ["Gửi ký gửi", "Cập nhật phòng của mình"] },
  { code: "agent", name: "Cộng tác viên", users: 1, permissions: ["Gửi khách", "Xem hoa hồng"] },
  { code: "tenant", name: "Người thuê", users: 6, permissions: ["Đặt lịch", "Lưu phòng"] },
];

export type AuditEntry = { id: string; actor: string; action: string; entity: string; at: string; ip: string };

export const AUDIT_LOG: AuditEntry[] = [
  { id: "a1", actor: "Lê Ngọc Hân", action: "Xác nhận lịch hẹn", entity: "Lịch hẹn LH02401", at: at(0, 8, 31), ip: "113.161.72.14" },
  { id: "a2", actor: "Quản trị TTHome", action: "Khóa tài khoản", entity: "Người dùng Hồ Mỹ Duyên", at: at(0, 8, 12), ip: "113.161.72.10" },
  { id: "a3", actor: "Trần Minh Khoa", action: "Sửa ảnh bìa dự án", entity: "Dự án PRJ-A1C3F2", at: at(-1, 17, 45), ip: "171.244.9.33" },
  { id: "a4", actor: "Lê Ngọc Hân", action: "Yêu cầu bổ sung ký gửi", entity: "Ký gửi KG01281", at: at(-1, 10, 20), ip: "113.161.72.14" },
  { id: "a5", actor: "Võ Thu Trang", action: "Đăng bài viết", entity: "Bài viết: Sống gần Đại học Cần Thơ", at: at(-2, 9, 2), ip: "27.72.101.8" },
  { id: "a6", actor: "Phạm Gia Huy", action: "Đổi trạng thái khách", entity: "Khách Trần Quốc Bảo, từ Đang xem phòng sang Đã cọc", at: at(-2, 15, 11), ip: "42.118.6.200" },
  { id: "a7", actor: "Quản trị TTHome", action: "Gán vai trò", entity: "Trần Minh Khoa: Biên tập nội dung", at: at(-3, 11, 0), ip: "113.161.72.10" },
  { id: "a8", actor: "Nguyễn Đức Anh", action: "Phân công lịch hẹn", entity: "Lịch hẹn LH02409", at: at(-3, 14, 26), ip: "14.161.30.5" },
  { id: "a9", actor: "Võ Thu Trang", action: "Duyệt ký gửi", entity: "Ký gửi KG01277", at: at(-3, 9, 0), ip: "27.72.101.8" },
  { id: "a10", actor: "Phạm Gia Huy", action: "Từ chối ký gửi", entity: "Ký gửi KG01266", at: at(-10, 9, 0), ip: "42.118.6.200" },
];

export type DailyTraffic = { day: string; visitors: number; views: number; bookings: number; consults: number };

/** Thirty days of traffic ending today, with a weekly rhythm (weekends busier). */
export const TRAFFIC: DailyTraffic[] = Array.from({ length: 30 }, (_, i) => {
  const offset = i - 29;
  const d = new Date(`${TODAY}T00:00:00+07:00`);
  d.setUTCDate(d.getUTCDate() + offset);
  const weekday = new Date(d.getTime() + 7 * 3600_000).getUTCDay();
  const weekend = weekday === 0 || weekday === 6 ? 1.28 : 1;
  const trend = 1 + i * 0.012;
  const wobble = 1 + Math.sin(i * 1.7) * 0.08;
  const visitors = Math.round(1180 * weekend * trend * wobble);
  return {
    day: new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 10),
    visitors,
    views: Math.round(visitors * (3.1 + Math.cos(i) * 0.2)),
    bookings: Math.round(visitors * (0.021 + Math.sin(i * 0.9) * 0.003)),
    consults: Math.round(visitors * (0.012 + Math.cos(i * 1.3) * 0.002)),
  };
});

export const SOURCE_BREAKDOWN: { source: CustomerSource; customers: number }[] = [
  { source: "web", customers: 412 },
  { source: "zalo", customers: 186 },
  { source: "facebook", customers: 141 },
  { source: "hotline", customers: 97 },
  { source: "ctv", customers: 64 },
  { source: "tiktok", customers: 52 },
  { source: "meey", customers: 38 },
];

export type SyncRun = { id: string; kind: "incremental" | "reconcile" | "import_file"; startedAt: string; durationSec: number; status: SyncStatus; records: number; errors: number };

export const SYNC_RUNS: SyncRun[] = [
  { id: "sr1", kind: "incremental", startedAt: at(0, 8, 58), durationSec: 14, status: "ok", records: 23, errors: 0 },
  { id: "sr2", kind: "incremental", startedAt: at(0, 8, 56), durationSec: 11, status: "ok", records: 4, errors: 0 },
  { id: "sr3", kind: "incremental", startedAt: at(0, 8, 54), durationSec: 19, status: "partial", records: 31, errors: 2 },
  { id: "sr4", kind: "reconcile", startedAt: at(0, 2, 0), durationSec: 412, status: "ok", records: 1284, errors: 0 },
  { id: "sr5", kind: "reconcile", startedAt: at(-1, 2, 0), durationSec: 398, status: "ok", records: 1279, errors: 0 },
];

export type PartnerApplication = { id: string; kind: "ctv" | "job"; name: string; phone: string; detail: string; status: ApplicationStatus; createdAt: string };

export const PARTNER_APPLICATIONS: PartnerApplication[] = [
  { id: "pa1", kind: "ctv", name: "Đoàn Minh Trí", phone: phone(91), detail: "Sinh viên năm 3, có nhóm Zalo tìm phòng 2.000 thành viên.", status: "new", createdAt: at(0, 10, 4) },
  { id: "pa2", kind: "ctv", name: "Quách Ngọc Yến", phone: phone(92), detail: "Môi giới tự do khu Ninh Kiều.", status: "contacted", createdAt: at(-1, 15, 20) },
  { id: "pa3", kind: "job", name: "Lại Thành Công", phone: phone(93), detail: "Ứng tuyển Nhân viên tư vấn khu Cái Răng.", status: "new", createdAt: at(-1, 9, 0) },
  { id: "pa4", kind: "ctv", name: "Hứa Anh Khoa", phone: phone(94), detail: "Nhân viên văn phòng, giới thiệu khách là đồng nghiệp.", status: "approved", createdAt: at(-5, 19, 40) },
];

export const BANNERS = [
  { id: "b1", title: "Giảm 50% tháng đầu ở Võ Văn Tần", placement: "Trang chủ, đầu trang", active: true, until: at(14, 23).slice(0, 10), clicks: 1240 },
  { id: "b2", title: "Tân sinh viên: miễn phí tháng đầu ở Làng Đại học", placement: "Trang tìm phòng", active: true, until: at(30, 23).slice(0, 10), clicks: 860 },
  { id: "b3", title: "Ký gửi phòng, chụp ảnh miễn phí", placement: "Trang chủ, khối ký gửi", active: false, until: at(-3, 23).slice(0, 10), clicks: 412 },
];

export const MENU_ITEMS = [
  { id: "m1", label: "Tìm phòng", href: "/tim-kiem", location: "header" },
  { id: "m2", label: "Ký gửi phòng", href: "/ky-gui", location: "header" },
  { id: "m3", label: "Tư vấn thuê phòng", href: "/dat-lich", location: "header" },
  { id: "m4", label: "Hợp tác", href: "/tuyen-ctv", location: "header" },
  { id: "m5", label: "Cẩm nang", href: "/tin-tuc", location: "header" },
  { id: "m6", label: "Về chúng tôi", href: "/ve-chung-toi", location: "footer_company" },
  { id: "m7", label: "Câu hỏi thường gặp", href: "/hoi-dap", location: "footer_company" },
];

export const STATIC_PAGES = [
  { slug: "ve-chung-toi", title: "Về chúng tôi", updatedAt: at(-20, 10).slice(0, 10), status: "published" },
  { slug: "lien-he", title: "Liên hệ", updatedAt: at(-20, 10).slice(0, 10), status: "published" },
  { slug: "tuyen-ctv", title: "Tuyển cộng tác viên", updatedAt: at(-12, 10).slice(0, 10), status: "published" },
  { slug: "tuyen-dung", title: "Tuyển dụng", updatedAt: at(-2, 10).slice(0, 10), status: "draft" },
];

export function staffName(id: string | null): string | null {
  if (!id) return null;
  return STAFF.find((s) => s.id === id)?.name ?? null;
}

/** The numbers on the dashboard, shaped like report-service's DashboardResponse. */
export function dashboardFigures() {
  const rooms = PROJECTS.flatMap((p) => p.rooms);
  return {
    vacantRooms: rooms.filter((r) => r.status === "available").length,
    totalRooms: rooms.length,
    upcomingAppointments: APPOINTMENTS.filter((a) => a.scheduledAt >= at(0, 0) && ["pending", "confirmed", "rescheduled"].includes(a.status)).length,
    appointmentsToConfirm: APPOINTMENTS.filter((a) => a.status === "pending").length,
    newCustomers: CUSTOMERS.filter((c) => c.stage === "new").length + 9,
    newConsultRequests: CONSULTS.filter((c) => c.status === "new").length,
    pendingConsignments: SUBMISSIONS.filter((s) => s.status === "submitted").length,
    unavailable: [] as string[],
  };
}

export function inventoryFigures() {
  const rooms = PROJECTS.flatMap((p) => p.rooms);
  const count = (s: RoomStatus) => rooms.filter((r) => r.status === s).length;
  return { projects: PROJECTS.length, rooms: rooms.length, vacant: count("available"), reserved: count("reserved"), rented: count("rented"), hidden: count("hidden") };
}
