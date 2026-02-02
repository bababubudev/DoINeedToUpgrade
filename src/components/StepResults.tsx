"use client";

import { useState } from "react";
import { GameDetails, GameRequirements, VerdictResult, ComparisonItem } from "@/types";
import VerdictBanner from "@/components/VerdictBanner";
import ComparisonResult from "@/components/ComparisonResult";
import RequirementsEditor from "@/components/RequirementsEditor";

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
}

function UpgradeCard({ result }: { result: VerdictResult }) {
  if (result.verdict === "pass" || result.upgradeItems.length === 0) return null;

  const [open, setOpen] = useState(result.verdict === "fail");
  const isFail = result.verdict === "fail";

  return (
    <div className={`card shadow-sm bg-base-100 ${isFail ? "dark:bg-error/20" : "dark:bg-info/20"}`}>
      <div className="card-body p-4">
        <button
          className="flex items-center justify-between w-full text-left"
          onClick={() => setOpen(!open)}
        >
          <div>
            <h3 className={`font-bold text-base ${isFail ? "text-error" : "text-info"}`}>
              {isFail ? "Upgrade Required" : "Upgrade Optional"}
            </h3>
            <p className="text-sm text-base-content/70 mt-1">
              {isFail
                ? result.description
                : "Your system can run this game! For a better experience, consider upgrading."}
            </p>
          </div>
          <svg
            className={`w-5 h-5 shrink-0 ml-2 text-base-content/50 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
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
          <svg
            className={`w-4 h-4 transition-transform ${showEditor ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
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
