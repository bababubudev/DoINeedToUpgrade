"use client";

import { useState, useCallback, useEffect } from "react";
import { UserSpecs, GameDetails, GameRequirements, ComparisonItem, Platform } from "@/types";
import { compareSpecs } from "@/lib/compareSpecs";
import { computeVerdict } from "@/lib/computeVerdict";
import { useBenchmarks } from "@/lib/useBenchmarks";
import { detectClientSpecs } from "@/lib/detectClientSpecs";
import { fuzzyMatchHardware } from "@/lib/fuzzyMatch";
import WizardStepper from "@/components/WizardStepper";
import StepGameSelect from "@/components/StepGameSelect";
import StepSystemSpecs from "@/components/StepSystemSpecs";
import StepResults from "@/components/StepResults";
import RequirementsEditor from "@/components/RequirementsEditor";
import SystemSpecs from "@/components/SystemSpecs";
import HardwareScanner from "@/components/HardwareScanner";

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
};

function detectPlatformFromOS(os: string): Platform {
  const lower = os.toLowerCase();
  if (lower.includes("mac")) return "macos";
  if (lower.includes("linux")) return "linux";
  return "windows";
}

function hasAnyField(reqs: GameRequirements): boolean {
  return Object.values(reqs).some((v) => v.trim() !== "");
}

export default function Home() {
  const { cpuList, gpuList, cpuScores, gpuScores } = useBenchmarks();
  const [specs, setSpecs] = useState<UserSpecs>(defaultSpecs);
  const [detecting, setDetecting] = useState(true);
  const [unmatchedFields, setUnmatchedFields] = useState<string[]>([]);

  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [specsConfirmed, setSpecsConfirmed] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const [game, setGame] = useState<GameDetails | null>(null);
  const [minReqs, setMinReqs] = useState<GameRequirements>(emptyReqs);
  const [recReqs, setRecReqs] = useState<GameRequirements>(emptyReqs);
  const [comparison, setComparison] = useState<ComparisonItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [specsDirty, setSpecsDirty] = useState(false);
  const [platform, setPlatform] = useState<Platform>("windows");
  const [userPlatform, setUserPlatform] = useState<Platform>("windows");

  useEffect(() => {
    detectClientSpecs(gpuList)
      .then(async (data) => {
        setSpecs(data);
        const detected = detectPlatformFromOS(data.os);
        setPlatform(detected);
        setUserPlatform(detected);
        const unmatched: string[] = [];
        if (!data.cpu || (cpuList.length > 0 && !fuzzyMatchHardware(data.cpu, cpuList))) {
          unmatched.push("CPU");
        }
        if (data.gpu && gpuList.length > 0 && !fuzzyMatchHardware(data.gpu, gpuList)) {
          unmatched.push("GPU");
        }
        if (!data.ramGB || data.ramGB === 8) unmatched.push("RAM");
        unmatched.push("Storage");
        // Merge guessed fields — these have values but need user confirmation
        if (data.guessedFields) {
          for (const f of data.guessedFields) {
            if (!unmatched.includes(f)) unmatched.push(f);
          }
        }
        setUnmatchedFields(unmatched);
      })
      .catch(() => {})
      .finally(() => setDetecting(false));
  }, [cpuList, gpuList]);

  const verdict = comparison ? computeVerdict(comparison) : null;

  const isSinglePlatformGame = (game?.availablePlatforms.length ?? 0) <= 1;

  const runComparison = useCallback(
    (min?: GameRequirements, rec?: GameRequirements) => {
      const minR = min ?? minReqs;
      const recR = rec ?? recReqs;
      if (!hasAnyField(minR) && !hasAnyField(recR)) {
        setComparison(null);
        return;
      }
      const minArg = hasAnyField(minR) ? minR : null;
      const recArg = hasAnyField(recR) ? recR : null;
      const result = compareSpecs(specs, minArg, recArg, cpuScores, gpuScores, isSinglePlatformGame);
      setComparison(result);
      setSpecsDirty(false);
    },
    [specs, minReqs, recReqs, cpuScores, gpuScores, isSinglePlatformGame]
  );

  function goToStep(s: number) {
    setStep(s);
    setMaxReached((prev) => Math.max(prev, s));
  }

  function evaluateUnmatched(s: UserSpecs) {
    const unmatched: string[] = [];
    if (!s.cpu || (cpuList.length > 0 && !fuzzyMatchHardware(s.cpu, cpuList))) unmatched.push("CPU");
    if (s.gpu && gpuList.length > 0 && !fuzzyMatchHardware(s.gpu, gpuList)) unmatched.push("GPU");
    if (!s.ramGB || s.ramGB === 8) unmatched.push("RAM");
    unmatched.push("Storage");
    setUnmatchedFields(unmatched);
  }

  function handleSpecsChange(newSpecs: UserSpecs) {
    setSpecs(newSpecs);
    setSpecsDirty(true);
    evaluateUnmatched(newSpecs);
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

      // Auto-select platform: prefer user's OS, fall back to first available
      const selectedPlatform = data.availablePlatforms.includes(userPlatform)
        ? userPlatform
        : data.availablePlatforms[0] ?? "windows";
      setPlatform(selectedPlatform);

      const platformReqs = data.platformRequirements[selectedPlatform] ?? data.requirements;
      const newMin = platformReqs.minimum ?? { ...emptyReqs };
      const newRec = platformReqs.recommended ?? { ...emptyReqs };
      setMinReqs(newMin);
      setRecReqs(newRec);

      if (specsConfirmed) {
        const minArg = hasAnyField(newMin) ? newMin : null;
        const recArg = hasAnyField(newRec) ? newRec : null;
        const singlePlatform = (data.availablePlatforms.length ?? 0) <= 1;
        const result = compareSpecs(specs, minArg, recArg, cpuScores, gpuScores, singlePlatform);
        setComparison(result);
        setSpecsDirty(false);
        goToStep(3);
      } else {
        goToStep(2);
      }
    } catch {
      setError("Failed to load game requirements. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleManualMode() {
    setManualMode(true);
    setGame(null);
    setMinReqs({ ...emptyReqs });
    setRecReqs({ ...emptyReqs });
    setComparison(null);
    goToStep(2);
  }

  function handleSpecsConfirm() {
    setSpecsConfirmed(true);
    runComparison();
    goToStep(3);
  }

  function handleCheckAnother() {
    setGame(null);
    setComparison(null);
    setMinReqs({ ...emptyReqs });
    setRecReqs({ ...emptyReqs });
    setManualMode(false);
    goToStep(1);
  }

  function handleScriptImport(importedSpecs: UserSpecs) {
    setSpecs(importedSpecs);
    setUnmatchedFields([]);
    setSpecsDirty(true);
  }

  function handleEditSpecs() {
    goToStep(2);
  }

  function handleRequirementsChange(min: GameRequirements, rec: GameRequirements) {
    setMinReqs(min);
    setRecReqs(rec);
  }

  function handlePlatformChange(newPlatform: Platform) {
    if (!game) return;
    setPlatform(newPlatform);
    const platformReqs = game.platformRequirements[newPlatform] ?? game.requirements;
    const newMin = platformReqs.minimum ?? { ...emptyReqs };
    const newRec = platformReqs.recommended ?? { ...emptyReqs };
    setMinReqs(newMin);
    setRecReqs(newRec);
    if (specsConfirmed) {
      const minArg = hasAnyField(newMin) ? newMin : null;
      const recArg = hasAnyField(newRec) ? newRec : null;
      const result = compareSpecs(specs, minArg, recArg, cpuScores, gpuScores, isSinglePlatformGame);
      setComparison(result);
      setSpecsDirty(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <WizardStepper
        currentStep={step}
        onStepClick={goToStep}
        maxReached={maxReached}
      />

      {step === 1 && (
        <StepGameSelect
          onSelect={handleGameSelect}
          onManualMode={handleManualMode}
          loading={loading}
          error={error}
        />
      )}

      {step === 2 && !manualMode && (
        <StepSystemSpecs
          specs={specs}
          onChange={handleSpecsChange}
          dirty={specsDirty}
          cpuList={cpuList}
          gpuList={gpuList}
          detecting={detecting}
          unmatchedFields={unmatchedFields}
          game={game}
          onBack={() => goToStep(1)}
          onConfirm={handleSpecsConfirm}
          onScriptImport={handleScriptImport}
        />
      )}

      {step === 2 && manualMode && (
        <div className="animate-fadeIn flex flex-col gap-4">
          <HardwareScanner onImport={handleScriptImport} />
          <SystemSpecs
            specs={specs}
            onChange={handleSpecsChange}
            onSubmit={handleSpecsConfirm}
            dirty={specsDirty}
            cpuList={cpuList}
            gpuList={gpuList}
            detecting={detecting}
            unmatchedFields={unmatchedFields}
            hideSubmit
          />
          <RequirementsEditor
            minimum={minReqs}
            recommended={recReqs}
            onChange={handleRequirementsChange}
            onSubmit={handleSpecsConfirm}
          />
          <div className="flex justify-between">
            <button className="btn btn-ghost" onClick={() => goToStep(1)}>
              &larr; Back
            </button>
            <button className="btn btn-primary" onClick={handleSpecsConfirm}>
              Check Compatibility &rarr;
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <StepResults
          game={game}
          verdict={verdict}
          comparison={comparison}
          minReqs={minReqs}
          recReqs={recReqs}
          onRequirementsChange={handleRequirementsChange}
          onRerun={() => runComparison()}
          onCheckAnother={handleCheckAnother}
          onEditSpecs={handleEditSpecs}
          platform={platform}
          userPlatform={userPlatform}
          availablePlatforms={game?.availablePlatforms ?? []}
          onPlatformChange={handlePlatformChange}
        />
      )}
    </div>
  );
}
