import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@casa-randa/data", "@casa-randa/pricing"],
};

export default nextConfig;
