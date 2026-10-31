/** Labels come from the dictionary: `t.nav[item.key]`. */
export const MAIN_NAV = [
  { href: "/tim-kiem", key: "search" },
  { href: "/khu-vuc", key: "areas" },
  { href: "/ky-gui", key: "consign" },
  { href: "/tuyen-dung", key: "jobs" },
  { href: "/tin-tuc", key: "guide" },
  { href: "/ve-chung-toi", key: "about" },
] as const;

export const ACCOUNT_NAV = [
  { href: "/tai-khoan/ho-so", key: "profile" },
  { href: "/tai-khoan/da-luu", key: "saved" },
  { href: "/tai-khoan/lich-hen", key: "appointments" },
  { href: "/tai-khoan/phong-ky-gui", key: "landlord" },
] as const;

export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
