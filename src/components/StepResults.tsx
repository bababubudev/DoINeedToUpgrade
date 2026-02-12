"use client";

import { useState, useEffect } from "react";
import { GameDetails, GameRequirements, VerdictResult, ComparisonItem, Platform } from "@/types";
import ComparisonResult from "@/components/ComparisonResult";
import RequirementsEditor from "@/components/RequirementsEditor";
import { HiCheckCircle, HiXCircle, HiQuestionMarkCircle, HiInformationCircle, HiChevronDown, HiExclamation, HiEmojiSad } from "react-icons/hi";

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

const verdictIcons = {
  pass: HiCheckCircle,
  minimum: HiInformationCircle,
  fail: HiXCircle,
  unknown: HiQuestionMarkCircle,
} as const;

function VerdictCard({ result }: { result: VerdictResult }) {
  const [open, setOpen] = useState(false);
  const Icon = verdictIcons[result.verdict];
  const hasUpgrades = result.upgradeItems.length > 0 && result.verdict !== "pass";
  const isFail = result.verdict === "fail";

  // Reset collapse when verdict changes (e.g. platform switch)
  useEffect(() => {
    setOpen(false);
  }, [result.verdict, result.title]);

  const cardColors = {
    pass: "bg-success/20 text-success",
    minimum: "bg-info/20 text-info",
    fail: "bg-error/20 text-error",
    unknown: "bg-warning/20 text-warning",
  } as const;

  const contentColors = {
    pass: "bg-success/10",
    minimum: "bg-info/10",
    fail: "bg-error/10",
    unknown: "bg-warning/10",
  } as const;

  return (
    <div className={`collapse rounded-box ${cardColors[result.verdict]} cursor-pointer hover:brightness-95 transition-[filter]`}>
      <input type="checkbox" onChange={(e) => setOpen(e.target.checked)} />
      <div className="collapse-title flex items-center justify-between !min-h-0 !py-5 !px-4">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 shrink-0" />
          <h3 className="text-base font-bold">{result.title}</h3>
        </div>
        <div className="flex items-center gap-1 opacity-70 text-xs font-medium">
          <span>{open ? "Hide" : "Show"} details</span>
          <HiChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
      <div className={`collapse-content px-4 ${contentColors[result.verdict]} rounded-b-box text-base-content`}>
        <p className="text-sm text-base-content/70 pt-3">{result.description}</p>
        {hasUpgrades && (
          <div className="overflow-x-auto mt-3">
            <table className="table table-sm w-full [&_tr]:border-base-content/10">
              <thead>
                <tr className="text-base-content/40">
                  <th>Component</th>
                  <th>Your Current</th>
                  <th>{isFail ? "Required" : "Recommended"}</th>
                </tr>
              </thead>
              <tbody>
                {result.upgradeItems.map((item) => (
                  <tr key={item.component} className="text-base-content/70">
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
        <div className="relative flex flex-col sm:flex-row items-center gap-4 p-4 rounded-lg bg-base-200/50 overflow-hidden">
          {(() => {
            const iconClass = "absolute right-4 top-1/2 -translate-y-1/2 w-20 h-20 text-base-content/5 select-none pointer-events-none";
            if (!verdict || verdict.verdict === "unknown") return <HiQuestionMarkCircle className={iconClass} />;
            if (verdict.verdict === "pass") return <HiCheckCircle className={iconClass} />;
            if (verdict.verdict === "minimum") return <HiExclamation className={iconClass} />;
            return <HiEmojiSad className={iconClass} />;
          })()}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.headerImage}
            alt={game.name}
            className="w-28 sm:w-28 rounded shadow-md relative z-10"
          />
          <div className="relative z-10 text-center sm:text-left">
            <p className="text-base text-base-content/60">Do I need an upgrade for</p>
            <h3 className="font-bold text-xl sm:text-2xl">{game.name}</h3>
          </div>
        </div>
      )}

      {availablePlatforms.length > 1 ? (
        <div className="flex flex-col gap-1">
          <div role="tablist" className="tabs tabs-boxed w-fit">
            {availablePlatforms.map((p) => {
              const isActive = p === platform;
              const isUserPlatform = p === userPlatform;
              return (
                <button
                  key={p}
                  role="tab"
                  className={`tab ${isActive ? (isUserPlatform ? "tab-active" : "bg-base-content/15 text-base-content/70") : ""}`}
                  onClick={() => onPlatformChange(p)}
                >
                  {platformLabels[p]}
                </button>
              );
            })}
          </div>
          {platform !== userPlatform && (
            <p className="text-xs text-base-content/50 flex items-center gap-1">
              <HiInformationCircle className="w-3.5 h-3.5 shrink-0" />
              {availablePlatforms.includes(userPlatform)
                ? `Showing ${platformLabels[platform]} requirements (your OS: ${platformLabels[userPlatform]})`
                : `No ${platformLabels[userPlatform]} requirements found for this game. Showing ${platformLabels[platform]} requirements instead.`
              }
            </p>
          )}
        </div>
      ) : availablePlatforms.length === 1 && platform !== userPlatform ? (
        <p className="text-xs text-base-content/50 flex items-center gap-1">
          <HiInformationCircle className="w-3.5 h-3.5 shrink-0" />
          No {platformLabels[userPlatform]} requirements found. This game only lists {platformLabels[platform]} requirements.
        </p>
      ) : null}

      {verdict && <VerdictCard key={`${verdict.verdict}-${platform}`} result={verdict} />}

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
