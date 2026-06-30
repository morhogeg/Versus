import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin is a Node-only dependency; keep it external to the bundle.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
