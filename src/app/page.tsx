"use client";

import { useState, useCallback, useEffect } from "react";
import { UserSpecs, GameDetails, GameRequirements, ComparisonItem } from "@/types";
import { compareSpecs } from "@/lib/compareSpecs";
import { computeVerdict } from "@/lib/computeVerdict";
import { useBenchmarks } from "@/lib/useBenchmarks";
import SystemSpecs from "@/components/SystemSpecs";
import GameSearch from "@/components/GameSearch";
import RequirementsEditor from "@/components/RequirementsEditor";
import ComparisonResult from "@/components/ComparisonResult";
import VerdictBanner from "@/components/VerdictBanner";
import UpgradeModal from "@/components/UpgradeModal";

const defaultSpecs: UserSpecs = {
  os: "",
  cpu: "",
  cpuCores: null,
  gpu: "",
  ramGB: null,
  storageGB: null,
};

const emptyReqs: GameRequirements = {
  os: "",
  cpu: "",
  gpu: "",
  ram: "",
  storage: "",
  directx: "",
};

function hasAnyField(reqs: GameRequirements): boolean {
  return Object.values(reqs).some((v) => v.trim() !== "");
}

export default function Home() {
  const { cpuList, gpuList, cpuScores, gpuScores } = useBenchmarks();
  const [specs, setSpecs] = useState<UserSpecs>(defaultSpecs);
  const [detecting, setDetecting] = useState(true);

  useEffect(() => {
    fetch("/api/detect")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: UserSpecs) => setSpecs(data))
      .catch(() => {})
      .finally(() => setDetecting(false));
  }, []);
  const [game, setGame] = useState<GameDetails | null>(null);
  const [minReqs, setMinReqs] = useState<GameRequirements>(emptyReqs);
  const [recReqs, setRecReqs] = useState<GameRequirements>(emptyReqs);
  const [comparison, setComparison] = useState<ComparisonItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [specsDirty, setSpecsDirty] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const showEditor = game !== null || manualMode;
  const hasReqs = hasAnyField(minReqs) || hasAnyField(recReqs);
  const verdict = comparison ? computeVerdict(comparison) : null;

  const runComparison = useCallback(() => {
    if (!hasAnyField(minReqs) && !hasAnyField(recReqs)) {
      setComparison(null);
      return;
    }
    const min = hasAnyField(minReqs) ? minReqs : null;
    const rec = hasAnyField(recReqs) ? recReqs : null;
    const result = compareSpecs(specs, min, rec, cpuScores, gpuScores);
    setComparison(result);
    setSpecsDirty(false);
    setShowModal(true);
  }, [specs, minReqs, recReqs, cpuScores, gpuScores]);

  function handleSpecsChange(newSpecs: UserSpecs) {
    setSpecs(newSpecs);
    setSpecsDirty(true);
  }

  async function handleGameSelect(appid: number) {
    setLoading(true);
    setError(null);
    setGame(null);
    setComparison(null);
    setManualMode(false);

    try {
      const res = await fetch(`/api/game?appid=${appid}`);
      if (!res.ok) throw new Error("Failed to load game details");

      const data: GameDetails = await res.json();
      setGame(data);
      setMinReqs(data.requirements.minimum ?? { ...emptyReqs });
      setRecReqs(data.requirements.recommended ?? { ...emptyReqs });
    } catch {
      setError("Failed to load game requirements. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleRequirementsChange(min: GameRequirements, rec: GameRequirements) {
    setMinReqs(min);
    setRecReqs(rec);
  }

  function handleManualMode() {
    setManualMode(true);
    setGame(null);
    setMinReqs({ ...emptyReqs });
    setRecReqs({ ...emptyReqs });
    setComparison(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <SystemSpecs
        specs={specs}
        onChange={handleSpecsChange}
        onSubmit={runComparison}
        dirty={specsDirty}
        cpuList={cpuList}
        gpuList={gpuList}
        detecting={detecting}
      />
      <GameSearch onSelect={handleGameSelect} />

      {!showEditor && (
        <div className="flex justify-center">
          <button className="btn btn-outline" onClick={handleManualMode}>
            Enter Requirements Manually
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-bars loading-lg" />
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {game && (
        <div className="flex items-center gap-4 px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.headerImage}
            alt={game.name}
            className="w-48 rounded-lg shadow"
          />
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold">{game.name}</h2>
            <button className="btn btn-primary btn-sm w-fit" onClick={runComparison}>
              Check Compatibility
            </button>
          </div>
        </div>
      )}

      {verdict && hasReqs && <VerdictBanner result={verdict} />}

      {comparison && hasReqs && (
        <ComparisonResult
          items={comparison}
          gameName={game?.name ?? "Manual Comparison"}
        />
      )}

      {showEditor && (
        <RequirementsEditor
          minimum={minReqs}
          recommended={recReqs}
          onChange={handleRequirementsChange}
          onSubmit={runComparison}
        />
      )}

      {verdict && (
        <UpgradeModal
          result={verdict}
          open={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
