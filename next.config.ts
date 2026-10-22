import type { NextConfig } from "next";

const JAVA_API = process.env.JAVA_API_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${JAVA_API}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
