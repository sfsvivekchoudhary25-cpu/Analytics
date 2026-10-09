import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a second copy (e.g. a preview on another port) build into its own folder without touching a running site.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  allowedDevOrigins: ["192.168.1.17", "192.168.1.123"],
  transpilePackages: [
    "antd",
    "@ant-design/icons",
    "@ant-design/icons-svg",
    "@ant-design/nextjs-registry",
    "rc-util",
    "rc-pagination",
    "rc-picker",
    "rc-table",
    "rc-tree",
  ],
  async rewrites() {
    return [
      {
        source: "/backend-proxy/:path*",
        destination: "https://analytics-backend-vxak.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
