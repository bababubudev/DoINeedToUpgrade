"use client";

import { useState, useEffect } from "react";
import { UserSpecs } from "@/types";
import { decodeSpecsPayload } from "@/lib/decodeSpecsPayload";
import { HiChevronDown, HiCheckCircle, HiExclamation, HiDownload } from "react-icons/hi";

interface Props {
  onImport: (specs: UserSpecs) => void;
}

type ClientPlatform = "windows" | "macos" | "linux";

function detectClientPlatform(): ClientPlatform {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "windows";
}

const platformInfo: Record<ClientPlatform, { label: string; file: string; instructions: string }> = {
  windows: {
    label: "Windows",
    file: "/scripts/detect-specs.ps1",
    instructions: "Right-click the downloaded file and select \"Run with PowerShell\", or run in terminal: powershell -ExecutionPolicy Bypass -File detect-specs.ps1",
  },
  macos: {
    label: "macOS",
    file: "/scripts/detect-specs.sh",
    instructions: "Open Terminal, then run: chmod +x ~/Downloads/detect-specs.sh && ~/Downloads/detect-specs.sh",
  },
  linux: {
    label: "Linux",
    file: "/scripts/detect-specs.sh",
    instructions: "Open a terminal, then run: chmod +x ~/Downloads/detect-specs.sh && ~/Downloads/detect-specs.sh",
  },
};

export default function HardwareScanner({ onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>("windows");

  useEffect(() => {
    setClientPlatform(detectClientPlatform());
  }, []);

  const [toast, setToast] = useState(false);

  function handleImport() {
    const result = decodeSpecsPayload(pasteValue);
    if (result) {
      setStatus("success");
      onImport(result);
      setOpen(false);
      setToast(true);
      setTimeout(() => setToast(false), 3000);
    } else {
      setStatus("error");
    }
  }

  function handlePasteChange(value: string) {
    setPasteValue(value);
    if (status !== "idle") setStatus("idle");
  }

  const platforms: ClientPlatform[] = ["windows", "macos", "linux"];
  // Put user's platform first
  const sorted = [clientPlatform, ...platforms.filter((p) => p !== clientPlatform)];

  return (
    <>
    <div className="card bg-base-100 shadow-sm">
      <div
        className="card-body p-4 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Need more accurate detection?</h3>
            <p className="text-xs text-base-content/60">
              Download and run a script to detect your exact hardware specs
            </p>
          </div>
          <HiChevronDown
            className={`w-5 h-5 text-base-content/50 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
          <div className="divider my-0" />

          {/* Download buttons */}
          <div>
            <p className="text-sm font-medium mb-2">1. Download the script for your platform:</p>
            <div className="flex flex-wrap gap-2">
              {sorted.map((p) => {
                const info = platformInfo[p];
                const isUserPlatform = p === clientPlatform;
                return (
                  <a
                    key={p}
                    href={info.file}
                    download
                    className={`btn btn-sm ${isUserPlatform ? "btn-primary" : "btn-outline"}`}
                  >
                    {isUserPlatform && <HiDownload className="w-4 h-4" />}
                    {info.label}
                    {isUserPlatform && " (Your OS)"}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <p className="text-sm font-medium mb-1">2. Run the script:</p>
            <div className="text-xs bg-base-200 rounded-lg p-3 space-y-1">
              {sorted.map((p) => (
                <div key={p}>
                  <span className="font-semibold">{platformInfo[p].label}:</span>{" "}
                  <code className="text-base-content/80">{platformInfo[p].instructions}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Paste input */}
          <div>
            <p className="text-sm font-medium mb-1">3. Paste the output code here:</p>
            <div className="flex gap-2">
              <input
                type="text"
                className={`input input-bordered input-sm flex-1 font-mono text-xs ${
                  status === "error" ? "input-error" : status === "success" ? "input-success" : ""
                }`}
                placeholder="DINAU:..."
                value={pasteValue}
                onChange={(e) => handlePasteChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleImport();
                  }
                }}
              />
              <button
                className="btn btn-sm btn-primary"
                onClick={handleImport}
                disabled={!pasteValue.trim()}
              >
                Import
              </button>
            </div>
            {status === "success" && (
              <p className="text-xs text-success mt-1 flex items-center gap-1">
                <HiCheckCircle className="w-4 h-4" />
                Hardware specs imported successfully!
              </p>
            )}
            {status === "error" && (
              <p className="text-xs text-error mt-1 flex items-center gap-1">
                <HiExclamation className="w-4 h-4" />
                Invalid code. Make sure you copied the entire DINAU:... string.
              </p>
            )}
          </div>
        </div>
      )}
    </div>

      {toast && (
        <div className="toast toast-end toast-bottom z-50">
          <div className="alert alert-success text-sm py-2 px-4 flex items-center gap-2">
            <HiCheckCircle className="w-5 h-5" />
            <span>Hardware specs imported successfully!</span>
          </div>
        </div>
      )}
    </>
  );
}
