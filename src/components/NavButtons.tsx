"use client";

import { useState, useEffect } from "react";
import { HiDownload, HiInformationCircle } from "react-icons/hi";

type ClientPlatform = "windows" | "macos" | "linux";

function detectClientPlatform(): ClientPlatform {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";
  return "windows";
}

const platformInfo: Record<ClientPlatform, { label: string; file: string }> = {
  windows: { label: "Windows (.ps1)", file: "/scripts/detect-specs.ps1" },
  macos: { label: "macOS (.sh)", file: "/scripts/detect-specs.sh" },
  linux: { label: "Linux (.sh)", file: "/scripts/detect-specs.sh" },
};

export default function NavButtons() {
  const [modalOpen, setModalOpen] = useState(false);
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>("windows");

  useEffect(() => {
    setClientPlatform(detectClientPlatform());
  }, []);

  const platforms: ClientPlatform[] = ["windows", "macos", "linux"];
  const sorted = [clientPlatform, ...platforms.filter((p) => p !== clientPlatform)];

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setModalOpen(true)}
      >
        <HiInformationCircle className="w-4 h-4" />
        <span className="hidden sm:inline">How It Works</span>
      </button>

      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
          <HiDownload className="w-4 h-4" />
          <span className="hidden sm:inline">Download Scanner</span>
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-200 rounded-box z-50 w-56 p-2 shadow-lg"
        >
          {sorted.map((p) => {
            const info = platformInfo[p];
            const isUser = p === clientPlatform;
            return (
              <li key={p}>
                <a href={info.file} download className={isUser ? "active" : ""}>
                  {info.label}
                  {isUser && " (Your OS)"}
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>

            <h3 className="text-xl font-bold">How the Hardware Scanner Works</h3>

            <div className="py-4 space-y-4 text-sm text-base-content/80">
              <div>
                <h4 className="font-semibold text-base-content mb-1">What it detects</h4>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Operating system name &amp; version</li>
                  <li>CPU model &amp; core count</li>
                  <li>GPU model</li>
                  <li>Total RAM</li>
                  <li>Free storage space</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-base-content mb-1">How it detects them</h4>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Windows (PowerShell):</span>{" "}
                    Uses <code className="text-xs bg-base-200 px-1 rounded">Get-CimInstance</code> WMI queries
                    (Win32_OperatingSystem, Win32_Processor, Win32_VideoController, Win32_ComputerSystem, Win32_LogicalDisk)
                  </div>
                  <div>
                    <span className="font-medium">macOS:</span>{" "}
                    Uses <code className="text-xs bg-base-200 px-1 rounded">sw_vers</code>,{" "}
                    <code className="text-xs bg-base-200 px-1 rounded">sysctl</code>,{" "}
                    <code className="text-xs bg-base-200 px-1 rounded">system_profiler</code>, and{" "}
                    <code className="text-xs bg-base-200 px-1 rounded">df</code>
                  </div>
                  <div>
                    <span className="font-medium">Linux:</span>{" "}
                    Reads <code className="text-xs bg-base-200 px-1 rounded">/etc/os-release</code>,{" "}
                    <code className="text-xs bg-base-200 px-1 rounded">lscpu</code> or{" "}
                    <code className="text-xs bg-base-200 px-1 rounded">/proc/cpuinfo</code>,{" "}
                    <code className="text-xs bg-base-200 px-1 rounded">lspci</code>,{" "}
                    <code className="text-xs bg-base-200 px-1 rounded">/proc/meminfo</code>, and{" "}
                    <code className="text-xs bg-base-200 px-1 rounded">df</code>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-base-content mb-1">What it outputs</h4>
                <p>
                  The script produces a Base64-encoded JSON string prefixed with{" "}
                  <code className="text-xs bg-base-200 px-1 rounded">DINAU:</code>.
                  Nothing is sent to any server — you manually copy and paste the output
                  into this site.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-base-content mb-1">Open source</h4>
                <p>
                  The scripts are fully open-source and can be inspected before running:
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <a
                    href="/scripts/detect-specs.ps1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary text-xs"
                  >
                    View Windows script (detect-specs.ps1)
                  </a>
                  <a
                    href="/scripts/detect-specs.sh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary text-xs"
                  >
                    View macOS/Linux script (detect-specs.sh)
                  </a>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setModalOpen(false)} />
        </div>
      )}
    </>
  );
}
