import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/tai-khoan", "/dang-nhap", "/api/"] }],
    sitemap: "https://tthome.vn/sitemap.xml",
  };
}
