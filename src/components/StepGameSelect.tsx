"use client";

import GameSearch from "@/components/GameSearch";

interface Props {
  onSelect: (appid: number) => void;
  onManualMode: () => void;
  loading: boolean;
  error: string | null;
}

export default function StepGameSelect({ onSelect, onManualMode, loading, error }: Props) {
  return (
    <div className="animate-fadeIn flex flex-col items-center gap-4 py-4">
      <h1 className="text-3xl font-bold text-center">What game do you want to check?</h1>
      <p className="text-base-content/70 text-center">
        Search for a Steam game to check if your system can run it.
      </p>

      <div className="w-full max-w-xl">
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
        Enter Requirements Manually
      </button>
    </div>
  );
}
