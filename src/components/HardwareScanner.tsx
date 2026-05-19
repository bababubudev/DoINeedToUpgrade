"use client";

import { useState, useEffect, useRef } from "react";
import { UserSpecs } from "@/types";
import { decodeSpecsPayload } from "@/lib/decodeSpecsPayload";
import { HiCheckCircle, HiExclamation, HiDownload, HiClipboard, HiClipboardCopy } from "react-icons/hi";

interface Props {
  onImport: (specs: UserSpecs) => void;
  onDownload?: () => void;
}

type ClientPlatform = "windows" | "macos" | "linux";

function detectClientPlatform(): ClientPlatform {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "windows";
}

type StepGroup = {
  primary: React.ReactNode;
  alternatives?: {
    text: React.ReactNode;
    terminalCommand?: string;
  }[];
};

type PlatformInfo = {
  label: string;
  appFiles: { label: string; file: string }[];
  terminalCommand: { label: string; command: string };
  stepGroups: StepGroup[];
};

const platformInfo: Record<ClientPlatform, PlatformInfo> = {
  windows: {
    label: "Windows",
    appFiles: [{ label: "Windows", file: "/downloads/DoINeedToUpgrade.exe" }],
    terminalCommand: { label: "PowerShell", command: "irm {BASE}/api/scan.ps1 | iex" },
    stepGroups: [
      { primary: "Double-click the downloaded file to run." },
      { primary: "The scanner will detect your specs and open this page with them imported automatically." },
    ],
  },
  macos: {
    label: "macOS",
    appFiles: [
      { label: "Apple Silicon (M1/M2/M3)", file: "/downloads/DoINeedToUpgrade-Mac-AppleSilicon.dmg" },
      { label: "Intel Mac", file: "/downloads/DoINeedToUpgrade-Mac-Intel.dmg" },
    ],
    terminalCommand: { label: "Terminal", command: "curl -s {BASE}/api/scan | bash" },
    stepGroups: [
      { primary: "Open the .dmg and drag the app to Applications." },
      {
        primary: <>On first launch, go to <strong>System Settings → Privacy &amp; Security</strong> and click <strong>&quot;Open Anyway&quot;</strong>.</>,
        alternatives: [{
          text: "Remove the quarantine and open via Terminal:",
          terminalCommand: "xattr -d com.apple.quarantine /Applications/DoINeedToUpgrade*.app && open /Applications/DoINeedToUpgrade*.app",
        }],
      },
      { primary: "The scanner will detect your specs and open this page with them imported automatically." },
    ],
  },
  linux: {
    label: "Linux",
    appFiles: [
      { label: ".deb (Ubuntu/Debian)", file: "/downloads/DoINeedToUpgrade-Linux.deb" },
      { label: ".AppImage (Other)", file: "/downloads/DoINeedToUpgrade-Linux.AppImage" },
    ],
    terminalCommand: { label: "Terminal", command: "curl -s {BASE}/api/scan | bash" },
    stepGroups: [
      {
        primary: "For .deb: right-click → Open With → Software Install, then click Install.",
        alternatives: [{
          text: "For AppImage: right-click → Properties → mark as executable, then double-click.",
        }],
      },
      { primary: "The scanner will detect your specs and open this page with them imported automatically." },
    ],
  },
};

export default function HardwareScanner({ onImport, onDownload }: Props) {
  const collapseRef = useRef<HTMLInputElement>(null);
  const [pasteValue, setPasteValue] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>("windows");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    setClientPlatform(detectClientPlatform());
  }, []);

  function closeCollapse() {
    if (collapseRef.current) collapseRef.current.checked = false;
  }

  function handleImport() {
    const result = decodeSpecsPayload(pasteValue);
    if (result) {
      setStatus("success");
      onImport(result);
      closeCollapse();
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
      const result = decodeSpecsPayload(text);
      if (result) {
        setStatus("success");
        onImport(result);
        closeCollapse();
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
      <div id="hardware-scanner" className="collapse collapse-arrow bg-base-100/80 backdrop-blur-sm shadow-sm w-full max-w-full overflow-hidden">
        <input type="checkbox" ref={collapseRef} />
        <div className="collapse-title !pl-3 sm:!pl-4 !pr-10">
          <h3 className="font-semibold text-sm">Need more accurate detection?</h3>
          <p className="text-xs text-base-content/60">
            Run a quick scan to detect your exact hardware specs
          </p>
        </div>
        <div className="collapse-content !px-3 sm:!px-4 flex flex-col gap-4">
          {/* Terminal command section (primary) */}
          <div className="bg-base-200 rounded-lg p-3 sm:p-4 w-full max-w-full overflow-hidden">
            <p className="text-sm font-medium mb-3">
              Run in {info.terminalCommand.label}:
            </p>
            <div className="relative w-full max-w-full">
              <div className="w-full bg-base-300 rounded-lg pl-3 pr-12 sm:pr-14 py-2 overflow-x-auto scrollbar-subtle">
                <code className="font-mono text-xs whitespace-nowrap">
                  {info.terminalCommand.command.replace("{BASE}", typeof window !== "undefined" ? window.location.origin : "")}
                </code>
              </div>
              <button
                className="btn btn-sm btn-primary btn-square absolute right-1 top-1/2 -translate-y-1/2"
                onClick={async () => {
                  const cmd = info.terminalCommand.command.replace("{BASE}", window.location.origin);
                  await navigator.clipboard.writeText(cmd);
                  onDownload?.();
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                aria-label="Copy command"
              >
                {copied ? <HiCheckCircle className="w-5 h-5" /> : <HiClipboardCopy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-base-content/60 mt-2 break-words">
              Detects your hardware and opens this page with specs imported.
            </p>
          </div>

          {/* Divider between terminal and download */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-base-300" />
            <span className="text-xs text-base-content/50">or download the app</span>
            <div className="flex-1 h-px bg-base-300" />
          </div>

          {/* Download section */}
          <div className="bg-base-200 rounded-lg p-3 sm:p-4 w-full max-w-full overflow-hidden">
            <p className="text-sm font-medium mb-3">
              Quick scan for {info.label}:
            </p>
            <div className="flex flex-col gap-3">
              <div className={`flex gap-2 ${info.appFiles.length > 1 ? "flex-col sm:flex-row" : ""}`}>
                {info.appFiles.map((app) => (
                  <a
                    key={app.file}
                    href={app.file}
                    className={`btn btn-primary btn-sm ${info.appFiles.length === 1 ? "w-full" : "flex-1"}`}
                    onClick={() => onDownload?.()}
                  >
                    <HiDownload className="w-4 h-4" />
                    {info.appFiles.length > 1 ? app.label : "Download Scanner"}
                  </a>
                ))}
              </div>

              {/* Structured instructions */}
              {info.stepGroups.map((group, groupIdx) => (
                <div key={groupIdx} className={``}>
                  {group.alternatives ? (
                    <div className="flex items-start gap-2">
                      <span className="badge badge-neutral text-neutral-content w-5 h-5 rounded-full p-0 mt-3 shrink-0 text-xs">{groupIdx + 1}</span>
                      <div className="flex-1 min-w-0 flex flex-col gap-2 rounded-lg p-3" style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
                        <span className="text-xs break-words">{group.primary}</span>
                        {group.alternatives.map((alt, altIdx) => (
                          <div key={altIdx} className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-px bg-base-300" />
                              <span className="text-xs text-base-content/50 whitespace-nowrap">OR ALTERNATIVELY</span>
                              <div className="flex-1 h-px bg-base-300" />
                            </div>
                            {alt.terminalCommand ? (
                              <div className="w-full max-w-full">
                                <p className="text-xs mb-1.5 break-words">{alt.text}</p>
                                <div className="relative w-full max-w-full">
                                  <div className="w-full bg-base-300 rounded-lg pl-3 pr-12 sm:pr-14 py-2 overflow-x-auto scrollbar-subtle">
                                    <code className="font-mono text-xs whitespace-nowrap">
                                      {alt.terminalCommand}
                                    </code>
                                  </div>
                                  <button
                                    className="btn btn-sm btn-ghost btn-square bg-base-200 absolute right-1 top-1/2 -translate-y-1/2"
                                    onClick={async () => {
                                      await navigator.clipboard.writeText(alt.terminalCommand!);
                                      setCopied(true);
                                      setTimeout(() => setCopied(false), 2000);
                                    }}
                                    aria-label="Copy command"
                                  >
                                    {copied ? <HiCheckCircle className="w-5 h-5 text-primary" /> : <HiClipboardCopy className="w-5 h-5 text-base-content" />}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs">{alt.text}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className="badge badge-neutral text-neutral-content w-5 h-5 rounded-full p-0 shrink-0 text-xs mt-0.5">{groupIdx + 1}</span>
                      <span className="text-xs flex-1 min-w-0 break-words">{group.primary}</span>
                    </div>
                  )}
                </div>
              ))}
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
              className={`input input-bordered input-sm flex-1 min-w-0 font-mono text-xs ${status === "error" ? "input-error" : status === "success" ? "input-success" : ""
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
