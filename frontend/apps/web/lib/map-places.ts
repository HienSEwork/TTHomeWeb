import { LANDMARKS, type LandmarkKind } from "@tthome/data";

/** Well-known places shown on the search map so visitors can judge where an area is. */
export type PlaceKind = "school" | "hospital" | "shopping" | "store" | "pharmacy" | "landmark";

export type MapPlace = { name: string; kind: PlaceKind; lat: number; lng: number };

/**
 * Positions come from OpenStreetMap (checked October 2026) and are kept here for the demo; names are written out
 * in full. Chains list a few real branches near the listed buildings, named by their street.
 */
const HAND_PICKED: MapPlace[] = [
  { kind: "school", name: "Trường Đại học Cần Thơ", lat: 10.0322, lng: 105.7683 },
  { kind: "school", name: "Trường Đại học Y Dược Cần Thơ", lat: 10.036, lng: 105.7522 },
  { kind: "school", name: "Trường Đại học FPT Cần Thơ", lat: 10.0126, lng: 105.7326 },
  { kind: "school", name: "Trường Đại học Nam Cần Thơ", lat: 10.0056, lng: 105.7223 },
  { kind: "school", name: "Trường Đại học Tây Đô", lat: 9.9996, lng: 105.7603 },

  { kind: "hospital", name: "Bệnh viện Nhi Đồng Thành phố Cần Thơ", lat: 10.0167, lng: 105.739 },
  { kind: "hospital", name: "Bệnh viện Đa khoa Trung ương Cần Thơ", lat: 10.0287, lng: 105.7556 },
  { kind: "hospital", name: "Bệnh viện Đa khoa Thành phố Cần Thơ", lat: 10.0305, lng: 105.7823 },
  { kind: "hospital", name: "Bệnh viện Phụ sản Thành phố Cần Thơ", lat: 10.0501, lng: 105.7765 },

  { kind: "shopping", name: "Vincom Plaza Xuân Khánh", lat: 10.0247, lng: 105.7748 },
  { kind: "shopping", name: "Vincom Plaza Hùng Vương", lat: 10.0457, lng: 105.7793 },
  { kind: "shopping", name: "Sense City Cần Thơ", lat: 10.0345, lng: 105.7857 },
  { kind: "shopping", name: "Lotte Mart Cần Thơ", lat: 10.0424, lng: 105.7668 },
  { kind: "shopping", name: "GO! Cần Thơ", lat: 10.014, lng: 105.7828 },
  { kind: "shopping", name: "Chợ Xuân Khánh", lat: 10.0267, lng: 105.7769 },

  { kind: "store", name: "Circle K 3 Tháng 2", lat: 10.0248, lng: 105.768 },
  { kind: "store", name: "Circle K Mậu Thân", lat: 10.0296, lng: 105.7764 },
  { kind: "store", name: "Circle K 30 Tháng 4", lat: 10.0218, lng: 105.7705 },
  { kind: "store", name: "Circle K Lý Tự Trọng", lat: 10.0342, lng: 105.7796 },
  { kind: "store", name: "Bách Hóa Xanh Nguyễn Văn Cừ", lat: 10.0255, lng: 105.7466 },
  { kind: "store", name: "Bách Hóa Xanh Nguyễn Văn Linh", lat: 10.0221, lng: 105.7641 },
  { kind: "store", name: "Bách Hóa Xanh Hưng Phú", lat: 10.0068, lng: 105.7859 },

  { kind: "pharmacy", name: "Nhà thuốc Pharmacity 3 Tháng 2", lat: 10.0225, lng: 105.7655 },
  { kind: "pharmacy", name: "Nhà thuốc Pharmacity 30 Tháng 4", lat: 10.015, lng: 105.7629 },
  { kind: "pharmacy", name: "Nhà thuốc Pharmacity Võ Trường Toản", lat: 10.0464, lng: 105.7678 },

  { kind: "landmark", name: "Bến Ninh Kiều", lat: 10.0337, lng: 105.7884 },
  { kind: "landmark", name: "Chợ nổi Cái Răng", lat: 10.0035, lng: 105.747 },
  { kind: "landmark", name: "Công viên Lưu Hữu Phước", lat: 10.0323, lng: 105.7815 },
  { kind: "landmark", name: "Cầu Cần Thơ", lat: 10.0329, lng: 105.8102 },
  { kind: "landmark", name: "Cảng Hàng không Quốc tế Cần Thơ", lat: 10.0829, lng: 105.7121 },
  { kind: "landmark", name: "Bến xe Trung tâm Cần Thơ", lat: 10.0052, lng: 105.7723 },
];

const KIND_OF: Record<LandmarkKind, PlaceKind> = {
  university: "school",
  college: "school",
  vocational: "school",
  hospital: "hospital",
  market: "shopping",
  mall: "shopping",
  industrial: "landmark",
  other: "landmark",
};

/** The hand-picked places plus every school, hospital and market the search can look near, in both cities. */
export const MAP_PLACES: MapPlace[] = [
  ...HAND_PICKED,
  ...LANDMARKS.filter((l) => !HAND_PICKED.some((p) => p.name === l.name || (Math.abs(p.lat - l.lat) < 0.002 && Math.abs(p.lng - l.lng) < 0.002))).map((l) => ({
    kind: KIND_OF[l.kind],
    name: l.name,
    lat: l.lat,
    lng: l.lng,
  })),
];

export const PLACE_KINDS: PlaceKind[] = ["school", "hospital", "shopping", "store", "pharmacy", "landmark"];

/** Chain stores only get a name once zoomed in, so they do not crowd the city view. */
export const LABEL_ZOOM: Record<PlaceKind, number> = { school: 12.5, hospital: 12.5, shopping: 12.5, landmark: 12, store: 14.5, pharmacy: 14.5 };
