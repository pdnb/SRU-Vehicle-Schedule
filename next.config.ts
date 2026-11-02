import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (Coolify)
  output: "standalone",
  // node-oracledb loads native/optional modules at runtime, so keep it out of the bundle
  serverExternalPackages: ["oracledb"],
};

export default nextConfig;
