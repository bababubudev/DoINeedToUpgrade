"use client";

import { useEffect, useState } from "react";
import { UserSpecs } from "@/types";
import { detectSpecs } from "@/lib/detectSpecs";
import AutocompleteInput from "./AutocompleteInput";
import { cpuList, gpuList, osList } from "@/lib/hardwareData";

interface Props {
  specs: UserSpecs;
  onChange: (specs: UserSpecs) => void;
}

export default function SystemSpecs({ specs, onChange }: Props) {
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    if (!detected) {
      const auto = detectSpecs();
      onChange({
        ...specs,
        os: auto.os || specs.os,
        gpu: auto.gpu || specs.gpu,
        cpuCores: auto.cpuCores ?? specs.cpuCores,
        ramGB: auto.ramGB ?? specs.ramGB,
      });
      setDetected(true);
    }
  }, [detected]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (field: keyof UserSpecs, value: string | number | null) => {
    onChange({ ...specs, [field]: value });
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Your System Specs</h2>
        <p className="text-sm text-base-content/60 mb-4">
          Auto-detected values are filled in. Override any field manually.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Operating System</span>
            </label>
            <AutocompleteInput
              value={specs.os}
              onChange={(v) => update("os", v)}
              options={osList}
              placeholder="e.g., Windows 10"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">CPU</span>
            </label>
            <AutocompleteInput
              value={specs.cpu}
              onChange={(v) => update("cpu", v)}
              options={cpuList}
              placeholder="e.g., Intel Core i7-12700K"
            />
            {specs.cpuCores && (
              <label className="label">
                <span className="label-text-alt">
                  {specs.cpuCores} cores detected
                </span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">GPU</span>
            </label>
            <AutocompleteInput
              value={specs.gpu}
              onChange={(v) => update("gpu", v)}
              options={gpuList}
              placeholder="e.g., NVIDIA RTX 4070"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">RAM (GB)</span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={specs.ramGB ?? ""}
              onChange={(e) =>
                update("ramGB", e.target.value ? parseFloat(e.target.value) : null)
              }
              placeholder="e.g., 16"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Available Storage (GB)</span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={specs.storageGB ?? ""}
              onChange={(e) =>
                update("storageGB", e.target.value ? parseFloat(e.target.value) : null)
              }
              placeholder="e.g., 500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
