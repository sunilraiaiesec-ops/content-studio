import path from "path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  experimental: {
    serverActions: {
      // Photos and videos from phone/camera roll often exceed the 1 MB default
      bodySizeLimit: "100mb",
    },
    proxyClientMaxBodySize: "100mb",
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
