import {
  CalendarDays,
  ChartColumn,
  ClipboardCheck,
  House,
  LayoutDashboard,
  MapPin,
  Newspaper,
  RefreshCw,
  ScrollText,
  UserCog,
  Users,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import { APPOINTMENTS, CONSULTS, SUBMISSIONS } from "@tthome/data";

export type NavItem = { href: string; label: string; icon: LucideIcon; count?: number };
export type NavGroup = { label: string; items: NavItem[] };

export const NAV: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      { href: "/", label: "Bảng điều khiển", icon: LayoutDashboard },
      { href: "/bao-cao", label: "Báo cáo", icon: ChartColumn },
    ],
  },
  {
    label: "Vận hành",
    items: [
      { href: "/lich-hen", label: "Lịch hẹn xem phòng", icon: CalendarDays, count: APPOINTMENTS.filter((a) => a.status === "pending").length },
      { href: "/khach-hang", label: "Khách và tư vấn", icon: Users, count: CONSULTS.filter((c) => c.status === "new").length },
      { href: "/ky-gui", label: "Duyệt ký gửi", icon: ClipboardCheck, count: SUBMISSIONS.filter((s) => s.status === "submitted").length },
      { href: "/cong-tac-vien", label: "Cộng tác viên", icon: Handshake },
    ],
  },
  {
    label: "Dữ liệu",
    items: [
      { href: "/phong", label: "Phòng và dự án", icon: House },
      { href: "/danh-muc", label: "Khu vực và tiện nghi", icon: MapPin },
      { href: "/noi-dung", label: "Nội dung", icon: Newspaper },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { href: "/nguoi-dung", label: "Người dùng và quyền", icon: UserCog },
      { href: "/dong-bo", label: "Đồng bộ Meey CRM", icon: RefreshCw },
      { href: "/nhat-ky", label: "Nhật ký hoạt động", icon: ScrollText },
    ],
  },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
