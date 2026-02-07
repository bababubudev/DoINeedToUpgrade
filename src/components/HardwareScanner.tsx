"use client";

import { useState, useEffect } from "react";
import { UserSpecs } from "@/types";
import { decodeSpecsPayload } from "@/lib/decodeSpecsPayload";
import { HiChevronDown, HiCheckCircle, HiExclamation, HiDownload, HiClipboardCopy, HiClipboard } from "react-icons/hi";

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

type PlatformInfo = {
  label: string;
  appFiles: { label: string; file: string }[];
  appInstructions: string;
  macosFixCommand?: string;
};

const platformInfo: Record<ClientPlatform, PlatformInfo> = {
  windows: {
    label: "Windows",
    appFiles: [{ label: "Windows", file: "/downloads/DoINeedAnUpgrade.exe" }],
    appInstructions: "Double-click the downloaded file to run",
  },
  macos: {
    label: "macOS",
    appFiles: [
      { label: "Apple Silicon (M1/M2/M3)", file: "/downloads/DoINeedAnUpgrade-Mac-AppleSilicon.zip" },
      { label: "Intel Mac", file: "/downloads/DoINeedAnUpgrade-Mac-Intel.zip" },
    ],
    appInstructions: "Unzip the file, then run this command in Terminal to open the app:",
    macosFixCommand: "xattr -cr ~/Downloads/DoINeedAnUpgrade-Mac-*.app && open ~/Downloads/DoINeedAnUpgrade-Mac-*.app",
  },
  linux: {
    label: "Linux",
    appFiles: [{ label: "Linux", file: "/downloads/DoINeedAnUpgrade-Linux.tar.gz" }],
    appInstructions: "Extract the archive, then double-click the executable to run",
  },
};

export default function HardwareScanner({ onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>("windows");
  const [copied, setCopied] = useState(false);

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

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setPasteValue(text);
      // Auto-import if valid
      const result = decodeSpecsPayload(text);
      if (result) {
        setStatus("success");
        onImport(result);
        setOpen(false);
        setToast(true);
        setTimeout(() => setToast(false), 3000);
      } else if (text.trim()) {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const info = platformInfo[clientPlatform];

  return (
    <>
    <div id="hardware-scanner" className="card bg-base-100 shadow-sm">
      <div
        className="card-body p-4 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Need more accurate detection?</h3>
            <p className="text-xs text-base-content/60">
              Run a quick scan to detect your exact hardware specs
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

          {/* Easy method - download and run */}
          <div className="bg-base-200 rounded-lg p-4">
            <p className="text-sm font-medium mb-3">
              Quick scan for {info.label}:
            </p>
            <div className="flex flex-col gap-3">
              <div className={`flex gap-2 ${info.appFiles.length > 1 ? "flex-col sm:flex-row" : ""}`}>
                {info.appFiles.map((app) => (
                  <a
                    key={app.file}
                    href={app.file}
                    download
                    className={`btn btn-primary btn-sm ${info.appFiles.length === 1 ? "w-full" : "flex-1"}`}
                  >
                    <HiDownload className="w-4 h-4" />
                    {info.appFiles.length > 1 ? app.label : "Download Scanner"}
                  </a>
                ))}
              </div>
              <p className="text-xs text-base-content/70">
                {info.appInstructions}
              </p>
              {info.macosFixCommand && (
                <div className="flex gap-2 items-center">
                  <code className="flex-1 bg-base-300 p-2 rounded font-mono text-xs overflow-x-auto whitespace-nowrap">
                    {info.macosFixCommand}
                  </code>
                  <button
                    className="btn btn-xs btn-outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(info.macosFixCommand!);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <HiCheckCircle className="w-3 h-3" /> : <HiClipboardCopy className="w-3 h-3" />}
                  </button>
                </div>
              )}
              <p className="text-xs text-base-content/60">
                The scanner will detect your specs and open this page with them imported automatically.
              </p>
            </div>
          </div>

          {/* Paste from clipboard - fallback */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-base-300" />
            <span className="text-xs text-base-content/50">or paste manually</span>
            <div className="flex-1 h-px bg-base-300" />
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-outline flex-1"
              onClick={handlePasteFromClipboard}
            >
              <HiClipboard className="w-4 h-4" />
              Paste from Clipboard
            </button>
          </div>

          {/* Manual paste input */}
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
            <p className="text-xs text-success flex items-center gap-1">
              <HiCheckCircle className="w-4 h-4" />
              Hardware specs imported successfully!
            </p>
          )}
          {status === "error" && (
            <p className="text-xs text-error flex items-center gap-1">
              <HiExclamation className="w-4 h-4" />
              Invalid code. Make sure you copied the entire DINAU:... string.
            </p>
          )}
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
