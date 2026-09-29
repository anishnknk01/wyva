import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Compress responses
  compress: true,
  // Reduce image optimisation overhead during dev
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },
  // Aggressive header caching for static assets — production only, since
  // Next.js dev server manages its own (non-cached) static file serving.
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
