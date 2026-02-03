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
    <div className="animate-fadeIn flex flex-col items-center gap-3 py-2">
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
        or enter requirements manually
      </button>
    </div>
  );
}
