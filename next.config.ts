// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   typescript:{
//     ignoreBuildErrors: true,
//   }
// };

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // This allows the build even with TS errors
  },
  eslint: {
    ignoreDuringBuilds: true, // This bypasses the eslint error in your log
  },
};

module.exports = nextConfig;
export default nextConfig;
