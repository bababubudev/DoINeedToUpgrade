"use client";

import { GameRequirements } from "@/types";
import { cpuList, gpuList } from "@/lib/hardwareData";
import AutocompleteInput from "@/components/AutocompleteInput";

interface Props {
  minimum: GameRequirements | null;
  recommended: GameRequirements | null;
  onChange: (min: GameRequirements, rec: GameRequirements) => void;
  onSubmit: () => void;
}

const emptyReqs: GameRequirements = {
  os: "",
  cpu: "",
  gpu: "",
  ram: "",
  storage: "",
};

const FIELDS: { key: keyof GameRequirements; label: string }[] = [
  { key: "os", label: "OS" },
  { key: "cpu", label: "Processor" },
  { key: "gpu", label: "Graphics" },
  { key: "ram", label: "Memory" },
  { key: "storage", label: "Storage" },
];

export default function RequirementsEditor({
  minimum,
  recommended,
  onChange,
  onSubmit,
}: Props) {
  const min = minimum ?? emptyReqs;
  const rec = recommended ?? emptyReqs;

  function updateMin(key: keyof GameRequirements, value: string) {
    onChange({ ...min, [key]: value }, rec);
  }

  function updateRec(key: keyof GameRequirements, value: string) {
    onChange(min, { ...rec, [key]: value });
  }

  function clearAll() {
    onChange({ ...emptyReqs }, { ...emptyReqs });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  }

  function renderField(
    key: keyof GameRequirements,
    label: string,
    value: string,
    onFieldChange: (val: string) => void
  ) {
    if (key === "cpu") {
      return (
        <AutocompleteInput
          value={value}
          onChange={onFieldChange}
          onSubmit={onSubmit}
          options={cpuList}
          placeholder={label}
        />
      );
    }
    if (key === "gpu") {
      return (
        <AutocompleteInput
          value={value}
          onChange={onFieldChange}
          onSubmit={onSubmit}
          options={gpuList}
          placeholder={label}
        />
      );
    }
    return (
      <input
        type="text"
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => onFieldChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={label}
      />
    );
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="card-title text-lg">Game Requirements</h3>
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Minimum column */}
          <div>
            <h4 className="font-semibold mb-2 text-sm opacity-70">Minimum</h4>
            <div className="flex flex-col gap-2">
              {FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="label py-0.5">
                    <span className="label-text text-xs">{label}</span>
                  </label>
                  {renderField(key, label, min[key], (v) => updateMin(key, v))}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended column */}
          <div>
            <h4 className="font-semibold mb-2 text-sm opacity-70">
              Recommended
            </h4>
            <div className="flex flex-col gap-2">
              {FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="label py-0.5">
                    <span className="label-text text-xs">{label}</span>
                  </label>
                  {renderField(key, label, rec[key], (v) => updateRec(key, v))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button className="btn btn-primary btn-sm" onClick={onSubmit}>
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
