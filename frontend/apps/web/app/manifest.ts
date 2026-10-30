import type { MetadataRoute } from "next";

/** Lets phones add TTHOME to the home screen with the doorway mark as its icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TTHOME – Phòng trọ Gen Z ở Cần Thơ",
    short_name: "TTHOME",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf9f5",
    theme_color: "#fbf9f5",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
