import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.makeupar.com" }, { protocol: "https", hostname: "**.amazonaws.com" }],
  },
};

export default nextConfig;
