import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* This part is crucial - it tells Next.js to allow the Webpack overrides */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;