import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ['192.168.1.12:3000', 'localhost:3000']
    }
  },
  // Adding this to allow dev server resources on the local network IP
  allowedDevOrigins: ['192.168.1.12', '192.168.1.12:3000']
};

export default nextConfig;
