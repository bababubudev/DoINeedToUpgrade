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
}

export default function SystemSpecs({ specs, onChange, onSubmit, dirty, cpuList, gpuList, detecting }: Props) {
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
            <p className="text-sm text-base-content/60">
              {detecting
                ? "Detecting your hardware..."
                : "Auto-detected specs. Edit if needed."}
            </p>
          </div>
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
        </div>

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
