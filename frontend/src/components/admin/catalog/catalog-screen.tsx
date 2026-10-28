"use client";

import { Tag } from "@/components/admin/parts";
import { FieldDef, Resource, ResourceScreen, Row } from "@/components/admin/content/resource-panel";

const SCHEME: [string, string][] = [["pre_2025", "Trước năm 2025"], ["post_2025", "Từ năm 2025"]];
const LEVEL: [string, string][] = [["1", "Tỉnh, thành phố"], ["2", "Quận, huyện"], ["3", "Phường, xã"]];
const SCOPE: [string, string][] = [["room", "Phòng"], ["project", "Dự án"], ["both", "Cả hai"]];
const KIND: [string, string][] = [["university", "Trường đại học"], ["mall", "Trung tâm thương mại"], ["industrial", "Khu công nghiệp"], ["hospital", "Bệnh viện"], ["other", "Khác"]];
const ROOM_TYPE: Record<string, string> = { studio: "Studio", duplex: "Duplex", "1pn": "1 phòng ngủ", "2pn": "2 phòng ngủ", "3pn": "3 phòng ngủ", shared: "Ở ghép", dorm: "Ký túc xá", room: "Phòng trọ" };

const label = (options: [string, string][], v: Row[string]) => options.find(([o]) => o === String(v))?.[1] ?? String(v);
const coord = (v: Row[string]) => (typeof v === "number" ? v.toFixed(5) : <span className="text-ink-soft">—</span>);
const byId = (r: Row) => String(r.id);
const CODE = "[a-z0-9]+(_[a-z0-9]+)*";
const sortField: FieldDef = { name: "sortOrder", label: "Thứ tự hiển thị", kind: "number", required: true, initial: "0", min: 0, max: 32000 };
const latitude = (name: string): FieldDef => ({ name, label: "Vĩ độ", kind: "number", step: "any", min: -90, max: 90 });
const longitude = (name: string): FieldDef => ({ name, label: "Kinh độ", kind: "number", step: "any", min: -180, max: 180 });

export const CATALOG: Resource[] = [
  {
    key: "areas",
    label: "Khu vực",
    noun: "khu vực",
    path: "catalog/areas",
    paged: true,
    pageSize: 50,
    search: true,
    rowId: byId,
    rowName: (r) => String(r.name),
    empty: "Chưa có khu vực nào. Chọn “Thêm khu vực” để tạo khu vực đầu tiên.",
    filters: [{ name: "scheme", label: "Phiên bản địa giới", options: SCHEME }, { name: "level", label: "Cấp", options: LEVEL }],
    columns: [
      { header: "Tên", render: (r) => r.name },
      { header: "Mã", render: (r) => r.id, numeric: true },
      { header: "Cấp", render: (r) => label(LEVEL, r.level) },
      { header: "Địa giới", render: (r) => <Tag>{label(SCHEME, r.scheme)}</Tag> },
      { header: "Đường dẫn", render: (r) => <span className="font-mono text-sm">{r.slug}</span> },
    ],
    fields: [
      { name: "id", label: "Mã hành chính", kind: "number", required: true, min: 1, createOnly: true, hint: "Mã chính thức của đơn vị hành chính, không đổi được sau khi tạo." },
      { name: "level", label: "Cấp", kind: "select", required: true, numeric: true, options: LEVEL, createOnly: true },
      { name: "scheme", label: "Phiên bản địa giới", kind: "select", required: true, options: SCHEME, createOnly: true },
      { name: "parentId", label: "Mã đơn vị cấp trên", kind: "number", min: 1, createOnly: true },
      { name: "name", label: "Tên", required: true, max: 200 },
      { name: "slug", label: "Đường dẫn", required: true, max: 200, pattern: "[a-z0-9]+(-[a-z0-9]+)*", hint: "Chỉ gồm chữ thường, số và dấu gạch ngang." },
      latitude("centerLat"),
      longitude("centerLng"),
    ],
  },
  {
    key: "amenities",
    label: "Tiện nghi",
    noun: "tiện nghi",
    path: "catalog/amenities",
    rowId: byId,
    rowName: (r) => String(r.name),
    empty: "Chưa có tiện nghi nào. Chọn “Thêm tiện nghi” để tạo tiện nghi đầu tiên.",
    columns: [
      { header: "Tên", render: (r) => r.name },
      { header: "Mã", render: (r) => <span className="font-mono text-sm">{r.code}</span> },
      { header: "Áp dụng cho", render: (r) => label(SCOPE, r.scope) },
      { header: "Bộ lọc", render: (r) => (r.filter ? <Tag tone="ok">Có</Tag> : <span className="text-ink-soft">—</span>) },
      { header: "Thứ tự", render: (r) => r.sortOrder, numeric: true },
    ],
    fields: [
      { name: "code", label: "Mã", required: true, max: 64, pattern: CODE, hint: "Chữ thường, số và dấu gạch dưới, ví dụ air_conditioner." },
      { name: "name", label: "Tên", required: true, max: 200 },
      { name: "scope", label: "Áp dụng cho", kind: "select", required: true, initial: "room", options: SCOPE },
      { name: "icon", label: "Biểu tượng", max: 100 },
      sortField,
      { name: "filter", label: "Dùng làm bộ lọc khi tìm phòng", kind: "checkbox" },
    ],
  },
  {
    key: "landmarks",
    label: "Địa điểm lân cận",
    noun: "địa điểm",
    path: "catalog/landmarks",
    rowId: byId,
    rowName: (r) => String(r.name),
    empty: "Chưa có địa điểm nào. Chọn “Thêm địa điểm” để tạo địa điểm đầu tiên.",
    columns: [
      { header: "Tên", render: (r) => r.name },
      { header: "Loại", render: (r) => label(KIND, r.kind) },
      { header: "Vĩ độ", render: (r) => coord(r.lat), numeric: true },
      { header: "Kinh độ", render: (r) => coord(r.lng), numeric: true },
      { header: "Bán kính (m)", render: (r) => Number(r.radiusM).toLocaleString("vi-VN"), numeric: true },
    ],
    fields: [
      { name: "code", label: "Mã", required: true, max: 64, pattern: CODE, hint: "Chữ thường, số và dấu gạch dưới, ví dụ dh_bach_khoa." },
      { name: "name", label: "Tên", required: true, max: 200 },
      { name: "kind", label: "Loại", kind: "select", required: true, initial: "university", options: KIND },
      latitude("lat"),
      longitude("lng"),
      { name: "radiusM", label: "Bán kính ảnh hưởng (m)", kind: "number", required: true, initial: "1000", min: 1, max: 100000 },
      sortField,
    ],
  },
  {
    key: "room-types",
    label: "Loại phòng",
    noun: "loại phòng",
    path: "catalog/room-types",
    create: false,
    edit: false,
    remove: false,
    rowId: (r) => String(r.code),
    rowName: (r) => String(r.code),
    empty: "Chưa có loại phòng nào.",
    // The backend answers with bare codes; the list is fixed by a database constraint.
    select: (data) => (data as string[]).map((code) => ({ code, name: ROOM_TYPE[code] ?? code })),
    columns: [
      { header: "Loại phòng", render: (r) => r.name },
      { header: "Mã", render: (r) => <span className="font-mono text-sm">{r.code}</span> },
    ],
    fields: [
      { name: "name", label: "Loại phòng" },
      { name: "code", label: "Mã" },
    ],
  },
];

export const CatalogScreen = () => <ResourceScreen title="Khu vực và tiện nghi" resources={CATALOG} />;
