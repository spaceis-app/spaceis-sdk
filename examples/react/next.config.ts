import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@spaceis/sdk", "@spaceis/react"],
};

export default nextConfig;
