/*
 * Domain types for the UI. Field names and enum values follow db/tthome_schema.sql
 * so the mock data can be swapped for the generated API client without reshaping.
 */

export type RoomType = "studio" | "duplex" | "1pn" | "2pn" | "3pn" | "shared" | "dorm" | "room";
export type RoomStatus = "available" | "reserved" | "rented" | "hidden";
export type Furniture = "full" | "basic" | "none";
export type PetPolicy = "none" | "cat" | "small_pet" | "ask_owner" | "allowed";
export type ProjectStatus = "active" | "hidden" | "closed";
export type LandmarkKind = "university" | "mall" | "industrial" | "hospital" | "other";

export type Ward = { slug: string; name: string; districtSlug: string };
export type District = { slug: string; name: string; wards: Ward[] };

export type Amenity = { code: string; name: string; scope: "room" | "project" | "both" };

export type Landmark = {
  slug: string;
  name: string;
  shortName: string;
  kind: LandmarkKind;
  lat: number;
  lng: number;
};

export type Fees = {
  /** đ per kWh */
  electric: number;
  /** đ per person per month */
  water: number;
  /** đ per room per month: cleaning, wifi, trash */
  service: number;
  /** đ per motorbike per month */
  parking: number;
};

export type Room = {
  id: string;
  code: string;
  projectId: string;
  name: string;
  type: RoomType;
  area: number;
  price: number;
  deposit: number;
  status: RoomStatus;
  availableFrom: string;
  floor: number;
  furniture: Furniture;
  hasWindow: boolean;
  hasBalcony: boolean;
  maxPeople: number;
  images: string[];
  amenities: string[];
};

export type Project = {
  id: string;
  code: string;
  slug: string;
  name: string;
  street: string;
  wardSlug: string;
  districtSlug: string;
  lat: number;
  lng: number;
  images: string[];
  hasVideo: boolean;
  exclusive: boolean;
  petPolicy: PetPolicy;
  evParking: boolean;
  promo: string | null;
  amenities: string[];
  description: string;
  rules: string[];
  fees: Fees;
  status: ProjectStatus;
  views: number;
  createdAt: string;
  updatedAt: string;
  rooms: Room[];
};

export type SortOption = "newest" | "price_asc" | "price_desc" | "nearest" | "popular";

export type SearchFilters = {
  q?: string;
  district?: string;
  ward?: string;
  priceMin?: number;
  priceMax?: number;
  types?: RoomType[];
  furniture?: Furniture;
  amenities?: string[];
  pet?: boolean;
  ev?: boolean;
  promo?: boolean;
  exclusive?: boolean;
  balcony?: boolean;
  window?: boolean;
  landmark?: string;
  /** Radius in km around the landmark. */
  radius?: number;
  sort?: SortOption;
};

export type ProjectMatch = {
  project: Project;
  rooms: Room[];
  minPrice: number | null;
  /** Distance in km to the landmark, when the search asked for one. */
  distanceKm: number | null;
};

export type AreaStat = {
  district: District;
  ward: Ward;
  projects: number;
  vacant: number;
  minPrice: number | null;
};

export type PostCategory = { slug: string; name: string };

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: PostCategory;
  tags: string[];
  author: string;
  publishedAt: string;
  readMinutes: number;
  cover: string;
  sections: { heading: string; paragraphs: string[] }[];
  status: "draft" | "scheduled" | "published" | "archived";
  views: number;
};

export type Faq = { id: string; question: string; answer: string; audience: "tenant" | "landlord" | "all"; group: string };

export type Policy = { slug: string; title: string; updatedAt: string; sections: { heading: string; paragraphs: string[] }[] };
