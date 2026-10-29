export const MAIN_NAV = [
  { href: "/tim-kiem", label: "Tìm phòng" },
  { href: "/khu-vuc", label: "Khu vực" },
  { href: "/ky-gui", label: "Ký gửi phòng" },
  { href: "/tin-tuc", label: "Cẩm nang" },
  { href: "/ve-chung-toi", label: "Về TTHOME" },
] as const;

export const ACCOUNT_NAV = [
  { href: "/tai-khoan/ho-so", label: "Hồ sơ" },
  { href: "/tai-khoan/da-luu", label: "Phòng đã lưu" },
  { href: "/tai-khoan/lich-hen", label: "Lịch hẹn của tôi" },
  { href: "/tai-khoan/phong-ky-gui", label: "Phòng ký gửi" },
] as const;

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
