import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const target = process.env.INTERNAL_API_URL ?? "http://localhost:8000";
    return [{ source: "/internal/agent-ops/:path*", destination: target + "/api/v1/ops/:path*" }];
  },
};
export default config;
