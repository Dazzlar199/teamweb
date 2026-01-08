import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 파일 서빙을 방해하는 리다이렉트 제거
  trailingSlash: false,
};

export default nextConfig;
// Optimized for stable deployment

