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
};

export default nextConfig;
