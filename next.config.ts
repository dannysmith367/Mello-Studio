import type { NextConfig } from "next";

const supabaseHost = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : undefined;

const config: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
      // Printify's mockup CDN — product photos imported from Printify are
      // never re-hosted, so next/image needs to be allowed to fetch them.
      { protocol: "https" as const, hostname: "images-api.printify.com" },
    ],
  },
  // sharp runs in the Node runtime, not the bundler.
  serverExternalPackages: ["sharp"],
};

export default config;
