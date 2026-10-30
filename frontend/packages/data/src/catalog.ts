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
  address: "52 Đường 30 Tháng 4, Phường Xuân Khánh, Quận Ninh Kiều, TP. Cần Thơ",
  taxCode: "1801 456 721",
  company: "Công ty TNHH TTHOME Việt Nam",
  hours: "8:00 – 21:00, kể cả thứ Bảy và Chủ nhật",
};

function district(slug: string, name: string, wards: [string, string][]): District {
  return { slug, name, wards: wards.map(([wSlug, wName]) => ({ slug: wSlug, name: wName, districtSlug: slug })) };
}

export const DISTRICTS: District[] = [
  district("ninh-kieu", "Quận Ninh Kiều", [
    ["tan-an", "Phường Tân An"],
    ["an-hoa", "Phường An Hòa"],
    ["xuan-khanh", "Phường Xuân Khánh"],
    ["hung-loi", "Phường Hưng Lợi"],
    ["an-khanh", "Phường An Khánh"],
    ["an-cu", "Phường An Cư"],
    ["cai-khe", "Phường Cái Khế"],
    ["an-binh", "Phường An Bình"],
  ]),
  district("cai-rang", "Quận Cái Răng", [
    ["hung-phu", "Phường Hưng Phú"],
    ["le-binh", "Phường Lê Bình"],
    ["hung-thanh", "Phường Hưng Thạnh"],
  ]),
  district("binh-thuy", "Quận Bình Thủy", [
    ["binh-thuy", "Phường Bình Thủy"],
    ["an-thoi", "Phường An Thới"],
    ["tra-noc", "Phường Trà Nóc"],
    ["long-hoa", "Phường Long Hòa"],
  ]),
  district("o-mon", "Quận Ô Môn", [
    ["chau-van-liem", "Phường Châu Văn Liêm"],
    ["phuoc-thoi", "Phường Phước Thới"],
  ]),
  district("phong-dien", "Huyện Phong Điền", [
    ["my-khanh", "Xã Mỹ Khánh"],
    ["phong-dien", "Thị trấn Phong Điền"],
  ]),
];

export const PROVINCE = { slug: "can-tho", name: "TP. Cần Thơ" };

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
  { slug: "dh-can-tho", name: "Đại học Cần Thơ", shortName: "ĐH Cần Thơ", kind: "university", lat: 10.0299, lng: 105.7706 },
  { slug: "y-duoc-can-tho", name: "Đại học Y Dược Cần Thơ", shortName: "Y Dược", kind: "university", lat: 10.034, lng: 105.7553 },
  { slug: "fpt-can-tho", name: "Đại học FPT Cần Thơ", shortName: "FPT", kind: "university", lat: 10.0127, lng: 105.7324 },
  { slug: "vincom-xuan-khanh", name: "Vincom Xuân Khánh", shortName: "Vincom", kind: "mall", lat: 10.0263, lng: 105.7774 },
  { slug: "sense-city", name: "Sense City Cần Thơ", shortName: "Sense City", kind: "mall", lat: 10.0336, lng: 105.7836 },
  { slug: "ben-ninh-kieu", name: "Bến Ninh Kiều", shortName: "Bến Ninh Kiều", kind: "other", lat: 10.0339, lng: 105.7884 },
  { slug: "bv-da-khoa-trung-uong", name: "Bệnh viện Đa khoa Trung ương Cần Thơ", shortName: "BV Trung ương", kind: "hospital", lat: 10.0236, lng: 105.7584 },
  { slug: "kcn-tra-noc", name: "Khu công nghiệp Trà Nóc", shortName: "KCN Trà Nóc", kind: "industrial", lat: 10.095, lng: 105.729 },
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
  { slug: "duoi-2-5-trieu", label: "Dưới 2,5 triệu", min: 0, max: 2_500_000 },
  { slug: "2-5-3-5-trieu", label: "2,5 – 3,5 triệu", min: 2_500_000, max: 3_500_000 },
  { slug: "3-5-5-trieu", label: "3,5 – 5 triệu", min: 3_500_000, max: 5_000_000 },
  { slug: "tren-5-trieu", label: "Trên 5 triệu", min: 5_000_000, max: Number.MAX_SAFE_INTEGER },
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
