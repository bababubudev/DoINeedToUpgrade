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
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "do-i-need-to-upgrade.vercel.app" }],
        destination: "https://doineedtoupgrade.com/:path*",
        statusCode: 301,
      },
    ];
  },
};

module.exports = nextConfig;
