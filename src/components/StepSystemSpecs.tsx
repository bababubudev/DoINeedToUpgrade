"use client";

import { UserSpecs, GameDetails } from "@/types";
import SystemSpecs from "@/components/SystemSpecs";
import HardwareScanner from "@/components/HardwareScanner";

interface Props {
  specs: UserSpecs;
  onChange: (specs: UserSpecs) => void;
  dirty: boolean;
  cpuList: string[];
  gpuList: string[];
  detecting: boolean;
  unmatchedFields: string[];
  game: GameDetails | null;
  onBack: () => void;
  onConfirm: () => void;
  onScriptImport?: (specs: UserSpecs) => void;
}

export default function StepSystemSpecs({
  specs,
  onChange,
  dirty,
  cpuList,
  gpuList,
  detecting,
  unmatchedFields,
  game,
  onBack,
  onConfirm,
  onScriptImport,
}: Props) {
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
            <p className="text-sm text-base-content/70">Checking compatibility for</p>
            <h3 className="font-bold text-lg">{game.name}</h3>
          </div>
        </div>
      )}

      {onScriptImport && <HardwareScanner onImport={onScriptImport} />}

      <SystemSpecs
        specs={specs}
        onChange={onChange}
        onSubmit={onConfirm}
        dirty={dirty}
        cpuList={cpuList}
        gpuList={gpuList}
        detecting={detecting}
        unmatchedFields={unmatchedFields}
        hideSubmit
      />

      <div className="flex justify-between">
        <button className="btn btn-ghost" onClick={onBack}>
          &larr; Back
        </button>
        <button className="btn btn-primary" onClick={onConfirm}>
          Check Compatibility &rarr;
        </button>
      </div>
    </div>
  );
}
