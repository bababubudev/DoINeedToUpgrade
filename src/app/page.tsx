import Link from "next/link";
import HomeWizard from "@/components/HomeWizard";
import { uniquePopularGames } from "@/lib/popularGames";
import { slugify } from "@/lib/slugify";

export default function Page() {
  const featured = uniquePopularGames.slice(0, 18);

  return (
    <>
      <div className="min-h-screen pb-24">
        <HomeWizard />
      </div>

      <section className="border-t border-base-content/10 pt-6 mt-8 mb-8 w-full max-w-2xl mx-auto text-base-content/60 leading-relaxed">
        <h2 className="text-sm font-medium text-base-content/80 mb-2">
          Can I run it? Check any Steam game against your PC.
        </h2>
        <p className="text-xs">
          Do I Need To Upgrade compares your CPU, GPU, RAM, and storage against the official
          minimum and recommended requirements for any game on Steam. Pick a game, confirm your
          specs, and get an instant verdict on whether your hardware can handle it — and if not,
          what you&apos;d need to upgrade. Hardware is matched against a curated benchmark list so
          older or partially-named components still get a fair comparison. Works on Windows,
          macOS, and Linux.
        </p>

        <h3 className="text-sm font-medium text-base-content/80 mt-5 mb-2">
          Popular games to check
        </h3>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
          {featured.map((g) => (
            <li key={g.appid} className="min-w-0">
              <Link
                href={`/game/${g.appid}/${slugify(g.name)}`}
                className="link link-hover text-base-content/60 hover:text-base-content block truncate"
                title={`Can I run ${g.name}?`}
              >
                Can I run {g.name}?
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
