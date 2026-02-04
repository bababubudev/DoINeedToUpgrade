"use client";

import { useState } from "react";
import { GameDetails, GameRequirements, VerdictResult, ComparisonItem, Platform } from "@/types";
import VerdictBanner from "@/components/VerdictBanner";
import ComparisonResult from "@/components/ComparisonResult";
import RequirementsEditor from "@/components/RequirementsEditor";
import { HiExclamation, HiInformationCircle, HiChevronDown } from "react-icons/hi";

const platformLabels: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

interface Props {
  game: GameDetails | null;
  verdict: VerdictResult | null;
  comparison: ComparisonItem[] | null;
  minReqs: GameRequirements;
  recReqs: GameRequirements;
  onRequirementsChange: (min: GameRequirements, rec: GameRequirements) => void;
  onRerun: () => void;
  onCheckAnother: () => void;
  onEditSpecs: () => void;
  platform: Platform;
  userPlatform: Platform;
  availablePlatforms: Platform[];
  onPlatformChange: (platform: Platform) => void;
}

function UpgradeCard({ result }: { result: VerdictResult }) {
  if (result.verdict === "pass" || result.upgradeItems.length === 0) return null;

  const [open, setOpen] = useState(false);
  const isFail = result.verdict === "fail";

  return (
    <div className={`card shadow-sm bg-base-100 hover:bg-base-content/5 transition-colors cursor-pointer ${isFail ? "dark:bg-error/20 dark:hover:bg-error/25" : "dark:bg-info/20 dark:hover:bg-info/25"}`} onClick={() => setOpen(!open)}>
      <div className="card-body p-4">
        <button
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-3">
            {isFail
              ? <HiExclamation className={`w-8 h-8 shrink-0 text-error`} />
              : <HiInformationCircle className={`w-8 h-8 shrink-0 text-info`} />}
            <div>
              <h3 className={`font-bold text-lg ${isFail ? "text-error" : "text-info"}`}>
                {isFail
                  ? `What you need to upgrade (${result.upgradeItems.length})`
                  : `What you could upgrade (${result.upgradeItems.length})`}
              </h3>
              <p className="text-sm text-base-content/70 mt-1">
                {isFail
                  ? "See what's holding your system back"
                  : "Your system can run this game, but these upgrades would improve the experience"}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1 shrink-0 ml-2 text-base-content/50 text-xs`}>
            <span>{open ? "Hide" : "Show"}</span>
            <HiChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </button>
        {open && (
          <div className="overflow-x-auto mt-2">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Your Current</th>
                  <th>{isFail ? "Required" : "Recommended"}</th>
                </tr>
              </thead>
              <tbody>
                {result.upgradeItems.map((item) => (
                  <tr key={item.component}>
                    <td className="font-semibold">{item.component}</td>
                    <td>{item.current}</td>
                    <td>{item.required}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StepResults({
  game,
  verdict,
  comparison,
  minReqs,
  recReqs,
  onRequirementsChange,
  onRerun,
  onCheckAnother,
  onEditSpecs,
  platform,
  userPlatform,
  availablePlatforms,
  onPlatformChange,
}: Props) {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div className="animate-fadeIn flex flex-col gap-4">
      {game && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.headerImage}
            alt={game.name}
            className="w-24 rounded shadow-sm"
          />
          <div>
            <p className="text-sm text-base-content/70">Results for</p>
            <h3 className="font-bold text-lg">{game.name}</h3>
          </div>
        </div>
      )}

      {availablePlatforms.length > 1 ? (
        <div className="flex flex-col gap-1">
          <div role="tablist" className="tabs tabs-boxed w-fit">
            {availablePlatforms.map((p) => (
              <button
                key={p}
                role="tab"
                className={`tab ${p === platform ? "tab-active" : ""}`}
                onClick={() => onPlatformChange(p)}
              >
                {platformLabels[p]}
              </button>
            ))}
          </div>
          {platform !== userPlatform && (
            <p className="text-xs text-base-content/50">
              Showing {platformLabels[platform]} requirements (your OS: {platformLabels[userPlatform]})
            </p>
          )}
        </div>
      ) : availablePlatforms.length === 1 && platform !== userPlatform ? (
        <p className="text-xs text-base-content/50">
          This game only lists {platformLabels[platform]} requirements. Comparing other specs against those.
        </p>
      ) : null}

      {verdict && <VerdictBanner result={verdict} />}

      {verdict && <UpgradeCard result={verdict} />}

      {comparison && (
        <ComparisonResult items={comparison} />
      )}

      <div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowEditor(!showEditor)}
        >
          {showEditor ? "Hide" : "Show"} Requirements Editor
          <HiChevronDown className={`w-4 h-4 transition-transform ${showEditor ? "rotate-180" : ""}`} />
        </button>
        {showEditor && (
          <div className="mt-2">
            <RequirementsEditor
              minimum={minReqs}
              recommended={recReqs}
              onChange={onRequirementsChange}
              onSubmit={onRerun}
            />
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center pt-2">
        <button className="btn btn-primary" onClick={onCheckAnother}>
          Check Another Game
        </button>
        <button className="btn btn-outline" onClick={onEditSpecs}>
          Edit My Specs
        </button>
      </div>
    </div>
  );
}
