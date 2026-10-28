export type NavGroup = { label: string; items: { href: string; label: string }[] };

export const NAV: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      { href: "/admin/dashboard", label: "Tổng quan" },
      { href: "/admin/reports", label: "Báo cáo" },
      { href: "/admin/audit", label: "Nhật ký hoạt động" },
    ],
  },
  {
    label: "Vận hành",
    items: [
      { href: "/admin/appointments", label: "Lịch hẹn xem phòng" },
      { href: "/admin/customers", label: "Khách và tư vấn" },
      { href: "/admin/consignments", label: "Duyệt ký gửi" },
    ],
  },
  {
    label: "Kho phòng",
    items: [
      { href: "/admin/rooms", label: "Phòng và dự án" },
      { href: "/admin/catalog", label: "Khu vực và tiện nghi" },
    ],
  },
  {
    label: "Nội dung và hệ thống",
    items: [
      { href: "/admin/content", label: "Nội dung" },
      { href: "/admin/users", label: "Người dùng và phân quyền" },
    ],
  },
];

export const STAFF_ROLES = ["ADMIN", "CONSULTANT"];
