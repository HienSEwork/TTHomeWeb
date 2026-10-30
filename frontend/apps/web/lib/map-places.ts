/** Well-known places shown on the search map so visitors can judge where an area is. */
export type PlaceKind = "school" | "hospital" | "shopping" | "store" | "pharmacy" | "landmark";

export type MapPlace = { name: string; kind: PlaceKind; lat: number; lng: number };

/**
 * Positions are approximate (good to a block or two) and kept here for the demo; names are written out in full.
 * Chains list a few branches near the listed buildings.
 */
export const MAP_PLACES: MapPlace[] = [
  { kind: "school", name: "Trường Đại học Cần Thơ", lat: 10.0299, lng: 105.7706 },
  { kind: "school", name: "Trường Đại học Y Dược Cần Thơ", lat: 10.0353, lng: 105.7553 },
  { kind: "school", name: "Trường Đại học FPT Cần Thơ", lat: 10.0127, lng: 105.7325 },
  { kind: "school", name: "Trường Đại học Nam Cần Thơ", lat: 10.0075, lng: 105.723 },
  { kind: "school", name: "Trường Đại học Tây Đô", lat: 9.9944, lng: 105.7432 },

  { kind: "hospital", name: "Bệnh viện Nhi Đồng Thành phố Cần Thơ", lat: 10.0262, lng: 105.7445 },
  { kind: "hospital", name: "Bệnh viện Đa khoa Trung ương Cần Thơ", lat: 10.0225, lng: 105.7598 },
  { kind: "hospital", name: "Bệnh viện Đa khoa Thành phố Cần Thơ", lat: 10.0356, lng: 105.7842 },
  { kind: "hospital", name: "Bệnh viện Phụ sản Thành phố Cần Thơ", lat: 10.0475, lng: 105.77 },

  { kind: "shopping", name: "Vincom Plaza Xuân Khánh", lat: 10.0263, lng: 105.7774 },
  { kind: "shopping", name: "Vincom Plaza Hùng Vương", lat: 10.0441, lng: 105.7826 },
  { kind: "shopping", name: "Sense City Cần Thơ", lat: 10.0349, lng: 105.7864 },
  { kind: "shopping", name: "Lotte Mart Cần Thơ", lat: 10.0362, lng: 105.7695 },
  { kind: "shopping", name: "GO! Cần Thơ", lat: 10.0135, lng: 105.7934 },
  { kind: "shopping", name: "Chợ Xuân Khánh", lat: 10.0285, lng: 105.7742 },

  { kind: "store", name: "Circle K 3 Tháng 2", lat: 10.0285, lng: 105.769 },
  { kind: "store", name: "Circle K Nguyễn Văn Cừ", lat: 10.033, lng: 105.757 },
  { kind: "store", name: "Circle K Mậu Thân", lat: 10.039, lng: 105.7735 },
  { kind: "store", name: "Circle K 30 Tháng 4", lat: 10.0225, lng: 105.776 },
  { kind: "store", name: "Bách Hóa Xanh Trần Hưng Đạo", lat: 10.0385, lng: 105.779 },
  { kind: "store", name: "Bách Hóa Xanh Nguyễn Văn Linh", lat: 10.0185, lng: 105.762 },
  { kind: "store", name: "Bách Hóa Xanh Hưng Phú", lat: 10.012, lng: 105.788 },
  { kind: "store", name: "Bách Hóa Xanh Cách Mạng Tháng 8", lat: 10.051, lng: 105.768 },

  { kind: "pharmacy", name: "Nhà thuốc Long Châu 3 Tháng 2", lat: 10.027, lng: 105.7655 },
  { kind: "pharmacy", name: "Nhà thuốc Long Châu Hùng Vương", lat: 10.042, lng: 105.781 },
  { kind: "pharmacy", name: "Nhà thuốc Long Châu Nguyễn Văn Cừ", lat: 10.03, lng: 105.752 },
  { kind: "pharmacy", name: "Nhà thuốc Long Châu Trần Văn Khéo", lat: 10.0365, lng: 105.7765 },

  { kind: "landmark", name: "Bến Ninh Kiều", lat: 10.0339, lng: 105.7884 },
  { kind: "landmark", name: "Chợ nổi Cái Răng", lat: 10.0012, lng: 105.7454 },
  { kind: "landmark", name: "Công viên Lưu Hữu Phước", lat: 10.0307, lng: 105.786 },
  { kind: "landmark", name: "Cầu Cần Thơ", lat: 10.027, lng: 105.832 },
  { kind: "landmark", name: "Cảng Hàng không Quốc tế Cần Thơ", lat: 10.0851, lng: 105.7116 },
  { kind: "landmark", name: "Bến xe Trung tâm Cần Thơ", lat: 10.004, lng: 105.757 },
];

export const PLACE_KINDS: PlaceKind[] = ["school", "hospital", "shopping", "store", "pharmacy", "landmark"];

/** Chain stores only get a name once zoomed in, so they do not crowd the city view. */
export const LABEL_ZOOM: Record<PlaceKind, number> = { school: 12.5, hospital: 12.5, shopping: 12.5, landmark: 12, store: 14.5, pharmacy: 14.5 };
