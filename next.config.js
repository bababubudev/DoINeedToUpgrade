/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.akamai.steamstatic.com",
      },
      {
        protocol: "https",
        hostname: "images.igdb.com",
      },
    ],
  },
  async rewrites() {
    return [
      { source: "/robots.txt", destination: "/api/robots" },
      { source: "/sitemap.xml", destination: "/api/sitemap" },
    ];
  },
};

module.exports = nextConfig;
