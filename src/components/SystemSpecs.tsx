"use client";

import { UserSpecs } from "@/types";
import AutocompleteInput from "./AutocompleteInput";
import { osList } from "@/lib/hardwareData";

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
                : "Auto-detected specs. Edit if needed."}
            </p>
          </div>
          {!hideSubmit && (
            <button
              className="btn btn-primary btn-sm"
              onClick={onSubmit}
              disabled={!dirty}
              title="Recheck compatibility"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recheck
            </button>
          )}
        </div>

        {!detecting && unmatchedFields.length > 0 && (
          <div role="alert" className="alert alert-warning text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>
              Could not accurately auto-detect your <strong>{unmatchedFields.join(", ")}</strong>.
              Please enter {unmatchedFields.length === 1 ? "it" : "them"} manually using the fields below for accurate comparison.
            </span>
          </div>
        )}

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
                placeholder={detecting ? "Detecting..." : "e.g., Intel Core i7-12700K"}
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
              <span className="label-text">RAM (GB)</span>
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
