import type { MetadataRoute } from "next";
import { POLICIES, PROJECTS, publishedPosts, roomSlug } from "@tthome/data";
import { allAreaRoutes, areaHref } from "@/lib/area-route";

const BASE = "https://tthome.vn";

const STATIC = ["/", "/tim-kiem", "/khu-vuc", "/dat-lich", "/ky-gui", "/tuyen-ctv", "/tin-tuc", "/ve-chung-toi", "/lien-he", "/hoi-dap"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC.map((path) => ({ url: `${BASE}${path}`, changeFrequency: "daily" as const, priority: path === "/" ? 1 : 0.6 })),
    ...allAreaRoutes().map((r) => ({ url: `${BASE}${areaHref(r)}`, changeFrequency: "hourly" as const, priority: 0.8 })),
    ...PROJECTS.filter((p) => p.status === "active").map((p) => ({ url: `${BASE}/du-an/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "hourly" as const, priority: 0.9 })),
    ...PROJECTS.flatMap((p) =>
      p.rooms.filter((r) => r.status === "available" || r.status === "reserved").map((r) => ({ url: `${BASE}/phong/${roomSlug(r, p)}`, lastModified: p.updatedAt, priority: 0.7 })),
    ),
    ...publishedPosts().map((post) => ({ url: `${BASE}/tin-tuc/${post.slug}`, lastModified: post.publishedAt, priority: 0.5 })),
    ...POLICIES.map((p) => ({ url: `${BASE}/chinh-sach/${p.slug}`, lastModified: p.updatedAt, priority: 0.2 })),
  ];
}
