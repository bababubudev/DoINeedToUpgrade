"use client";

import { UserSpecs, DetectionSource } from "@/types";
import AutocompleteInput from "./AutocompleteInput";
import { osList } from "@/lib/hardwareData";
import { HiRefresh, HiExclamation, HiInformationCircle } from "react-icons/hi";

interface Props {
  specs: UserSpecs;
  onChange: (specs: UserSpecs) => void;
  onSubmit: () => void;
  dirty: boolean;
  cpuList: string[];
  gpuList: string[];
  detecting?: boolean;
  unmatchedFields?: string[];
  hideSubmit?: boolean;
}

const sourceLabels: Record<DetectionSource, string> = {
  auto: "Auto-detected",
  script: "Detected via hardware scan",
};

export default function SystemSpecs({ specs, onChange, onSubmit, dirty, cpuList, gpuList, detecting, unmatchedFields = [], hideSubmit = false }: Props) {
  const update = (field: keyof UserSpecs, value: string | number | null) => {
    onChange({ ...specs, [field]: value });
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="card-title">Your System Specs</h2>
            <p className="text-sm text-base-content/70">
              {detecting
                ? "Detecting your hardware..."
                : `${sourceLabels[specs.detectionSource ?? "auto"]} specs. Edit if needed.`}
            </p>
          </div>
          {!hideSubmit && (
            <button
              className="btn btn-primary btn-sm"
              onClick={onSubmit}
              disabled={!dirty}
              title="Recheck compatibility"
            >
              <HiRefresh className="w-4 h-4" />
              Recheck
            </button>
          )}
        </div>

        {!detecting && specs.guessedFields && specs.guessedFields.length > 0 && (
          <div role="alert" className="alert alert-info text-sm">
            <HiInformationCircle className="h-5 w-5 shrink-0" />
            <span>
              We estimated your <strong>{specs.guessedFields.join(", ")}</strong> based on your Mac model.
              Please verify {specs.guessedFields.length === 1 ? "it is" : "they are"} correct or adjust below.
            </span>
          </div>
        )}

        {!detecting && (() => {
          const nonGuessed = unmatchedFields.filter(f => !specs.guessedFields?.includes(f));
          return nonGuessed.length > 0 ? (
            <div role="alert" className="alert alert-warning text-sm">
              <HiExclamation className="h-5 w-5 shrink-0" />
              <span>
                Could not accurately auto-detect your <strong>{nonGuessed.join(", ")}</strong>.
                Please enter {nonGuessed.length === 1 ? "it" : "them"} manually using the fields below for accurate comparison.
              </span>
            </div>
          ) : null;
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Operating System</span>
            </label>
            <div className="relative">
              <AutocompleteInput
                value={specs.os}
                onChange={(v) => update("os", v)}
                onSubmit={onSubmit}
                options={osList}
                placeholder={detecting ? "Detecting..." : "e.g., Windows 10"}
                disabled={detecting}
              />
              {detecting && <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40" />}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">CPU</span>
            </label>
            <div className="relative">
              <AutocompleteInput
                value={specs.cpu}
                onChange={(v) => update("cpu", v)}
                onSubmit={onSubmit}
                options={cpuList}
                placeholder={detecting ? "Detecting..." : (specs.cpu ? "e.g., Intel Core i7-12700K" : "Not detectable — enter your CPU model")}
                disabled={detecting}
              />
              {detecting && <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40" />}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">GPU</span>
            </label>
            <div className="relative">
              <AutocompleteInput
                value={specs.gpu}
                onChange={(v) => update("gpu", v)}
                onSubmit={onSubmit}
                options={gpuList}
                placeholder={detecting ? "Detecting..." : "e.g., NVIDIA RTX 4070"}
                disabled={detecting}
              />
              {detecting && <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40" />}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">
                RAM (GB)
                {!detecting && specs.ramApproximate && specs.ramGB != null && (
                  <span className="text-base-content/50 font-normal"> (~{specs.ramGB} GB approximate)</span>
                )}
              </span>
              {!detecting && specs.ramGB != null && specs.ramGB <= 8 && (
                <span className="label-text-alt text-warning">Browser may underreport</span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                className="input input-bordered w-full"
                value={specs.ramGB ?? ""}
                onChange={(e) =>
                  update("ramGB", e.target.value ? parseFloat(e.target.value) : null)
                }
                onKeyDown={handleKeyDown}
                placeholder={detecting ? "Detecting..." : "e.g., 16"}
                disabled={detecting}
              />
              {detecting && <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40" />}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Available Storage (GB)</span>
              {!detecting && (
                <span className="label-text-alt text-warning">Estimated — verify manually</span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                className="input input-bordered w-full"
                value={specs.storageGB ?? ""}
                onChange={(e) =>
                  update("storageGB", e.target.value ? parseFloat(e.target.value) : null)
                }
                onKeyDown={handleKeyDown}
                placeholder={detecting ? "Detecting..." : "e.g., 500"}
                disabled={detecting}
              />
              {detecting && <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
