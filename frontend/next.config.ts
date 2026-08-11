import type { NextConfig } from "next";

function readBasePath(): string {
  const basePath = process.env.APP_BASE_PATH || "";

  if (
    basePath &&
    (!basePath.startsWith("/") ||
      basePath.startsWith("//") ||
      basePath.endsWith("/") ||
      basePath.includes("://") ||
      basePath.includes("?") ||
      basePath.includes("#"))
  ) {
    throw new Error(
      "APP_BASE_PATH must be empty or an absolute path that starts with one '/', does not end with '/', and contains no URL, query, or fragment",
    );
  }

  return basePath;
}

const basePath = readBasePath();
const backendUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  basePath,
  output: "standalone",
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  async rewrites() {
    return ["api", "login", "oauth2", "s"].map((route) => ({
      source: `${basePath}/${route}/:path*`,
      destination: `${backendUrl}${basePath}/${route}/:path*`,
      basePath: false,
    }));
  },
};

export default nextConfig;
