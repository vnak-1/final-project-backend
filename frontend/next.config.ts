import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Listing photos go through a Server Action. The API accepts up to 5 MB,
      // plus a little room for the form's multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
