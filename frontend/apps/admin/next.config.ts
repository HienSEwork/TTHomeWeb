import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));

const config: NextConfig = {
  basePath: "/admin",
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  turbopack: { root: workspaceRoot },
  agentRules: false,
  transpilePackages: ["@tthome/ui", "@tthome/data"],
  // When the admin is deployed on its own domain (the Vercel demo), the bare domain opens the admin.
  async redirects() {
    return [{ source: "/", destination: "/admin", basePath: false, permanent: false }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default config;
