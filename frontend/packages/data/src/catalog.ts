import type { Amenity, District, Landmark, RoomType, Furniture, PetPolicy } from "./types";

/** The fixed day the mock data is built around, so server and browser render the same dates. */
export const TODAY = "2026-10-29";

export const SITE = {
  name: "TTHOME",
  hotline: "1900 6868",
  hotlineHref: "tel:19006868",
  zalo: "https://zalo.me/19006868",
  messenger: "https://m.me/tthome.vn",
  email: "hotro@tthome.vn",
  address: "135 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  taxCode: "0318 456 721",
  company: "Công ty TNHH TTHOME Việt Nam",
  hours: "8:00 – 21:00, kể cả thứ Bảy và Chủ nhật",
};

function district(slug: string, name: string, wards: [string, string][]): District {
  return { slug, name, wards: wards.map(([wSlug, wName]) => ({ slug: wSlug, name: wName, districtSlug: slug })) };
}

export const DISTRICTS: District[] = [
  district("quan-1", "Quận 1", [
    ["ben-nghe", "Phường Bến Nghé"],
    ["ben-thanh", "Phường Bến Thành"],
    ["da-kao", "Phường Đa Kao"],
  ]),
  district("quan-3", "Quận 3", [
    ["vo-thi-sau", "Phường Võ Thị Sáu"],
    ["phuong-9", "Phường 9"],
  ]),
  district("quan-7", "Quận 7", [
    ["tan-phong", "Phường Tân Phong"],
    ["tan-hung", "Phường Tân Hưng"],
  ]),
  district("quan-10", "Quận 10", [
    ["phuong-12", "Phường 12"],
    ["phuong-14", "Phường 14"],
  ]),
  district("binh-thanh", "Quận Bình Thạnh", [
    ["phuong-25", "Phường 25"],
    ["phuong-22", "Phường 22"],
    ["phuong-13", "Phường 13"],
  ]),
  district("phu-nhuan", "Quận Phú Nhuận", [
    ["phuong-7", "Phường 7"],
    ["phuong-15", "Phường 15"],
  ]),
  district("tan-binh", "Quận Tân Bình", [
    ["phuong-2", "Phường 2"],
    ["phuong-4", "Phường 4"],
  ]),
  district("go-vap", "Quận Gò Vấp", [
    ["phuong-5", "Phường 5"],
    ["phuong-10", "Phường 10"],
  ]),
  district("thu-duc", "TP. Thủ Đức", [
    ["thao-dien", "Phường Thảo Điền"],
    ["linh-trung", "Phường Linh Trung"],
    ["hiep-phu", "Phường Hiệp Phú"],
  ]),
  district("quan-12", "Quận 12", [
    ["an-phu-dong", "Phường An Phú Đông"],
    ["tan-chanh-hiep", "Phường Tân Chánh Hiệp"],
  ]),
];

export const PROVINCE = { slug: "ho-chi-minh", name: "TP. Hồ Chí Minh" };

export const AMENITIES: Amenity[] = [
  { code: "aircon", name: "Máy lạnh", scope: "room" },
  { code: "private_wc", name: "WC riêng", scope: "room" },
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

export const LANDMARKS: Landmark[] = [
  { slug: "rmit", name: "Đại học RMIT Nam Sài Gòn", shortName: "RMIT", kind: "university", lat: 10.7294, lng: 106.6955 },
  { slug: "bach-khoa", name: "Đại học Bách Khoa", shortName: "Bách Khoa", kind: "university", lat: 10.7725, lng: 106.6578 },
  { slug: "ueh", name: "Đại học Kinh tế UEH", shortName: "UEH", kind: "university", lat: 10.7831, lng: 106.6947 },
  { slug: "y-duoc", name: "Đại học Y Dược", shortName: "Y Dược", kind: "university", lat: 10.7556, lng: 106.663 },
  { slug: "van-lang", name: "Đại học Văn Lang", shortName: "Văn Lang", kind: "university", lat: 10.8124, lng: 106.695 },
  { slug: "lang-dai-hoc", name: "Làng Đại học Thủ Đức", shortName: "Làng Đại học", kind: "university", lat: 10.87, lng: 106.803 },
  { slug: "landmark-81", name: "Landmark 81", shortName: "Landmark 81", kind: "mall", lat: 10.795, lng: 106.7218 },
  { slug: "gigamall", name: "Gigamall Thủ Đức", shortName: "Gigamall", kind: "mall", lat: 10.8276, lng: 106.7213 },
];

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  studio: "Studio",
  duplex: "Duplex",
  "1pn": "1 phòng ngủ",
  "2pn": "2 phòng ngủ",
  "3pn": "3 phòng ngủ",
  shared: "Ở ghép",
  dorm: "Ký túc xá",
  room: "Phòng trọ",
};

export const FURNITURE_LABEL: Record<Furniture, string> = {
  full: "Đầy đủ nội thất",
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
  { slug: "duoi-3-5-trieu", label: "Dưới 3,5 triệu", min: 0, max: 3_500_000 },
  { slug: "3-5-5-trieu", label: "3,5 – 5 triệu", min: 3_500_000, max: 5_000_000 },
  { slug: "5-7-trieu", label: "5 – 7 triệu", min: 5_000_000, max: 7_000_000 },
  { slug: "tren-7-trieu", label: "Trên 7 triệu", min: 7_000_000, max: Number.MAX_SAFE_INTEGER },
] as const;

export function findDistrict(slug: string) {
  return DISTRICTS.find((d) => d.slug === slug);
}

export function findWard(districtSlug: string, wardSlug: string) {
  return findDistrict(districtSlug)?.wards.find((w) => w.slug === wardSlug);
}

export function findLandmark(slug: string) {
  return LANDMARKS.find((l) => l.slug === slug);
}
