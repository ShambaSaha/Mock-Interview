/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: { resolve: { fallback: { fs: boolean; net: boolean; tls: boolean; child_process: boolean; }; }; }, { isServer }: any) => {
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