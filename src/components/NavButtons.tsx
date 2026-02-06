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

const downloadLinks = {
  windows: { label: "Windows", file: "/downloads/DoINeedAnUpgrade.exe" },
  macos: [
    { label: "macOS (Apple Silicon)", file: "/downloads/DoINeedAnUpgrade-Mac-AppleSilicon.zip" },
    { label: "macOS (Intel)", file: "/downloads/DoINeedAnUpgrade-Mac-Intel.zip" },
  ],
  linux: { label: "Linux", file: "/downloads/DoINeedAnUpgrade-Linux" },
};

export default function NavButtons() {
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [clientPlatform, setClientPlatform] = useState<ClientPlatform>("windows");

  useEffect(() => {
    setClientPlatform(detectClientPlatform());
  }, []);

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
        <button
          tabIndex={0}
          className="btn btn-ghost btn-sm"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <HiDownload className="w-4 h-4" />
          <span className="hidden sm:inline">Download Scanner</span>
        </button>
        {dropdownOpen && (
          <ul
            tabIndex={0}
            className="dropdown-content z-50 menu p-2 shadow-lg bg-base-200 rounded-box w-56 mt-2"
          >
            {clientPlatform === "macos" ? (
              downloadLinks.macos.map((link) => (
                <li key={link.file}>
                  <a href={link.file} download onClick={() => setDropdownOpen(false)}>
                    {link.label}
                  </a>
                </li>
              ))
            ) : (
              <li>
                <a
                  href={downloadLinks[clientPlatform].file}
                  download
                  onClick={() => setDropdownOpen(false)}
                >
                  {downloadLinks[clientPlatform].label}
                </a>
              </li>
            )}
            <li className="menu-title mt-2">
              <span className="text-xs">Other platforms</span>
            </li>
            {clientPlatform !== "windows" && (
              <li>
                <a href={downloadLinks.windows.file} download onClick={() => setDropdownOpen(false)}>
                  Windows
                </a>
              </li>
            )}
            {clientPlatform !== "macos" && (
              <>
                <li>
                  <a href={downloadLinks.macos[0].file} download onClick={() => setDropdownOpen(false)}>
                    macOS (Apple Silicon)
                  </a>
                </li>
                <li>
                  <a href={downloadLinks.macos[1].file} download onClick={() => setDropdownOpen(false)}>
                    macOS (Intel)
                  </a>
                </li>
              </>
            )}
            {clientPlatform !== "linux" && (
              <li>
                <a href={downloadLinks.linux.file} download onClick={() => setDropdownOpen(false)}>
                  Linux
                </a>
              </li>
            )}
          </ul>
        )}
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

            <h3 className="text-xl font-bold">How It Works</h3>

            <div className="py-4 space-y-4 text-sm text-base-content/80">
              <div>
                <h4 className="font-semibold text-base-content mb-1">1. Enter your system specs</h4>
                <p>
                  We auto-detect your hardware from your browser when possible. For more accurate
                  results, download and run our scanner app which detects your exact CPU, GPU,
                  RAM, and available storage.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-base-content mb-1">2. Search for a game</h4>
                <p>
                  Search for any Steam game by name. We fetch the official system requirements
                  directly from Steam, including minimum and recommended specs for Windows,
                  macOS, and Linux.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-base-content mb-1">3. Get your results</h4>
                <p>
                  We compare your hardware against the game&apos;s requirements using benchmark
                  data for CPUs and GPUs. You&apos;ll see a clear breakdown of which components
                  meet, exceed, or fall short of the requirements.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-base-content mb-1">About the scanner app</h4>
                <p>
                  The optional scanner app reads your hardware info locally and opens this
                  website with your specs pre-filled. It&apos;s fully open-source and doesn&apos;t
                  send data anywhere.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <a
                    href="https://github.com/bababubudev/DoINeedToUpgrade/tree/main/scanner"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary text-xs"
                  >
                    View source code on GitHub
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
