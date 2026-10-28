"use client";

import { Tag } from "@/components/admin/parts";
import { FieldDef, Resource, ResourceScreen, Row } from "./resource-panel";

const LOCALES: [string, string][] = [["vi", "Tiếng Việt"], ["en", "English"]];
const SLUG = "[a-z0-9]+(-[a-z0-9]+)*";
const dash = <span className="text-ink-soft">—</span>;
const day = (v: Row[string]) => (typeof v === "string" ? v.slice(0, 10) : dash);
const locale = (r: Row) => String(r.locale).toUpperCase();
const onOff = (r: Row) => <Tag tone={r.active ? "ok" : "neutral"}>{r.active ? "Đang bật" : "Đã tắt"}</Tag>;

const localeField: FieldDef = { name: "locale", label: "Ngôn ngữ", kind: "select", required: true, initial: "vi", options: LOCALES };
const sortField: FieldDef = { name: "sortOrder", label: "Thứ tự hiển thị", kind: "number", required: true, initial: "0", min: 0, max: 32000 };
const activeField: FieldDef = { name: "active", label: "Đang hiển thị", kind: "checkbox", initial: true };
const localeFilter = { name: "locale", label: "Ngôn ngữ", options: LOCALES };

const POST_STATUS: [string, string][] = [["draft", "Bản nháp"], ["scheduled", "Đã lên lịch"], ["published", "Đã đăng"], ["archived", "Lưu trữ"]];
const PAGE_STATUS: [string, string][] = [["draft", "Bản nháp"], ["published", "Đã đăng"]];
const APPLICATION_STATUS: [string, string][] = [["new", "Mới"], ["contacted", "Đã liên hệ"], ["approved", "Đã duyệt"], ["rejected", "Từ chối"]];
const AUDIENCE: [string, string][] = [["tenant", "Người thuê"], ["landlord", "Chủ nhà"], ["all", "Tất cả"]];
const MENU_LOCATION: [string, string][] = [["header", "Đầu trang"], ["footer_company", "Chân trang: công ty"], ["footer_connect", "Chân trang: kết nối"]];
const statusLabel = (options: [string, string][], v: Row[string]) => options.find(([o]) => o === v)?.[1] ?? String(v);
const POST_TONE = { published: "ok", scheduled: "warn" } as const;

const byId = (r: Row) => String(r.id);

export const CONTENT: Resource[] = [
  {
    key: "posts",
    label: "Bài viết",
    noun: "bài viết",
    path: "cms/posts",
    paged: true,
    search: true,
    rowId: byId,
    rowName: (r) => String(r.title),
    empty: "Chưa có bài viết nào. Chọn “Thêm bài viết” để viết bài đầu tiên.",
    filters: [localeFilter, { name: "status", label: "Trạng thái", options: POST_STATUS }],
    statusActions: [["published", "Đăng ngay"], ["archived", "Lưu trữ"], ["draft", "Chuyển về nháp"]],
    columns: [
      { header: "Tiêu đề", render: (r) => r.title, className: "max-w-[24rem] truncate" },
      { header: "Ngôn ngữ", render: locale },
      { header: "Trạng thái", render: (r) => <Tag tone={POST_TONE[r.status as keyof typeof POST_TONE] ?? "neutral"}>{statusLabel(POST_STATUS, r.status)}</Tag> },
      { header: "Ngày đăng", render: (r) => day(r.publishedAt) },
      { header: "Lượt xem", render: (r) => Number(r.viewCount).toLocaleString("vi-VN"), numeric: true },
    ],
    fields: [
      localeField,
      { name: "title", label: "Tiêu đề", required: true, max: 300 },
      { name: "slug", label: "Đường dẫn", max: 200, pattern: SLUG, hint: "Để trống để tạo từ tiêu đề. Chỉ gồm chữ thường, số và dấu gạch ngang." },
      { name: "categoryId", label: "Danh mục", kind: "select", source: { path: "cms/categories", label: (r) => `${r.name} (${locale(r)})` } },
      { name: "authorName", label: "Tên tác giả", max: 200 },
      { name: "excerpt", label: "Tóm tắt", kind: "textarea", max: 1000, rows: 3 },
      { name: "content", label: "Nội dung", kind: "textarea", required: true, max: 500000, rows: 10 },
      { name: "coverUrl", label: "Ảnh bìa (https)", max: 1000, pattern: "https://\\S+", inputType: "url" },
      { name: "status", label: "Trạng thái", kind: "select", required: true, initial: "draft", options: POST_STATUS },
      { name: "publishedAt", label: "Thời điểm đăng", kind: "datetime", hint: "Bài lên lịch cần một thời điểm trong tương lai; bỏ trống khi đăng ngay thì hệ thống lấy giờ hiện tại." },
      { name: "tagIds", label: "Thẻ (tối đa 20)", kind: "multi", source: { path: "cms/tags", label: (r) => `${r.name} (${locale(r)})` } },
    ],
  },
  {
    key: "banners",
    label: "Banner",
    noun: "banner",
    path: "cms/banners",
    rowId: byId,
    rowName: (r) => String(r.title || r.placement),
    empty: "Chưa có banner nào. Chọn “Thêm banner” để tạo banner đầu tiên.",
    filters: [localeFilter, { name: "active", label: "Hiển thị", options: [["true", "Đang bật"], ["false", "Đã tắt"]] }],
    columns: [
      { header: "Banner", render: (r) => r.title || r.placement },
      { header: "Vị trí", render: (r) => r.placement },
      { header: "Ngôn ngữ", render: locale },
      { header: "Thứ tự", render: (r) => r.sortOrder, numeric: true },
      { header: "Trạng thái", render: onOff },
    ],
    fields: [
      localeField,
      { name: "placement", label: "Vị trí hiển thị", required: true, max: 64, pattern: "[a-z0-9_]+", hint: "Chữ thường, số và dấu gạch dưới, ví dụ home_hero." },
      { name: "title", label: "Tiêu đề", max: 200 },
      { name: "imageUrl", label: "Ảnh (https)", required: true, max: 1000, pattern: "https://\\S+", inputType: "url" },
      { name: "mobileImageUrl", label: "Ảnh cho điện thoại (https)", max: 1000, pattern: "https://\\S+", inputType: "url" },
      { name: "linkUrl", label: "Liên kết", max: 1000, pattern: "(/\\S*|https://\\S+)", hint: "Đường dẫn nội bộ bắt đầu bằng / hoặc địa chỉ https." },
      sortField,
      { name: "startsAt", label: "Bắt đầu hiển thị", kind: "datetime" },
      { name: "endsAt", label: "Ngừng hiển thị", kind: "datetime" },
      activeField,
    ],
  },
  {
    key: "pages",
    label: "Trang tĩnh",
    noun: "trang",
    path: "cms/pages",
    rowId: byId,
    rowName: (r) => String(r.title),
    empty: "Chưa có trang tĩnh nào. Chọn “Thêm trang” để tạo trang đầu tiên.",
    filters: [localeFilter],
    columns: [
      { header: "Tiêu đề", render: (r) => r.title },
      { header: "Đường dẫn", render: (r) => <span className="font-mono text-sm">/{r.slug}</span> },
      { header: "Ngôn ngữ", render: locale },
      { header: "Trạng thái", render: (r) => <Tag tone={r.status === "published" ? "ok" : "neutral"}>{statusLabel(PAGE_STATUS, r.status)}</Tag> },
    ],
    fields: [
      localeField,
      { name: "slug", label: "Đường dẫn", required: true, max: 200, pattern: `${SLUG}(/${SLUG})*`, hint: "Có thể lồng nhau, ví dụ chinh-sach/bao-mat." },
      { name: "title", label: "Tiêu đề", required: true, max: 200 },
      { name: "content", label: "Nội dung", kind: "textarea", max: 200000, rows: 10 },
      { name: "status", label: "Trạng thái", kind: "select", required: true, initial: "draft", options: PAGE_STATUS },
    ],
  },
  {
    key: "faqs",
    label: "Câu hỏi thường gặp",
    noun: "câu hỏi",
    path: "cms/faqs",
    rowId: byId,
    rowName: (r) => String(r.question),
    empty: "Chưa có câu hỏi nào. Chọn “Thêm câu hỏi” để tạo câu hỏi đầu tiên.",
    filters: [localeFilter, { name: "audience", label: "Đối tượng", options: AUDIENCE }],
    columns: [
      { header: "Câu hỏi", render: (r) => r.question, className: "max-w-[26rem] truncate" },
      { header: "Đối tượng", render: (r) => statusLabel(AUDIENCE, r.audience) },
      { header: "Ngôn ngữ", render: locale },
      { header: "Thứ tự", render: (r) => r.sortOrder, numeric: true },
      { header: "Trạng thái", render: onOff },
    ],
    fields: [
      localeField,
      { name: "audience", label: "Đối tượng", kind: "select", required: true, initial: "all", options: AUDIENCE },
      { name: "question", label: "Câu hỏi", required: true, max: 500 },
      { name: "answer", label: "Câu trả lời", kind: "textarea", required: true, max: 10000, rows: 6 },
      sortField,
      activeField,
    ],
  },
  {
    key: "menu-items",
    label: "Menu",
    noun: "mục menu",
    path: "cms/menu-items",
    rowId: byId,
    rowName: (r) => String(r.label),
    empty: "Chưa có mục menu nào. Chọn “Thêm mục menu” để tạo mục đầu tiên.",
    filters: [localeFilter, { name: "location", label: "Vị trí", options: MENU_LOCATION }],
    columns: [
      { header: "Tên mục", render: (r) => r.label },
      { header: "Địa chỉ", render: (r) => <span className="font-mono text-sm">{r.url}</span>, className: "max-w-[18rem] truncate" },
      { header: "Vị trí", render: (r) => statusLabel(MENU_LOCATION, r.location) },
      { header: "Thứ tự", render: (r) => r.sortOrder, numeric: true },
      { header: "Trạng thái", render: onOff },
    ],
    fields: [
      localeField,
      { name: "location", label: "Vị trí", kind: "select", required: true, initial: "header", options: MENU_LOCATION },
      { name: "parentId", label: "Mục cha", kind: "select", source: { path: "cms/menu-items", label: (r) => `${r.label} (${r.location})` } },
      { name: "label", label: "Tên mục", required: true, max: 200 },
      { name: "url", label: "Địa chỉ", required: true, max: 1000, pattern: "(/\\S*|https://\\S+)", hint: "Đường dẫn nội bộ bắt đầu bằng / hoặc địa chỉ https." },
      { name: "external", label: "Mở sang trang ngoài", kind: "checkbox" },
      sortField,
      activeField,
    ],
  },
  {
    key: "categories",
    label: "Danh mục",
    noun: "danh mục",
    path: "cms/categories",
    rowId: byId,
    rowName: (r) => String(r.name),
    empty: "Chưa có danh mục nào. Chọn “Thêm danh mục” để tạo danh mục đầu tiên.",
    filters: [localeFilter],
    columns: [
      { header: "Tên", render: (r) => r.name },
      { header: "Đường dẫn", render: (r) => <span className="font-mono text-sm">{r.slug}</span> },
      { header: "Ngôn ngữ", render: locale },
      { header: "Thứ tự", render: (r) => r.sortOrder, numeric: true },
    ],
    fields: [
      localeField,
      { name: "parentId", label: "Danh mục cha", kind: "select", source: { path: "cms/categories", label: (r) => `${r.name} (${locale(r)})` } },
      { name: "name", label: "Tên", required: true, max: 200 },
      { name: "slug", label: "Đường dẫn", required: true, max: 200, pattern: SLUG, hint: "Chỉ gồm chữ thường, số và dấu gạch ngang." },
      sortField,
    ],
  },
  {
    key: "tags",
    label: "Thẻ",
    noun: "thẻ",
    path: "cms/tags",
    rowId: byId,
    rowName: (r) => String(r.name),
    empty: "Chưa có thẻ nào. Chọn “Thêm thẻ” để tạo thẻ đầu tiên.",
    filters: [localeFilter],
    columns: [
      { header: "Tên", render: (r) => r.name },
      { header: "Đường dẫn", render: (r) => <span className="font-mono text-sm">{r.slug}</span> },
      { header: "Ngôn ngữ", render: locale },
    ],
    fields: [
      localeField,
      { name: "name", label: "Tên", required: true, max: 100 },
      { name: "slug", label: "Đường dẫn", required: true, max: 200, pattern: SLUG, hint: "Chỉ gồm chữ thường, số và dấu gạch ngang." },
    ],
  },
  {
    key: "partner-applications",
    label: "Đăng ký đối tác",
    noun: "đơn đăng ký",
    path: "cms/partner-applications",
    paged: true,
    search: true,
    create: false,
    edit: false,
    remove: false,
    rowId: byId,
    rowName: (r) => String(r.fullName),
    empty: "Chưa có đơn đăng ký nào.",
    filters: [{ name: "kind", label: "Loại", options: [["ctv", "Cộng tác viên"], ["job", "Ứng tuyển"]] }, { name: "status", label: "Trạng thái", options: APPLICATION_STATUS }],
    statusActions: [["contacted", "Đã liên hệ"], ["approved", "Duyệt"], ["rejected", "Từ chối"]],
    columns: [
      { header: "Họ tên", render: (r) => r.fullName },
      { header: "Loại", render: (r) => (r.kind === "ctv" ? "Cộng tác viên" : "Ứng tuyển") },
      { header: "Điện thoại", render: (r) => <span className="tabular-nums">{r.phone}</span> },
      { header: "Trạng thái", render: (r) => <Tag tone={r.status === "approved" ? "ok" : r.status === "new" ? "warn" : "neutral"}>{statusLabel(APPLICATION_STATUS, r.status)}</Tag> },
      { header: "Ngày gửi", render: (r) => day(r.createdAt), numeric: true },
    ],
    fields: [
      { name: "kind", label: "Loại", options: [["ctv", "Cộng tác viên"], ["job", "Ứng tuyển"]] },
      { name: "fullName", label: "Họ tên" },
      { name: "phone", label: "Điện thoại" },
      { name: "email", label: "Email" },
      { name: "position", label: "Vị trí ứng tuyển" },
      { name: "message", label: "Lời nhắn" },
      { name: "status", label: "Trạng thái", options: APPLICATION_STATUS },
      { name: "createdAt", label: "Gửi lúc", kind: "datetime" },
    ],
  },
];

export const ContentScreen = () => <ResourceScreen title="Nội dung" resources={CONTENT} />;
