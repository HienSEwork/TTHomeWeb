// Shapes mirror the listing-service records (ProjectResponse, RoomResponse, MediaLinkResponse, AmenityResponse).

export type Paged<T> = { items: T[]; page: number; size: number; total: number };

export type Project = {
  id: string;
  code: string;
  name: string;
  slug: string;
  streetAddress: string | null;
  wardId: number | null;
  wardNewId: number | null;
  districtId: number | null;
  lat: number | null;
  lng: number | null;
  ownerUserId: string | null;
  managerUserId: string | null;
  exclusive: boolean;
  petPolicy: string;
  evParking: boolean;
  freeHours: boolean | null;
  maxGuestsNote: string | null;
  houseRules: string | null;
  feeElectric: number | null;
  feeWater: number | null;
  feeService: number | null;
  feeParking: number | null;
  feeNote: string | null;
  description: string | null;
  coverAssetId: string | null;
  videoAssetId: string | null;
  status: string;
  vacantCount: number;
  totalRooms: number;
  minPrice: number | null;
  amenityIds: number[];
};

export type Room = {
  id: string;
  projectId: string;
  code: string;
  title: string;
  slug: string;
  roomType: string;
  floor: number | null;
  areaM2: number | null;
  price: number | null;
  priceInclUtility: boolean;
  deposit: number | null;
  furniture: string | null;
  hasBalcony: boolean | null;
  hasWindow: boolean | null;
  maxOccupants: number | null;
  status: string;
  availableFrom: string | null;
  promo: boolean;
  promoNote: string | null;
  coverAssetId: string | null;
  amenityIds: number[];
};

export type MediaLink = { assetId: string; kind: string; sortOrder: number; cover: boolean };

export type Amenity = { id: number; code: string; name: string; scope: string; icon: string | null; sortOrder: number; filter: boolean };

export const PROJECT_STATUS: Record<string, string> = {
  active: "Đang hiển thị",
  hidden: "Đang ẩn",
  closed: "Đã đóng",
};
export const PROJECT_TONE: Record<string, "ok" | "neutral" | "warn"> = { active: "ok", hidden: "neutral", closed: "warn" };

export const ROOM_STATUS: Record<string, string> = {
  available: "Còn trống",
  reserved: "Đã giữ chỗ",
  rented: "Đã thuê",
  hidden: "Đang ẩn",
};

export const ROOM_TYPE: Record<string, string> = {
  studio: "Studio",
  duplex: "Duplex",
  "1pn": "1 phòng ngủ",
  "2pn": "2 phòng ngủ",
  "3pn": "3 phòng ngủ",
  shared: "Ở ghép",
  dorm: "Ký túc xá",
  room: "Phòng đơn",
};

export const PET_POLICY: Record<string, string> = {
  none: "Không nuôi thú cưng",
  cat: "Chỉ nuôi mèo",
  small_pet: "Thú cưng nhỏ",
  ask_owner: "Hỏi chủ nhà",
  allowed: "Cho phép",
};

export const FURNITURE: Record<string, string> = { full: "Đầy đủ", basic: "Cơ bản", none: "Không có" };

export const MEDIA_KIND: Record<string, string> = { photo: "Ảnh", video: "Video", floorplan: "Mặt bằng", "360": "Ảnh 360" };

// Whole dong with thousands separators; a missing value is a dash.
export const dong = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("vi-VN"));

// Query string without empty values.
export function qs(params: Record<string, string | number | undefined>) {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") out.set(k, String(v));
  return out.toString();
}
