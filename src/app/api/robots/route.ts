export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://do-i-need-to-upgrade.vercel.app";
  
  const robots = `# Allow search engines to crawl all public pages
User-agent: *
Allow: /
Allow: /public/

# Disallow crawling of internal API routes
Disallow: /api/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional - be friendly to servers)
Crawl-delay: 1

# Block bad bots
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /
`;

  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
