"use client";

import { useState, useEffect } from "react";
import { GameDetails, UserSpecs, GameRequirements } from "@/types";
import { compareSpecs } from "@/lib/compareSpecs";
import { computeVerdict } from "@/lib/computeVerdict";
import { estimateFps } from "@/lib/fpsEstimate";
import { useBenchmarks } from "@/lib/useBenchmarks";
import VerdictBanner from "@/components/VerdictBanner";
import ComparisonResult from "@/components/ComparisonResult";
import Link from "next/link";

interface Props {
  game: GameDetails;
}

function hasAnyField(reqs: GameRequirements): boolean {
  return Object.values(reqs).some((v) => v.trim() !== "");
}

export default function GamePageClient({ game }: Props) {
  const { cpuScores, gpuScores, loading } = useBenchmarks();
  const [specs, setSpecs] = useState<UserSpecs | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("savedSpecs");
      if (raw) {
        const { specs: saved } = JSON.parse(raw);
        if (saved) setSpecs(saved);
      }
    } catch {
      // ignore
    }
    setHasChecked(true);
  }, []);

  if (!hasChecked || loading) {
    return (
      <div className="flex justify-center p-8">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!specs) {
    return (
      <div className="card bg-base-100/80 backdrop-blur-sm shadow-sm">
        <div className="card-body items-center text-center">
          <h3 className="card-title text-xl">Check Your PC</h3>
          <p className="text-base-content/70 max-w-md">
            See if your hardware can run {game.name}. Enter your system specs to get a personalized compatibility check.
          </p>
          <Link
            href={`/?game=${game.appid}`}
            className="btn btn-primary mt-2"
          >
            Check Compatibility
          </Link>
        </div>
      </div>
    );
  }

  const minReqs = game.requirements.minimum ?? { os: "", cpu: "", gpu: "", ram: "", storage: "" };
  const recReqs = game.requirements.recommended ?? { os: "", cpu: "", gpu: "", ram: "", storage: "" };
  const minArg = hasAnyField(minReqs) ? minReqs : null;
  const recArg = hasAnyField(recReqs) ? recReqs : null;

  const { items, scores } = compareSpecs(specs, minArg, recArg, cpuScores, gpuScores);
  const verdict = computeVerdict(items);
  const fpsEstimate = estimateFps(scores);

  const hasEstimate = fpsEstimate && fpsEstimate.confidence !== "none";

  return (
    <div className="flex flex-col gap-4">
      <VerdictBanner result={verdict} />
      <ComparisonResult items={items} />
      {hasEstimate && (
        <div className="flex flex-wrap items-center gap-2 px-1 text-sm text-base-content/60">
          <span>Estimated:</span>
          <span className="font-semibold">
            ~{fpsEstimate.low}&ndash;{fpsEstimate.high} FPS
          </span>
          {fpsEstimate.confidence === "limited" && (
            <span className="text-xs text-base-content/40">(rough estimate)</span>
          )}
          <span className="text-xs text-base-content/40">&middot; based on hardware scores</span>
        </div>
      )}
      <div className="text-center">
        <Link
          href={`/?game=${game.appid}`}
          className="btn btn-ghost btn-sm"
        >
          Re-check with different specs
        </Link>
      </div>
    </div>
  );
}
