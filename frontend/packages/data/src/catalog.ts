import { CITIES, LANDMARKS } from "./geo";
import type { Amenity, City, RoomType, Furniture, PetPolicy } from "./types";

/** The fixed day the mock data is built around, so server and browser render the same dates. */
export const TODAY = "2026-10-29";

export const SITE = {
  name: "TTHOME",
  hotline: "0939 987 998",
  hotlineHref: "tel:0939987998",
  zalo: "https://zalo.me/0939987998",
  messenger: "https://m.me/tthome.vn",
  facebook: "https://www.facebook.com/tthome.vn",
  tiktok: "https://www.tiktok.com/@tthome.vn",
  email: "hotro@tthome.vn",
  address: "52 Đường 30 Tháng 4, Phường Ninh Kiều, TP. Cần Thơ",
  taxCode: "1801 456 721",
  company: "Công ty TNHH TTHOME Việt Nam",
  hours: "8:00 – 21:00, kể cả thứ Bảy và Chủ nhật",
};

export { CITIES, LANDMARKS };

/** TP. Hồ Chí Minh first: it has the most rooms. */
export const DEFAULT_CITY = "ho-chi-minh";

export const AMENITIES: Amenity[] = [
  { code: "aircon", name: "Máy lạnh", scope: "room" },
  { code: "washer", name: "Máy giặt riêng", scope: "room" },
  { code: "kitchen", name: "Bếp riêng", scope: "room" },
  { code: "fridge", name: "Tủ lạnh", scope: "room" },
  { code: "water_heater", name: "Máy nước nóng", scope: "room" },
  { code: "elevator", name: "Thang máy", scope: "project" },
  { code: "fingerprint", name: "Khóa vân tay", scope: "project" },
  { code: "parking", name: "Hầm để xe", scope: "project" },
  { code: "security", name: "Bảo vệ 24/7", scope: "project" },
  { code: "free_hours", name: "Giờ giấc tự do", scope: "project" },
  { code: "shared_washer", name: "Máy giặt chung", scope: "project" },
  { code: "rooftop", name: "Sân thượng", scope: "project" },
  { code: "cleaning", name: "Dọn phòng hằng tuần", scope: "project" },
];

export const AMENITY_NAME: Record<string, string> = Object.fromEntries(AMENITIES.map((a) => [a.code, a.name]));


/** In the order the search menus list them. */
export const ROOM_TYPES: RoomType[] = ["room", "studio", "duplex", "1pn", "2pn", "house", "apartment", "shophouse"];

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  room: "Phòng trọ",
  studio: "Studio (không gác)",
  duplex: "Duplex (có gác)",
  "1pn": "1 phòng ngủ",
  "2pn": "2 phòng ngủ",
  house: "Nhà nguyên căn",
  apartment: "Chung cư",
  shophouse: "Mặt tiền kinh doanh",
};

export const FURNITURE_LABEL: Record<Furniture, string> = {
  full: "Full nội thất",
  basic: "Nội thất cơ bản",
  none: "Phòng trống",
};

export const PET_LABEL: Record<PetPolicy, string> = {
  none: "Không nuôi thú cưng",
  cat: "Cho nuôi mèo",
  small_pet: "Cho nuôi thú nhỏ",
  ask_owner: "Thú cưng: hỏi chủ nhà",
  allowed: "Cho nuôi thú cưng",
};

export const PRICE_BANDS = [
  { slug: "duoi-2-5-trieu", label: "Dưới 2,5 triệu", min: 0, max: 2_500_000 },
  { slug: "2-5-3-5-trieu", label: "2,5 – 3,5 triệu", min: 2_500_000, max: 3_500_000 },
  { slug: "3-5-5-trieu", label: "3,5 – 5 triệu", min: 3_500_000, max: 5_000_000 },
  { slug: "5-7-trieu", label: "5 – 7 triệu", min: 5_000_000, max: 7_000_000 },
  { slug: "7-10-trieu", label: "7 – 10 triệu", min: 7_000_000, max: 10_000_000 },
  { slug: "tren-10-trieu", label: "Trên 10 triệu", min: 10_000_000, max: Number.MAX_SAFE_INTEGER },
] as const;

export function findCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

export function findWard(citySlug: string, wardSlug: string) {
  return findCity(citySlug)?.wards.find((w) => w.slug === wardSlug);
}

export function findLandmark(slug: string) {
  return LANDMARKS.find((l) => l.slug === slug);
}
