import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { fetchGameDetails } from "@/lib/fetchGameDetails";
import { slugify } from "@/lib/slugify";
import RequirementsCard from "@/components/RequirementsCard";
import GamePageClient from "@/components/GamePageClient";
import { Platform } from "@/types";

interface Props {
  params: Promise<{ params: string[] }>;
}

const platformLabels: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

async function getGame(segments: string[]) {
  const appid = segments[0];
  if (!appid || !/^\d+$/.test(appid)) return null;
  return fetchGameDetails(appid);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { params: segments } = await params;
  const game = await getGame(segments);
  if (!game) return { title: "Game Not Found" };

  const reqs = game.requirements.recommended ?? game.requirements.minimum;
  const parts: string[] = [];
  if (reqs?.gpu) parts.push(reqs.gpu);
  if (reqs?.cpu) parts.push(reqs.cpu);
  if (reqs?.ram) parts.push(reqs.ram + " RAM");

  const description = parts.length > 0
    ? `Check if your PC can run ${game.name}. Requires ${parts.join(", ")}. Compare your specs against minimum and recommended requirements.`
    : `Check if your PC can run ${game.name}. Compare your hardware against the official system requirements.`;

  const slug = slugify(game.name);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://do-i-need-to-upgrade.vercel.app";
  const canonical = `${baseUrl}/game/${game.appid}/${slug}`;

  return {
    title: `Can I Run ${game.name}? | System Requirements`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `Can I Run ${game.name}?`,
      description,
      url: canonical,
      images: [{ url: `${baseUrl}/api/og?appid=${game.appid}`, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Can I Run ${game.name}?`,
      description,
    },
  };
}

export default async function GamePage({ params }: Props) {
  const { params: segments } = await params;
  const appid = segments[0];

  if (!appid || !/^\d+$/.test(appid)) notFound();

  const game = await getGame(segments);
  if (!game) notFound();

  const correctSlug = slugify(game.name);
  const providedSlug = segments[1];

  // Redirect to canonical URL if slug is missing or wrong
  if (!providedSlug || providedSlug !== correctSlug) {
    redirect(`/game/${game.appid}/${correctSlug}`);
  }

  const minReqs = game.requirements.minimum;
  const recReqs = game.requirements.recommended;

  // Check for multi-platform
  const otherPlatforms = game.availablePlatforms.filter((p) => {
    const mainPlatform = game.platformRequirements.windows ? "windows" : game.availablePlatforms[0];
    return p !== mainPlatform;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-base-200/50">
        {game.headerImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.headerImage}
            alt={game.name}
            className="w-full sm:w-48 rounded shadow-md"
            width={460}
            height={215}
          />
        )}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold">Can I Run {game.name}?</h1>
          <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
            {game.availablePlatforms.map((p) => (
              <span key={p} className="badge badge-outline badge-sm">{platformLabels[p]}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Requirements Tables */}
      <div>
        <h2 className="text-xl font-bold mb-3">System Requirements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RequirementsCard title="Minimum" requirements={minReqs} />
          <RequirementsCard title="Recommended" requirements={recReqs} />
        </div>
      </div>

      {/* Other platform requirements */}
      {otherPlatforms.length > 0 && (
        <details className="collapse collapse-arrow bg-base-100 shadow-sm">
          <summary className="collapse-title text-lg font-medium">
            Other Platform Requirements
          </summary>
          <div className="collapse-content">
            {otherPlatforms.map((p) => {
              const platformReqs = game.platformRequirements[p];
              if (!platformReqs) return null;
              return (
                <div key={p} className="mb-4">
                  <h3 className="font-semibold text-base mb-2">{platformLabels[p]}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RequirementsCard title="Minimum" requirements={platformReqs.minimum} />
                    <RequirementsCard title="Recommended" requirements={platformReqs.recommended} />
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      )}

      {/* Client comparison widget */}
      <div>
        <h2 className="text-xl font-bold mb-3">Your Compatibility</h2>
        <GamePageClient game={game} />
      </div>

      {/* SEO prose — styled subtly so it reads as a natural footer, not filler */}
      <section className="border-t border-base-content/5 pt-5 mt-2 text-xs text-base-content/30 leading-relaxed max-w-2xl">
        <h2 className="text-sm font-medium text-base-content/40 mb-1.5">About {game.name} System Requirements</h2>
        <p>
          {game.name} is available on {game.availablePlatforms.map((p) => platformLabels[p]).join(", ")}.
          {recReqs?.gpu && ` The recommended graphics card is ${recReqs.gpu}.`}
          {recReqs?.cpu && ` You'll want at least a ${recReqs.cpu} processor.`}
          {recReqs?.ram && ` The game recommends ${recReqs.ram} of RAM.`}
          {minReqs?.gpu && recReqs?.gpu && minReqs.gpu !== recReqs.gpu && ` At minimum, a ${minReqs.gpu} is required.`}
        </p>
        <p className="mt-1.5">
          Use the compatibility checker above to see how your hardware compares.
        </p>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            name: game.name,
            image: game.headerImage,
            gamePlatform: game.availablePlatforms.map((p) => platformLabels[p]),
            operatingSystem: game.availablePlatforms.map((p) => platformLabels[p]).join(", "),
          }),
        }}
      />
    </div>
  );
}
