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
  highlightEmpty?: boolean;
}

const sourceLabels: Record<DetectionSource, string> = {
  auto: "Auto-detected",
  script: "Detected via hardware scan",
};

export default function SystemSpecs({ specs, onChange, onSubmit, dirty, cpuList, gpuList, detecting, unmatchedFields = [], hideSubmit = false, highlightEmpty = false }: Props) {
  const isAuto = specs.detectionSource === "auto";
  const isScript = specs.detectionSource === "script";
  const manual = specs.manualFields ?? [];
  const isEstimated = (field: string) => isAuto && !manual.includes(field);
  const emptyClass = (isEmpty: boolean) =>
    highlightEmpty && isEmpty ? "!border-error animate-shake" : "";

  const update = (field: keyof UserSpecs, value: string | number | null) => {
    const updated = manual.includes(field) ? manual : [...manual, field];
    onChange({ ...specs, [field]: value, manualFields: updated });
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

        {!detecting && isAuto && specs.guessedFields && specs.guessedFields.length > 0 && (
          <div role="alert" className="alert alert-info text-sm">
            <HiInformationCircle className="h-5 w-5 shrink-0" />
            <span>
              We estimated your <strong>{specs.guessedFields.join(", ")}</strong> based on your Mac model.
              Please verify {specs.guessedFields.length === 1 ? "it is" : "they are"} correct or adjust below.
            </span>
          </div>
        )}

        {!detecting && isAuto && (() => {
          const nonGuessed = unmatchedFields.filter(f => !specs.guessedFields?.includes(f));
          return nonGuessed.length > 0 ? (
            <div role="alert" className="alert alert-warning text-sm">
              <HiExclamation className="h-5 w-5 shrink-0" />
              <span>
                Specs are estimated and may not be accurate. Download the hardware scanner above for precise detection.
              </span>
            </div>
          ) : null;
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Operating System</span>
              {!detecting && isEstimated("os") && specs.os && (
                <span className="label-text-alt text-warning">*Estimated</span>
              )}
            </label>
            <div className="relative">
              <AutocompleteInput
                value={specs.os}
                onChange={(v) => update("os", v)}
                onSubmit={onSubmit}
                options={osList}
                placeholder={detecting ? "Detecting..." : "e.g., Windows 10"}
                disabled={detecting}
                className={emptyClass(!specs.os.trim())}
              />
              {detecting && <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40" />}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">CPU</span>
              {!detecting && isEstimated("cpu") && specs.cpu && (
                <span className="label-text-alt text-warning">*Estimated</span>
              )}
            </label>
            <div className="relative">
              <AutocompleteInput
                value={specs.cpu}
                onChange={(v) => update("cpu", v)}
                onSubmit={onSubmit}
                options={cpuList}
                placeholder={detecting ? "Detecting..." : (specs.cpu ? "e.g., Intel Core i7-12700K" : "Not detectable — enter your CPU model")}
                disabled={detecting}
                className={emptyClass(!specs.cpu.trim())}
              />
              {detecting && <span className="loading loading-spinner loading-sm absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40" />}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">GPU</span>
              {!detecting && isEstimated("gpu") && specs.gpu && (
                <span className="label-text-alt text-warning">*Estimated</span>
              )}
            </label>
            <div className="relative">
              <AutocompleteInput
                value={specs.gpu}
                onChange={(v) => update("gpu", v)}
                onSubmit={onSubmit}
                options={gpuList}
                placeholder={detecting ? "Detecting..." : "e.g., NVIDIA RTX 4070"}
                disabled={detecting}
                className={emptyClass(!specs.gpu.trim())}
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
              {!detecting && isEstimated("ramGB") && specs.ramGB != null && (
                <span className="label-text-alt text-warning">*Estimated</span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                className={`input input-bordered w-full ${emptyClass(specs.ramGB == null)}`}
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
              {!detecting && isEstimated("storageGB") && (
                <span className="label-text-alt text-warning">*Estimated</span>
              )}
            </label>
            <div className="relative">
              <input
                type="number"
                className={`input input-bordered w-full ${emptyClass(specs.storageGB == null)}`}
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
