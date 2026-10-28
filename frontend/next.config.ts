import type { NextConfig } from "next";

// Public URLs stay Vietnamese for SEO; the code lives in English folders.
const routes: Record<string, string> = {
  "/dang-nhap": "/sign-in",
  "/dang-ky": "/sign-up",
  "/quen-mat-khau": "/forgot-password",
  "/tai-khoan/ho-so": "/account/profile",
};

const config: NextConfig = {
  poweredByHeader: false,
  rewrites: async () => Object.entries(routes).map(([source, destination]) => ({ source, destination })),
};
export default config;
