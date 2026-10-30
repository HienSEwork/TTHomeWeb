import { slugify } from "@tthome/ui";
import { TODAY } from "./catalog";
import type { Furniture, PetPolicy, Project, Room, RoomStatus, RoomType } from "./types";

const PHOTO_IDS = [
  "1616486338812-3dadae4b4ace",
  "1615874959474-d609969a20ed",
  "1600607687939-ce8a6c25118c",
  "1616486029423-aaa4789e8c9a",
  "1522708323590-d24dbb6b0267",
  "1502672260266-1c1ef2d93688",
  "1505691938895-1758d7feb511",
  "1493809842364-78817add7ffb",
  "1560448204-e02f11c3d0e2",
  "1484154218962-a197022b5858",
  "1554995207-c18c203602cb",
  "1586023492125-27b2c045efd7",
  "1598928506311-c55ded91a20c",
  "1631049307264-da0ec9d70304",
  "1595526114035-0d45ed16cfbf",
  "1540518614846-7eded433c457",
  "1536376072261-38c75010e6c9",
  "1617806118233-18e1de247200",
  "1600210492486-724fe5c67fb0",
  "1556020685-ae41abfc9365",
];

/** Stand-in photos until Cloudinary assets are wired. */
export function photo(index: number, width = 960): string {
  const id = PHOTO_IDS[((index % PHOTO_IDS.length) + PHOTO_IDS.length) % PHOTO_IDS.length];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;
}

/** Small deterministic PRNG so every render produces the same data. */
function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

type ProjectSeed = {
  code: string;
  name: string;
  street: string;
  ward: string;
  district: string;
  lat: number;
  lng: number;
  basePrice: number;
  types: RoomType[];
  rooms: number;
  exclusive?: boolean;
  pet?: PetPolicy;
  ev?: boolean;
  promo?: string;
  amenities: string[];
  floors: number;
  blurb: string;
  ageDays: number;
  views: number;
};

const SEEDS: ProjectSeed[] = [
  {
    code: "A1C3F2", name: "Nhà Mây Mậu Thân", street: "45/12 Mậu Thân", ward: "xuan-khanh", district: "ninh-kieu",
    lat: 10.0312, lng: 105.7738, basePrice: 3_600_000, types: ["studio", "1pn"], rooms: 7, exclusive: true, pet: "cat", ev: true,
    amenities: ["elevator", "fingerprint", "security", "free_hours", "cleaning"], floors: 6, ageDays: 12, views: 4210,
    blurb: "Tòa 6 tầng trong hẻm xe hơi, đi bộ 5 phút tới cổng chính Đại học Cần Thơ. Phòng có cửa sổ lớn đón nắng sáng, bếp riêng và máy giặt riêng.",
  },
  {
    code: "B7E410", name: "Hẻm 132 Ba Mươi Tháng Tư", street: "132/7 Đường 30 Tháng 4", ward: "xuan-khanh", district: "ninh-kieu",
    lat: 10.0258, lng: 105.7752, basePrice: 2_800_000, types: ["studio", "room"], rooms: 6, pet: "ask_owner",
    amenities: ["fingerprint", "shared_washer", "free_hours", "rooftop"], floors: 5, ageDays: 40, views: 2980,
    blurb: "Nhà phố cải tạo trong hẻm yên tĩnh sau Vincom Xuân Khánh. Sân thượng có chỗ phơi đồ và ngồi hóng gió buổi tối.",
  },
  {
    code: "C2D9A8", name: "Căn hộ dịch vụ Trần Văn Hoài", street: "88 Trần Văn Hoài", ward: "xuan-khanh", district: "ninh-kieu",
    lat: 10.0242, lng: 105.7688, basePrice: 4_500_000, types: ["1pn", "duplex"], rooms: 5, exclusive: true, ev: true,
    promo: "Giảm 50% tháng đầu", amenities: ["elevator", "fingerprint", "parking", "security", "cleaning"], floors: 8, ageDays: 8, views: 5320,
    blurb: "Căn hộ dịch vụ cách khu II Đại học Cần Thơ 600 m. Có thang máy, hầm xe, lễ tân buổi tối và dọn phòng mỗi tuần.",
  },
  {
    code: "D4B1C7", name: "Garden House Hưng Lợi", street: "18 Đường số 7, KDC 91B", ward: "hung-loi", district: "ninh-kieu",
    lat: 10.0176, lng: 105.7582, basePrice: 3_400_000, types: ["studio", "1pn", "2pn"], rooms: 8, pet: "allowed", ev: true,
    amenities: ["elevator", "parking", "security", "rooftop", "fingerprint"], floors: 7, ageDays: 20, views: 6140,
    blurb: "Trong khu dân cư 91B, gần Bệnh viện Đa khoa Trung ương. Sân vườn tầng trệt, cho nuôi chó mèo, hầm xe có ổ sạc xe điện.",
  },
  {
    code: "E9F0B3", name: "Nhà Lá An Khánh", street: "77/14 Nguyễn Văn Cừ", ward: "an-khanh", district: "ninh-kieu",
    lat: 10.0318, lng: 105.7541, basePrice: 2_300_000, types: ["room", "studio"], rooms: 6, pet: "cat",
    promo: "Tặng 1 tháng phí dịch vụ", amenities: ["shared_washer", "free_hours", "fingerprint"], floors: 4, ageDays: 65, views: 1890,
    blurb: "Phòng giá mềm cho sinh viên Y Dược và Đại học Cần Thơ. Xe buýt số 1 dừng ngay đầu hẻm.",
  },
  {
    code: "F1A6D5", name: "Studio Y Dược", street: "35/2 Nguyễn Văn Cừ nối dài", ward: "an-khanh", district: "ninh-kieu",
    lat: 10.0355, lng: 105.7568, basePrice: 2_600_000, types: ["studio", "shared"], rooms: 7,
    amenities: ["elevator", "fingerprint", "shared_washer", "security"], floors: 6, ageDays: 30, views: 4460,
    blurb: "Đi bộ 4 phút tới cổng Đại học Y Dược Cần Thơ. Phòng ở ghép có giường tầng riêng tư và tủ khóa cá nhân.",
  },
  {
    code: "G3C8E1", name: "Nhà Xanh Ba Tháng Hai", street: "460/7 Đường 3 Tháng 2", ward: "hung-loi", district: "ninh-kieu",
    lat: 10.0225, lng: 105.7652, basePrice: 1_900_000, types: ["room", "dorm"], rooms: 6, pet: "none",
    amenities: ["shared_washer", "free_hours", "security"], floors: 5, ageDays: 90, views: 2210,
    blurb: "Ký túc xá và phòng trọ giá dưới 2,5 triệu, đối diện khu II Đại học Cần Thơ. Điện nước tính theo giá nhà nước.",
  },
  {
    code: "H5D2F9", name: "The Nest Tân An", street: "33 Phan Đình Phùng", ward: "tan-an", district: "ninh-kieu",
    lat: 10.0328, lng: 105.7858, basePrice: 3_900_000, types: ["studio", "1pn"], rooms: 7, exclusive: true, pet: "small_pet",
    promo: "Miễn phí gửi xe 3 tháng", amenities: ["elevator", "fingerprint", "parking", "rooftop"], floors: 6, ageDays: 5, views: 3870,
    blurb: "Giữa trung tâm Ninh Kiều, đi bộ 5 phút ra Bến Ninh Kiều và chợ đêm. Sân thượng có khu giặt sấy và bàn làm việc chung.",
  },
  {
    code: "J8A4C2", name: "Riverside Cái Khế", street: "92 Trần Văn Khéo", ward: "cai-khe", district: "ninh-kieu",
    lat: 10.0462, lng: 105.7842, basePrice: 4_600_000, types: ["1pn", "2pn", "duplex"], rooms: 6, ev: true, pet: "allowed",
    amenities: ["elevator", "parking", "security", "cleaning", "fingerprint"], floors: 9, ageDays: 14, views: 5980,
    blurb: "Nhìn ra sông Hậu, cách cầu đi bộ Ninh Kiều 1,5 km. Có ban công và máy giặt sấy riêng ở mọi căn.",
  },
  {
    code: "K2E7B4", name: "Hẻm Xanh An Hòa", street: "120/5 Cách Mạng Tháng 8", ward: "an-hoa", district: "ninh-kieu",
    lat: 10.0458, lng: 105.7688, basePrice: 2_200_000, types: ["room", "studio"], rooms: 5,
    amenities: ["fingerprint", "shared_washer", "free_hours"], floors: 4, ageDays: 50, views: 1640,
    blurb: "Phòng trọ mới sơn sửa, gần chợ An Hòa. Giờ giấc tự do, khóa vân tay từng phòng.",
  },
  {
    code: "L6B3D8", name: "An Cư House", street: "28 Nguyễn Thị Minh Khai", ward: "an-cu", district: "ninh-kieu",
    lat: 10.0386, lng: 105.7801, basePrice: 3_300_000, types: ["studio", "1pn"], rooms: 6, pet: "cat",
    promo: "Giảm 300 nghìn/tháng khi ký 12 tháng", amenities: ["elevator", "fingerprint", "security", "cleaning"], floors: 6, ageDays: 22, views: 3310,
    blurb: "Khu phố cũ yên tĩnh, nhiều quán cà phê và tiệm ăn đêm. Phòng có cửa sổ thoáng, đi bộ ra công viên Lưu Hữu Phước.",
  },
  {
    code: "M1C9A6", name: "Studio Nguyễn Văn Linh", street: "255/31 Nguyễn Văn Linh", ward: "an-binh", district: "ninh-kieu",
    lat: 10.0128, lng: 105.7468, basePrice: 2_400_000, types: ["studio"], rooms: 5,
    amenities: ["fingerprint", "shared_washer", "free_hours"], floors: 5, ageDays: 75, views: 1980,
    blurb: "Studio gác lửng cho một người, cách Đại học FPT Cần Thơ 10 phút đi xe máy.",
  },
  {
    code: "N4F2E7", name: "Sky Garden Võ Văn Kiệt", street: "18 Võ Văn Kiệt", ward: "an-thoi", district: "binh-thuy",
    lat: 10.0575, lng: 105.7618, basePrice: 3_700_000, types: ["1pn", "studio"], rooms: 6, exclusive: true, ev: true,
    amenities: ["elevator", "parking", "security", "rooftop", "fingerprint"], floors: 8, ageDays: 18, views: 2870,
    blurb: "Trên trục Võ Văn Kiệt, đi sân bay Cần Thơ khoảng 12 phút. Hầm xe rộng, có ổ sạc xe máy điện.",
  },
  {
    code: "P7D5B1", name: "Nhà trọ Trà Nóc", street: "102/9 Lê Hồng Phong", ward: "tra-noc", district: "binh-thuy",
    lat: 10.0872, lng: 105.7336, basePrice: 1_800_000, types: ["room", "shared"], rooms: 6, pet: "none",
    amenities: ["shared_washer", "security"], floors: 4, ageDays: 110, views: 1420,
    blurb: "Phòng trọ giá tốt cho công nhân và kỹ sư Khu công nghiệp Trà Nóc, đi làm chưa tới 5 phút.",
  },
  {
    code: "Q3A8C4", name: "Bình Thủy Garden", street: "45 Bùi Hữu Nghĩa", ward: "binh-thuy", district: "binh-thuy",
    lat: 10.0706, lng: 105.7512, basePrice: 2_500_000, types: ["studio", "room"], rooms: 7, pet: "allowed",
    promo: "Giảm 500 nghìn tiền cọc", amenities: ["fingerprint", "parking", "free_hours", "shared_washer"], floors: 5, ageDays: 35, views: 2640,
    blurb: "Gần nhà cổ Bình Thủy, khu dân cư yên tĩnh. Cho nuôi chó mèo, có sân trước rộng.",
  },
  {
    code: "R9E1F3", name: "Hưng Phú Loft", street: "14 Đường số 22, KDC Hưng Phú 1", ward: "hung-phu", district: "cai-rang",
    lat: 10.0118, lng: 105.7818, basePrice: 4_800_000, types: ["duplex", "1pn", "2pn"], rooms: 5, exclusive: true, ev: true, pet: "allowed",
    amenities: ["elevator", "parking", "security", "cleaning", "rooftop"], floors: 6, ageDays: 3, views: 4720,
    blurb: "Duplex trần cao trong khu đô thị Nam Cần Thơ, sân thượng có hồ bơi nhỏ. Qua cầu Hưng Lợi về trung tâm Ninh Kiều 10 phút.",
  },
  {
    code: "S2B6D9", name: "Ký túc xá Cái Răng", street: "8 Trần Chiên", ward: "le-binh", district: "cai-rang",
    lat: 10.0038, lng: 105.7642, basePrice: 1_500_000, types: ["dorm", "room", "shared"], rooms: 8, pet: "none",
    promo: "Miễn phí tháng đầu cho tân sinh viên", amenities: ["shared_washer", "security", "free_hours"], floors: 5, ageDays: 28, views: 3990,
    blurb: "Ký túc xá tư nhân gần chợ nổi Cái Răng, có phòng tự học và căng tin. Xe buýt về Đại học Cần Thơ dừng trước cửa.",
  },
  {
    code: "T5C4A2", name: "Sense City Residence", street: "240 Đại lộ Hòa Bình", ward: "tan-an", district: "ninh-kieu",
    lat: 10.0352, lng: 105.7822, basePrice: 4_200_000, types: ["studio", "1pn"], rooms: 6, ev: true,
    amenities: ["elevator", "parking", "fingerprint", "security"], floors: 7, ageDays: 45, views: 2350,
    blurb: "Đối diện Sense City, đi bộ ra Bến Ninh Kiều 7 phút. Phù hợp người đi làm ở khu trung tâm.",
  },
  {
    code: "U8D3E6", name: "Ô Môn Home", street: "33 Đường 26 Tháng 3", ward: "chau-van-liem", district: "o-mon",
    lat: 10.1112, lng: 105.6262, basePrice: 1_700_000, types: ["room", "studio"], rooms: 6, pet: "cat",
    amenities: ["shared_washer", "free_hours", "parking"], floors: 4, ageDays: 60, views: 1270,
    blurb: "Phòng trọ mới gần chợ Ô Môn và các nhà máy điện Ô Môn, giá dưới 2,5 triệu.",
  },
  {
    code: "V4E2A9", name: "Vườn Mỹ Khánh House", street: "12 Lộ Vòng Cung", ward: "my-khanh", district: "phong-dien",
    lat: 10.0142, lng: 105.7188, basePrice: 2_000_000, types: ["room", "studio"], rooms: 5, pet: "allowed",
    amenities: ["parking", "free_hours", "shared_washer"], floors: 3, ageDays: 52, views: 1180,
    blurb: "Nhà vườn yên tĩnh trên Lộ Vòng Cung, cách Đại học FPT Cần Thơ 3 km. Có sân rộng và chỗ để xe miễn phí.",
  },
];

const ROOM_AMENITY_POOL = ["aircon", "private_wc", "water_heater", "fridge", "kitchen", "washer"];
const TYPE_PRICE_FACTOR: Record<RoomType, number> = {
  dorm: 0.45, shared: 0.6, room: 0.85, studio: 1, "1pn": 1.25, duplex: 1.4, "2pn": 1.75, "3pn": 2.3,
};
const TYPE_AREA: Record<RoomType, [number, number]> = {
  dorm: [12, 20], shared: [18, 26], room: [14, 22], studio: [22, 32], "1pn": [30, 42], duplex: [32, 45], "2pn": [48, 65], "3pn": [70, 90],
};

function buildRooms(seed: ProjectSeed, projectIndex: number, projectId: string): Room[] {
  const rand = seeded(projectIndex * 97 + 13);
  const rooms: Room[] = [];
  for (let i = 0; i < seed.rooms; i += 1) {
    const type = seed.types[i % seed.types.length] as RoomType;
    const floor = 1 + Math.floor(rand() * seed.floors);
    const [aMin, aMax] = TYPE_AREA[type];
    const area = Math.round(aMin + rand() * (aMax - aMin));
    const price = Math.round((seed.basePrice * TYPE_PRICE_FACTOR[type] * (0.92 + rand() * 0.2)) / 100_000) * 100_000;
    const roll = rand();
    const status: RoomStatus = roll < 0.62 ? "available" : roll < 0.74 ? "reserved" : roll < 0.95 ? "rented" : "hidden";
    const furniture: Furniture = type === "dorm" ? "basic" : rand() < 0.75 ? "full" : rand() < 0.6 ? "basic" : "none";
    const amenityCount = type === "dorm" || type === "shared" ? 2 : 3 + Math.floor(rand() * 3);
    const number = `${floor}${String(i + 1).padStart(2, "0")}`;
    rooms.push({
      id: `${projectId}-r${i + 1}`,
      code: `${seed.code.slice(0, 3)}${number}`,
      projectId,
      name: `Phòng ${number}`,
      type,
      area,
      price,
      deposit: price,
      status,
      availableFrom: status === "available" ? (rand() < 0.6 ? TODAY : addDays(TODAY, Math.floor(rand() * 20))) : addDays(TODAY, 15 + Math.floor(rand() * 60)),
      floor,
      furniture,
      hasWindow: rand() < 0.8,
      hasBalcony: rand() < (type === "dorm" || type === "room" ? 0.15 : 0.45),
      maxPeople: type === "dorm" ? 6 : type === "shared" ? 3 : type === "2pn" ? 4 : 2,
      images: [photo(projectIndex * 3 + i), photo(projectIndex * 3 + i + 5), photo(projectIndex * 3 + i + 9), photo(projectIndex * 3 + i + 13)],
      amenities: ROOM_AMENITY_POOL.slice(0, amenityCount),
    });
  }
  return rooms;
}

const RULES = [
  "Khách đến chơi đăng ký với quản lý sau 22:00.",
  "Không hút thuốc trong phòng và hành lang.",
  "Giữ yên lặng sau 23:00.",
  "Báo trước 30 ngày khi trả phòng để được hoàn cọc đầy đủ.",
];

export const PROJECTS: Project[] = SEEDS.map((seed, index) => {
  const id = `prj-${seed.code.toLowerCase()}`;
  const createdAt = addDays(TODAY, -seed.ageDays);
  return {
    id,
    code: seed.code,
    slug: `${slugify(seed.name)}-PRJ-${seed.code}`,
    name: seed.name,
    street: seed.street,
    wardSlug: seed.ward,
    districtSlug: seed.district,
    lat: seed.lat,
    lng: seed.lng,
    images: [0, 4, 7, 11, 15].map((offset) => photo(index + offset, 1400)),
    hasVideo: index % 3 === 0,
    exclusive: seed.exclusive ?? false,
    petPolicy: seed.pet ?? "none",
    evParking: seed.ev ?? false,
    promo: seed.promo ?? null,
    amenities: seed.amenities,
    description: seed.blurb,
    rules: RULES,
    fees: {
      electric: seed.basePrice > 4_000_000 ? 3_800 : 3_500,
      water: 80_000,
      service: seed.basePrice > 4_000_000 ? 200_000 : 100_000,
      parking: seed.amenities.includes("parking") ? 100_000 : 50_000,
    },
    status: "active",
    views: seed.views,
    createdAt,
    updatedAt: addDays(TODAY, -Math.min(seed.ageDays, index % 4)),
    rooms: buildRooms(seed, index, id),
  };
});
