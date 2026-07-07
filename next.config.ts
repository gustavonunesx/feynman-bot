import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Lockfile solto em C:\Users\Gusatvo confunde a inferência de workspace
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
