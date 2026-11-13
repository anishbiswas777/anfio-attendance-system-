import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  async rewrites() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (
      supabaseUrl &&
      (supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost"))
    ) {
      return [
        {
          source: "/supabase/:path*",
          destination: `${supabaseUrl}/:path*`,
        },
      ];
    }
    return [];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
