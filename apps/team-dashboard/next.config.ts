import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/inbloom",
        destination: "/inbloom/index.html",
        permanent: false,
      },
    ];
  },
  // Vercel 배포를 위한 설정
  trailingSlash: false,
};

export default nextConfig;
// Final build trigger with Root Directory: apps/team-dashboard
