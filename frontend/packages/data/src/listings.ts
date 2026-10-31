import { slugify } from "@tthome/ui";
import { findCity, TODAY } from "./catalog";
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
  city: "ho-chi-minh" | "can-tho";
  /** The ward's official name on the post-2025 map; resolved to its slug when the projects are built. */
  ward: string;
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
    code: "A1C3F2", name: "Nhà Mây Mậu Thân", street: "45/12 Mậu Thân", city: "can-tho", ward: "Phường Ninh Kiều",
    lat: 10.0312, lng: 105.7738, basePrice: 3_600_000, types: ["studio", "1pn"], rooms: 7, exclusive: true, pet: "cat", ev: true,
    amenities: ["elevator", "fingerprint", "security", "free_hours", "cleaning"], floors: 6, ageDays: 12, views: 4210,
    blurb: "Tòa 6 tầng trong hẻm xe hơi, đi bộ 5 phút tới cổng chính Đại học Cần Thơ. Phòng có cửa sổ lớn đón nắng sáng, bếp riêng và máy giặt riêng.",
  },
  {
    code: "B7E410", name: "Hẻm 132 Ba Mươi Tháng Tư", street: "132/7 Đường 30 Tháng 4", city: "can-tho", ward: "Phường Ninh Kiều",
    lat: 10.0258, lng: 105.7752, basePrice: 2_800_000, types: ["studio", "room"], rooms: 6, pet: "ask_owner",
    amenities: ["fingerprint", "shared_washer", "free_hours", "rooftop"], floors: 5, ageDays: 40, views: 2980,
    blurb: "Nhà phố cải tạo trong hẻm yên tĩnh sau Vincom Xuân Khánh. Sân thượng có chỗ phơi đồ và ngồi hóng gió buổi tối.",
  },
  {
    code: "C2D9A8", name: "Căn hộ dịch vụ Trần Văn Hoài", street: "88 Trần Văn Hoài", city: "can-tho", ward: "Phường Ninh Kiều",
    lat: 10.0259, lng: 105.7718, basePrice: 4_500_000, types: ["1pn", "duplex"], rooms: 5, exclusive: true, ev: true,
    promo: "Giảm 50% tháng đầu", amenities: ["elevator", "fingerprint", "parking", "security", "cleaning"], floors: 8, ageDays: 8, views: 5320,
    blurb: "Căn hộ dịch vụ cách khu II Đại học Cần Thơ 600 m. Có thang máy, hầm xe, lễ tân buổi tối và dọn phòng mỗi tuần.",
  },
  {
    code: "D4B1C7", name: "Garden House Hưng Lợi", street: "18 Đường số 7, KDC 91B", city: "can-tho", ward: "Phường Tân An",
    lat: 10.0176, lng: 105.7582, basePrice: 3_400_000, types: ["studio", "1pn", "2pn"], rooms: 8, pet: "allowed", ev: true,
    amenities: ["elevator", "parking", "security", "rooftop", "fingerprint"], floors: 7, ageDays: 20, views: 6140,
    blurb: "Trong khu dân cư 91B, gần Bệnh viện Đa khoa Trung ương. Sân vườn tầng trệt, cho nuôi chó mèo, hầm xe có ổ sạc xe điện.",
  },
  {
    code: "E9F0B3", name: "Nhà Lá An Khánh", street: "77/14 Nguyễn Văn Cừ", city: "can-tho", ward: "Phường Tân An",
    lat: 10.0318, lng: 105.7541, basePrice: 2_700_000, types: ["room", "studio"], rooms: 6, pet: "cat",
    promo: "Tặng 1 tháng phí dịch vụ", amenities: ["shared_washer", "free_hours", "fingerprint"], floors: 4, ageDays: 65, views: 1890,
    blurb: "Phòng giá mềm cho sinh viên Y Dược và Đại học Cần Thơ. Xe buýt số 1 dừng ngay đầu hẻm.",
  },
  {
    code: "F1A6D5", name: "Studio Y Dược", street: "35/2 Nguyễn Văn Cừ nối dài", city: "can-tho", ward: "Phường Tân An",
    lat: 10.0355, lng: 105.7568, basePrice: 2_600_000, types: ["studio", "room"], rooms: 7,
    amenities: ["elevator", "fingerprint", "shared_washer", "security"], floors: 6, ageDays: 30, views: 4460,
    blurb: "Đi bộ 4 phút tới cổng Đại học Y Dược Cần Thơ. Phòng ở ghép có giường tầng riêng tư và tủ khóa cá nhân.",
  },
  {
    code: "G3C8E1", name: "Nhà Xanh Ba Tháng Hai", street: "460/7 Đường 3 Tháng 2", city: "can-tho", ward: "Phường Tân An",
    lat: 10.0225, lng: 105.7652, basePrice: 2_600_000, types: ["room"], rooms: 6, pet: "none",
    amenities: ["shared_washer", "free_hours", "security"], floors: 5, ageDays: 90, views: 2210,
    blurb: "Ký túc xá và phòng trọ giá từ 2 triệu, đối diện khu II Đại học Cần Thơ. Điện nước tính theo giá nhà nước.",
  },
  {
    code: "H5D2F9", name: "The Nest Tân An", street: "33 Phan Đình Phùng", city: "can-tho", ward: "Phường Ninh Kiều",
    lat: 10.0328, lng: 105.7858, basePrice: 3_900_000, types: ["studio", "1pn"], rooms: 7, exclusive: true, pet: "small_pet",
    promo: "Miễn phí gửi xe 3 tháng", amenities: ["elevator", "fingerprint", "parking", "rooftop"], floors: 6, ageDays: 5, views: 3870,
    blurb: "Giữa trung tâm Ninh Kiều, đi bộ 5 phút ra Bến Ninh Kiều và chợ đêm. Sân thượng có khu giặt sấy và bàn làm việc chung.",
  },
  {
    code: "J8A4C2", name: "Riverside Cái Khế", street: "92 Trần Văn Khéo", city: "can-tho", ward: "Phường Cái Khế",
    lat: 10.0462, lng: 105.7842, basePrice: 4_600_000, types: ["1pn", "2pn", "duplex"], rooms: 6, ev: true, pet: "allowed",
    amenities: ["elevator", "parking", "security", "cleaning", "fingerprint"], floors: 9, ageDays: 14, views: 5980,
    blurb: "Nhìn ra sông Hậu, cách cầu đi bộ Ninh Kiều 1,5 km. Có ban công và máy giặt sấy riêng ở mọi căn.",
  },
  {
    code: "K2E7B4", name: "Hẻm Xanh An Hòa", street: "120/5 Cách Mạng Tháng 8", city: "can-tho", ward: "Phường Cái Khế",
    lat: 10.0489, lng: 105.7748, basePrice: 2_600_000, types: ["room", "studio"], rooms: 5,
    amenities: ["fingerprint", "shared_washer", "free_hours"], floors: 4, ageDays: 50, views: 1640,
    blurb: "Phòng trọ mới sơn sửa, gần chợ An Hòa. Giờ giấc tự do, khóa vân tay từng phòng.",
  },
  {
    code: "L6B3D8", name: "An Cư House", street: "28 Nguyễn Thị Minh Khai", city: "can-tho", ward: "Phường Ninh Kiều",
    lat: 10.0386, lng: 105.7801, basePrice: 3_300_000, types: ["studio", "1pn"], rooms: 6, pet: "cat",
    promo: "Giảm 300 nghìn/tháng khi ký 12 tháng", amenities: ["elevator", "fingerprint", "security", "cleaning"], floors: 6, ageDays: 22, views: 3310,
    blurb: "Khu phố cũ yên tĩnh, nhiều quán cà phê và tiệm ăn đêm. Phòng có cửa sổ thoáng, đi bộ ra công viên Lưu Hữu Phước.",
  },
  {
    code: "M1C9A6", name: "Studio Nguyễn Văn Linh", street: "255/31 Nguyễn Văn Linh", city: "can-tho", ward: "Phường An Bình",
    lat: 10.0262, lng: 105.759, basePrice: 2_400_000, types: ["studio"], rooms: 5,
    amenities: ["fingerprint", "shared_washer", "free_hours"], floors: 5, ageDays: 75, views: 1980,
    blurb: "Studio gác lửng cho một người, cách Đại học FPT Cần Thơ 10 phút đi xe máy.",
  },
  {
    code: "N4F2E7", name: "Sky Garden Võ Văn Kiệt", street: "18 Võ Văn Kiệt", city: "can-tho", ward: "Phường Bình Thủy",
    lat: 10.0575, lng: 105.7618, basePrice: 3_700_000, types: ["1pn", "studio"], rooms: 6, exclusive: true, ev: true,
    amenities: ["elevator", "parking", "security", "rooftop", "fingerprint"], floors: 8, ageDays: 18, views: 2870,
    blurb: "Trên trục Võ Văn Kiệt, đi sân bay Cần Thơ khoảng 12 phút. Hầm xe rộng, có ổ sạc xe máy điện.",
  },
  {
    code: "P7D5B1", name: "Nhà trọ Trà Nóc", street: "102/9 Lê Hồng Phong", city: "can-tho", ward: "Phường Thới An Đông",
    lat: 10.1, lng: 105.705, basePrice: 2_500_000, types: ["room"], rooms: 6, pet: "none",
    amenities: ["shared_washer", "security"], floors: 4, ageDays: 110, views: 1420,
    blurb: "Phòng trọ giá tốt cho công nhân và kỹ sư Khu công nghiệp Trà Nóc, đi làm chưa tới 5 phút.",
  },
  {
    code: "Q3A8C4", name: "Bình Thủy Garden", street: "45 Bùi Hữu Nghĩa", city: "can-tho", ward: "Phường Bình Thủy",
    lat: 10.0706, lng: 105.7512, basePrice: 2_500_000, types: ["studio", "room"], rooms: 7, pet: "allowed",
    promo: "Giảm 500 nghìn tiền cọc", amenities: ["fingerprint", "parking", "free_hours", "shared_washer"], floors: 5, ageDays: 35, views: 2640,
    blurb: "Gần nhà cổ Bình Thủy, khu dân cư yên tĩnh. Cho nuôi chó mèo, có sân trước rộng.",
  },
  {
    code: "R9E1F3", name: "Hưng Phú Loft", street: "14 Đường số 22, KDC Hưng Phú 1", city: "can-tho", ward: "Phường Hưng Phú",
    lat: 10.018, lng: 105.785, basePrice: 4_800_000, types: ["duplex", "1pn", "2pn"], rooms: 5, exclusive: true, ev: true, pet: "allowed",
    amenities: ["elevator", "parking", "security", "cleaning", "rooftop"], floors: 6, ageDays: 3, views: 4720,
    blurb: "Duplex trần cao trong khu đô thị Nam Cần Thơ, sân thượng có hồ bơi nhỏ. Qua cầu Hưng Lợi về trung tâm Ninh Kiều 10 phút.",
  },
  {
    code: "S2B6D9", name: "Ký túc xá Cái Răng", street: "8 Trần Chiên", city: "can-tho", ward: "Phường Cái Răng",
    lat: 10.001, lng: 105.7625, basePrice: 2_700_000, types: ["room"], rooms: 8, pet: "none",
    promo: "Miễn phí tháng đầu cho tân sinh viên", amenities: ["shared_washer", "security", "free_hours"], floors: 5, ageDays: 28, views: 3990,
    blurb: "Ký túc xá tư nhân gần chợ nổi Cái Răng, có phòng tự học và căng tin. Xe buýt về Đại học Cần Thơ dừng trước cửa.",
  },
  {
    code: "T5C4A2", name: "Sense City Residence", street: "240 Đại lộ Hòa Bình", city: "can-tho", ward: "Phường Ninh Kiều",
    lat: 10.0352, lng: 105.7822, basePrice: 4_200_000, types: ["studio", "1pn"], rooms: 6, ev: true,
    amenities: ["elevator", "parking", "fingerprint", "security"], floors: 7, ageDays: 45, views: 2350,
    blurb: "Đối diện Sense City, đi bộ ra Bến Ninh Kiều 7 phút. Phù hợp người đi làm ở khu trung tâm.",
  },
  {
    code: "U8D3E6", name: "Ô Môn Home", street: "33 Đường 26 Tháng 3", city: "can-tho", ward: "Phường Ô Môn",
    lat: 10.11, lng: 105.6215, basePrice: 2_400_000, types: ["room", "studio"], rooms: 6, pet: "cat",
    amenities: ["shared_washer", "free_hours", "parking"], floors: 4, ageDays: 60, views: 1270,
    blurb: "Phòng trọ mới gần chợ Ô Môn và các nhà máy điện Ô Môn, giá từ 2 triệu.",
  },
  {
    code: "V4E2A9", name: "Vườn Mỹ Khánh House", street: "12 Lộ Vòng Cung", city: "can-tho", ward: "Phường An Bình",
    lat: 9.9985, lng: 105.72, basePrice: 2_600_000, types: ["room", "studio"], rooms: 5, pet: "allowed",
    amenities: ["parking", "free_hours", "shared_washer"], floors: 3, ageDays: 52, views: 1180,
    blurb: "Nhà vườn yên tĩnh trên Lộ Vòng Cung, cách Đại học FPT Cần Thơ 3 km. Có sân rộng và chỗ để xe miễn phí.",
  },
  // TP. Hồ Chí Minh, including the former Bình Dương and Bà Rịa – Vũng Tàu.
  {
    code: "HA1B20", name: "Saigon Loft Bến Thành", street: "68/4 Lê Thị Riêng", city: "ho-chi-minh", ward: "Phường Bến Thành",
    lat: 10.7712, lng: 106.6929, basePrice: 7_800_000, types: ["studio", "1pn", "duplex"], rooms: 6, exclusive: true, ev: true,
    amenities: ["elevator", "fingerprint", "security", "cleaning", "free_hours"], floors: 8, ageDays: 6, views: 7120,
    blurb: "Giữa trung tâm, đi bộ 5 phút tới chợ Bến Thành và ga metro Bến Thành. Studio có cửa sổ lớn, dọn phòng hằng tuần.",
  },
  {
    code: "HB2C31", name: "Nhà Tân Định Hai Bà Trưng", street: "215/9 Hai Bà Trưng", city: "ho-chi-minh", ward: "Phường Tân Định",
    lat: 10.7886, lng: 106.6905, basePrice: 6_200_000, types: ["studio", "1pn"], rooms: 7, pet: "cat",
    promo: "Giảm 50% tháng đầu", amenities: ["elevator", "fingerprint", "security", "rooftop"], floors: 7, ageDays: 15, views: 5480,
    blurb: "Trong hẻm yên tĩnh gần chợ Tân Định, nhiều quán ăn và cà phê. Sân thượng có khu phơi đồ và ghế ngồi buổi tối.",
  },
  {
    code: "HC3D42", name: "Căn hộ Xuân Hòa Võ Văn Tần", street: "120 Võ Văn Tần", city: "ho-chi-minh", ward: "Phường Xuân Hòa",
    lat: 10.7764, lng: 106.6889, basePrice: 8_500_000, types: ["1pn", "2pn", "apartment"], rooms: 6, ev: true,
    amenities: ["elevator", "parking", "fingerprint", "security", "cleaning"], floors: 10, ageDays: 22, views: 4890,
    blurb: "Căn hộ dịch vụ ở Quận 3 cũ, gần Đại học Kinh tế (UEH) cơ sở A. Có hầm xe, lễ tân và máy giặt riêng trong căn.",
  },
  {
    code: "HD4E53", name: "Nhà nguyên căn Bàn Cờ", street: "84/12 Nguyễn Đình Chiểu", city: "ho-chi-minh", ward: "Phường Bàn Cờ",
    lat: 10.7717, lng: 106.6822, basePrice: 9_500_000, types: ["house"], rooms: 3, pet: "allowed",
    amenities: ["parking", "free_hours", "security"], floors: 4, ageDays: 34, views: 2310,
    blurb: "Nhà phố 4 tầng trong hẻm xe hơi, hợp nhóm bạn hoặc gia đình nhỏ. Cho nuôi thú cưng, giờ giấc tự do.",
  },
  {
    code: "HE5F64", name: "Gia Định Garden", street: "45/6 Phan Đăng Lưu", city: "ho-chi-minh", ward: "Phường Gia Định",
    lat: 10.8024, lng: 106.6957, basePrice: 5_200_000, types: ["room", "studio", "duplex"], rooms: 8, pet: "small_pet",
    amenities: ["fingerprint", "shared_washer", "free_hours", "rooftop"], floors: 6, ageDays: 9, views: 6210,
    blurb: "Gần chợ Bà Chiểu và Đại học Văn Lang cơ sở 1. Duplex có gác cao, phòng trọ giá mềm cho sinh viên.",
  },
  {
    code: "HF6A75", name: "Thạnh Mỹ Tây Riverside", street: "22 Nguyễn Hữu Cảnh", city: "ho-chi-minh", ward: "Phường Thạnh Mỹ Tây",
    lat: 10.7935, lng: 106.7175, basePrice: 9_800_000, types: ["1pn", "2pn", "apartment"], rooms: 6, exclusive: true, ev: true, pet: "allowed",
    amenities: ["elevator", "parking", "security", "cleaning", "rooftop"], floors: 18, ageDays: 4, views: 8030,
    blurb: "Chung cư ven sông Sài Gòn, nhìn ra Landmark 81. Có hồ bơi tầng thượng, hầm xe có ổ sạc xe điện.",
  },
  {
    code: "HG7B86", name: "Studio Phan Xích Long", street: "12/3 Phan Xích Long", city: "ho-chi-minh", ward: "Phường Cầu Kiệu",
    lat: 10.8003, lng: 106.6867, basePrice: 6_500_000, types: ["studio", "1pn"], rooms: 7,
    promo: "Miễn phí gửi xe 3 tháng", amenities: ["elevator", "fingerprint", "security", "cleaning"], floors: 7, ageDays: 18, views: 4370,
    blurb: "Ngay khu ẩm thực Phan Xích Long, đi sân bay Tân Sơn Nhất khoảng 15 phút. Studio đủ nội thất, có bếp riêng.",
  },
  {
    code: "HH8C97", name: "Nhà Mây Cộng Hòa", street: "38 Cộng Hòa", city: "ho-chi-minh", ward: "Phường Tân Sơn Nhất",
    lat: 10.8017, lng: 106.6536, basePrice: 5_800_000, types: ["studio", "duplex"], rooms: 8, pet: "cat",
    amenities: ["elevator", "fingerprint", "parking", "free_hours"], floors: 7, ageDays: 27, views: 3960,
    blurb: "Trên trục Cộng Hòa, gần Etown và sân bay. Hợp người đi làm văn phòng, có thang máy và hầm xe.",
  },
  {
    code: "HJ9D08", name: "Phòng trọ Bảy Hiền", street: "102/15 Âu Cơ", city: "ho-chi-minh", ward: "Phường Bảy Hiền",
    lat: 10.7924, lng: 106.6452, basePrice: 3_900_000, types: ["room", "studio"], rooms: 7,
    amenities: ["fingerprint", "shared_washer", "free_hours"], floors: 5, ageDays: 48, views: 2780,
    blurb: "Phòng trọ giá tốt gần chợ Tân Bình. Khóa vân tay, giờ giấc tự do.",
  },
  {
    code: "HK1E19", name: "Gò Vấp Home Quang Trung", street: "520/7 Quang Trung", city: "ho-chi-minh", ward: "Phường Gò Vấp",
    lat: 10.8357, lng: 106.6658, basePrice: 4_400_000, types: ["room", "studio", "duplex"], rooms: 8, pet: "ask_owner",
    promo: "Giảm 300 nghìn/tháng khi ký 12 tháng", amenities: ["fingerprint", "parking", "shared_washer", "security"], floors: 5, ageDays: 12, views: 5130,
    blurb: "Gần Đại học Công nghiệp và Văn Lang cơ sở 3. Duplex có gác, nhiều quán ăn sinh viên quanh hẻm.",
  },
  {
    code: "HL2F2A", name: "Tân Mỹ Sky Studio", street: "35 Nguyễn Thị Thập", city: "ho-chi-minh", ward: "Phường Tân Mỹ",
    lat: 10.7385, lng: 106.7072, basePrice: 7_200_000, types: ["studio", "1pn", "apartment"], rooms: 6, ev: true,
    amenities: ["elevator", "parking", "fingerprint", "security", "cleaning"], floors: 9, ageDays: 20, views: 4620,
    blurb: "Quận 7 cũ, gần Lotte Mart và Đại học Tôn Đức Thắng. Có thang máy, hầm xe và lễ tân buổi tối.",
  },
  {
    code: "HM3A3B", name: "Mặt tiền Sư Vạn Hạnh", street: "245 Sư Vạn Hạnh", city: "ho-chi-minh", ward: "Phường Hòa Hưng",
    lat: 10.7745, lng: 106.6686, basePrice: 18_000_000, types: ["shophouse"], rooms: 2,
    amenities: ["parking", "security"], floors: 3, ageDays: 11, views: 1980,
    blurb: "Mặt tiền 4,5 m gần Vạn Hạnh Mall, hợp mở quán cà phê, cửa hàng hoặc văn phòng nhỏ. Có lầu ở lại.",
  },
  {
    code: "HN4B4C", name: "Thảo Điền Garden House", street: "16 Đường số 10", city: "ho-chi-minh", ward: "Phường An Khánh",
    lat: 10.8043, lng: 106.7356, basePrice: 9_200_000, types: ["1pn", "2pn", "house"], rooms: 5, exclusive: true, pet: "allowed", ev: true,
    amenities: ["parking", "security", "cleaning", "rooftop", "fingerprint"], floors: 4, ageDays: 7, views: 6650,
    blurb: "Khu Thảo Điền yên tĩnh, có sân vườn và cho nuôi thú cưng. Gần ga metro Thảo Điền và nhiều trường quốc tế.",
  },
  {
    code: "HP5C5D", name: "Ký túc xá Làng Đại học", street: "18 Đường Hàn Thuyên", city: "ho-chi-minh", ward: "Phường Đông Hòa",
    lat: 10.8752, lng: 106.8006, basePrice: 2_400_000, types: ["room", "studio"], rooms: 8, pet: "none",
    promo: "Miễn phí tháng đầu cho tân sinh viên", amenities: ["shared_washer", "security", "free_hours"], floors: 5, ageDays: 25, views: 4410,
    blurb: "Cạnh Làng Đại học Quốc gia (Dĩ An cũ), đi bộ tới Đại học Bách Khoa cơ sở 2 và Khoa học Tự nhiên.",
  },
  {
    code: "HQ6D6E", name: "Dĩ An Studio", street: "56 Trần Hưng Đạo", city: "ho-chi-minh", ward: "Phường Dĩ An",
    lat: 10.9068, lng: 106.7695, basePrice: 3_200_000, types: ["room", "studio"], rooms: 7,
    amenities: ["fingerprint", "parking", "shared_washer"], floors: 4, ageDays: 41, views: 2190,
    blurb: "Gần chợ Dĩ An và các khu công nghiệp Sóng Thần. Phòng sạch, có chỗ để xe rộng.",
  },
  {
    code: "HR7E7F", name: "Thủ Dầu Một Residence", street: "88 Đại lộ Bình Dương", city: "ho-chi-minh", ward: "Phường Thủ Dầu Một",
    lat: 10.9805, lng: 106.6545, basePrice: 3_800_000, types: ["studio", "1pn", "house"], rooms: 6, pet: "cat",
    amenities: ["elevator", "parking", "security", "fingerprint"], floors: 6, ageDays: 30, views: 1870,
    blurb: "Trung tâm Thủ Dầu Một cũ, gần Đại học Thủ Dầu Một và Becamex Tower.",
  },
  {
    code: "HS8F80", name: "Vũng Tàu Sea Home", street: "21 Thùy Vân", city: "ho-chi-minh", ward: "Phường Vũng Tàu",
    lat: 10.3417, lng: 107.0921, basePrice: 5_500_000, types: ["studio", "1pn", "apartment"], rooms: 6, ev: true,
    amenities: ["elevator", "parking", "security", "cleaning"], floors: 9, ageDays: 16, views: 3340,
    blurb: "Cách Bãi Sau 200 m, căn hộ có ban công nhìn ra biển. Hợp ở dài hạn hoặc làm việc từ xa.",
  },
];

const ROOM_AMENITY_POOL = ["aircon", "water_heater", "fridge", "kitchen", "washer"];
const TYPE_PRICE_FACTOR: Record<RoomType, number> = {
  room: 0.85, studio: 1, duplex: 1.2, "1pn": 1.3, "2pn": 1.8, apartment: 1.9, house: 1, shophouse: 1,
};
const TYPE_AREA: Record<RoomType, [number, number]> = {
  room: [14, 22], studio: [22, 32], duplex: [28, 40], "1pn": [30, 42], "2pn": [48, 65], apartment: [55, 80], house: [60, 120], shophouse: [50, 100],
};

function buildRooms(seed: ProjectSeed, projectIndex: number, projectId: string): Room[] {
  const rand = seeded(projectIndex * 97 + 13);
  const rooms: Room[] = [];
  for (let i = 0; i < seed.rooms; i += 1) {
    const type = seed.types[i % seed.types.length] as RoomType;
    const floor = 1 + Math.floor(rand() * seed.floors);
    const [aMin, aMax] = TYPE_AREA[type];
    const area = Math.round(aMin + rand() * (aMax - aMin));
    // Nothing is listed below 2 triệu.
    const price = Math.max(2_000_000, Math.round((seed.basePrice * TYPE_PRICE_FACTOR[type] * (0.92 + rand() * 0.2)) / 100_000) * 100_000);
    const roll = rand();
    const status: RoomStatus = roll < 0.62 ? "available" : roll < 0.74 ? "reserved" : roll < 0.95 ? "rented" : "hidden";
    const furniture: Furniture = type === "shophouse" ? "none" : rand() < 0.75 ? "full" : rand() < 0.6 ? "basic" : "none";
    const amenityCount = type === "room" ? 2 : 3 + Math.floor(rand() * 3);
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
      hasBalcony: rand() < (type === "room" ? 0.15 : 0.45),
      maxPeople: type === "house" || type === "shophouse" ? 6 : type === "2pn" || type === "apartment" ? 4 : 2,
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

function wardSlugOf(seed: ProjectSeed): string {
  const ward = findCity(seed.city)?.wards.find((w) => w.name === seed.ward);
  if (!ward) throw new Error(`Unknown ward "${seed.ward}" for project ${seed.code}`);
  return ward.slug;
}

export const PROJECTS: Project[] = SEEDS.map((seed, index) => {
  const id = `prj-${seed.code.toLowerCase()}`;
  const createdAt = addDays(TODAY, -seed.ageDays);
  return {
    id,
    code: seed.code,
    slug: `${slugify(seed.name)}-PRJ-${seed.code}`,
    name: seed.name,
    street: seed.street,
    wardSlug: wardSlugOf(seed),
    citySlug: seed.city,
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
