"use client";

import GameSearch from "@/components/GameSearch";
import { GameSource } from "@/types";

interface Props {
  onSelect: (id: number, source: GameSource) => void;
  onManualMode: () => void;
  loading: boolean;
  error: string | null;
  showInfo?: boolean;
}

export default function StepGameSelect({ onSelect, onManualMode, loading, error, showInfo = true }: Props) {
  return (
    <div className="animate-fadeIn flex flex-col items-center gap-3 mt-8 py-2">
      <div className="w-full max-w-2xl">
        <GameSearch onSelect={onSelect} />
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <span className="loading loading-bars loading-lg" />
        </div>
      )}

      {error && (
        <div className="alert alert-error max-w-xl">
          <span>{error}</span>
        </div>
      )}

      <button className="btn btn-ghost btn-sm" onClick={onManualMode}>
        or enter requirements manually
      </button>

      {showInfo && (
        <div className="mt-14 w-full max-w-2xl space-y-3">
          <h2 className="text-lg font-semibold text-base-content/90">What is this?</h2>
          <p className="text-sm text-base-content/70 leading-relaxed">
            <strong>Do I Need An Upgrade?</strong> checks whether your PC can run a
            game by comparing your hardware against its system requirements. Search
            for any game above, and we&apos;ll auto-detect your specs and tell
            you if you&apos;re good to go or what you might need to upgrade.
          </p>
          <div className="flex flex-col gap-1 text-sm text-base-content/70 pt-1">
            <span>&#9679; Auto-detects your hardware</span>
            <span>&#9679; Compares CPU, GPU, RAM &amp; storage</span>
            <span>&#9679; Supports Windows, Mac &amp; Linux</span>
          </div>
          <h3 className="text-base font-semibold text-base-content/90 pt-3">About the hardware scanner</h3>
          <p className="text-sm text-base-content/70 leading-relaxed">
            For more accurate results, you can download and run the scanner app.
            It&apos;s fully open source and only reads basic system info like your
            CPU model, GPU name, RAM size, and available storage. It does not
            collect, transmit, or store any personal data — everything stays on
            your machine.
          </p>
        </div>
      )}
    </div>
  );
}
