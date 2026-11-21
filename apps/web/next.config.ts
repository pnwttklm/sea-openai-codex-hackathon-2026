import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: process.env.DEV_PREVIEW_HOST ? [process.env.DEV_PREVIEW_HOST] : [],
  async rewrites() {
    const target = process.env.INTERNAL_API_URL ?? "http://localhost:8000";
    const demoReads = process.env.NEXT_PUBLIC_SHARED_DEMO === "1"
      ? ["portfolio", "behavior", "paper-account", "stocks", "stocks/:symbol([A-Z]{1,5})"].map(resource => ({
        source: "/preview/demo/" + resource,
        destination: target + "/api/v1/demo/" + resource.replace(":symbol([A-Z]{1,5})", ":symbol")
          + (resource === "behavior" ? "?include_assessment=true" : ""),
      }))
      : [];
    return [...demoReads, { source: "/internal/agent-ops/:path*", destination: target + "/api/v1/ops/:path*" }];
  },
};
export default config;
