"use client";

import { useState } from "react";
import { UserSpecs, GameDetails } from "@/types";
import GameSearch from "@/components/GameSearch";
import SystemSpecs from "@/components/SystemSpecs";
import { HiPencil, HiCheckCircle } from "react-icons/hi";

interface Props {
  specs: UserSpecs;
  onChange: (specs: UserSpecs) => void;
  cpuList: string[];
  gpuList: string[];
  game: GameDetails | null;
  onGameSelect: (appid: number) => void;
  onCheckCompatibility: () => void;
  loading: boolean;
  error: string | null;
}

export default function StepCombinedGameAndSpecs({
  specs,
  onChange,
  cpuList,
  gpuList,
  game,
  onGameSelect,
  onCheckCompatibility,
  loading,
  error,
}: Props) {
  const [editingSpecs, setEditingSpecs] = useState(false);

  return (
    <div className="animate-fadeIn flex flex-col gap-4 mt-4">
      {/* Compact specs summary */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HiCheckCircle className="w-5 h-5 text-success" />
              <h3 className="font-semibold text-sm">Hardware Detected</h3>
            </div>
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setEditingSpecs(!editingSpecs)}
            >
              <HiPencil className="w-3 h-3" />
              {editingSpecs ? "Done" : "Edit"}
            </button>
          </div>

          {!editingSpecs && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
              <div>
                <span className="text-base-content/50">CPU:</span>{" "}
                <span className="font-medium">{specs.cpu || "—"}</span>
              </div>
              <div>
                <span className="text-base-content/50">GPU:</span>{" "}
                <span className="font-medium">{specs.gpu || "—"}</span>
              </div>
              <div>
                <span className="text-base-content/50">RAM:</span>{" "}
                <span className="font-medium">{specs.ramGB ? `${specs.ramGB} GB` : "—"}</span>
              </div>
              <div>
                <span className="text-base-content/50">Storage:</span>{" "}
                <span className="font-medium">{specs.storageGB ? `${specs.storageGB} GB` : "—"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded specs editor */}
      {editingSpecs && (
        <SystemSpecs
          specs={specs}
          onChange={onChange}
          onSubmit={() => setEditingSpecs(false)}
          dirty={false}
          cpuList={cpuList}
          gpuList={gpuList}
          hideSubmit
        />
      )}

      {/* Game search */}
      <div className="w-full">
        <GameSearch onSelect={onGameSelect} />
      </div>

      {loading && (
        <div className="flex justify-center py-4">
          <span className="loading loading-bars loading-lg" />
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {game && (
        <div className="card bg-base-200 p-4">
          <div className="flex items-center gap-3">
            {game.headerImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={game.headerImage}
                alt={game.name}
                className="w-24 h-auto rounded"
              />
            )}
            <div>
              <p className="font-semibold">{game.name}</p>
              <p className="text-xs text-base-content/60">Ready to check compatibility</p>
            </div>
          </div>
        </div>
      )}

      {game && (
        <button
          className="btn btn-primary w-full"
          onClick={onCheckCompatibility}
          disabled={loading}
        >
          Check Compatibility &rarr;
        </button>
      )}
    </div>
  );
}
