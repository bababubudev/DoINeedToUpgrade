import { uniquePopularGames } from "@/lib/popularGames";
import { slugify } from "@/lib/slugify";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://do-i-need-to-upgrade.vercel.app";

  const gameUrls = uniquePopularGames
    .map(
      (g) => `  <url>
    <loc>${baseUrl}/game/${g.appid}/${slugify(g.name)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${gameUrls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
