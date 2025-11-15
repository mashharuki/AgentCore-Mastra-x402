import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Enable standalone output for optimized Docker builds
  // This creates a minimal production server with only necessary files
  output: "standalone",
  /* config options here */
};

const config = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
})(nextConfig);

export default config;
