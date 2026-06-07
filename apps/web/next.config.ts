import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  env: {
    DEV_PREVIEW_MODE: process.env.DEV_PREVIEW_MODE,
  },
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
  async redirects() {
    return [
      {
        source: "/bookings",
        destination: "/projects",
        permanent: false,
      },
      {
        source: "/bookings/new",
        destination: "/projects/new",
        permanent: false,
      },
      {
        source: "/bookings/:id",
        destination: "/projects/:id",
        permanent: false,
      },
      {
        source: "/artists",
        destination: "/explore",
        permanent: false,
      },
      {
        source: "/artists/:slug",
        destination: "/creatives/:slug",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
