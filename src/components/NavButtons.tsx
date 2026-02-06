"use client";

import { useState } from "react";
import { HiDownload, HiInformationCircle } from "react-icons/hi";

export default function NavButtons() {
  const [modalOpen, setModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  function handleDownloadClick() {
    const scannerSection = document.getElementById("hardware-scanner");
    if (scannerSection) {
      scannerSection.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
    }
  }

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setModalOpen(true)}
      >
        <HiInformationCircle className="w-4 h-4" />
        <span className="hidden sm:inline">How It Works</span>
      </button>

      <div className="relative">
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleDownloadClick}
        >
          <HiDownload className="w-4 h-4" />
          <span className="hidden sm:inline">Download Scanner</span>
        </button>
        {showTooltip && (
          <div className="absolute right-0 top-full mt-2 z-50 bg-base-200 text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            Select a game first to access the scanner
          </div>
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
                <p>
                  The scanner app uses native system APIs to read your hardware information.
                  On Windows, it queries WMI. On macOS, it uses system_profiler and sysctl.
                  On Linux, it reads /proc and uses lspci.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-base-content mb-1">What happens when you run it</h4>
                <p>
                  The scanner app detects your hardware specs and automatically opens this
                  website with your specs pre-filled. No data is sent to any external server
                  — everything stays local until you choose to check a game.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-base-content mb-1">Open source</h4>
                <p>
                  The scanner app is fully open-source and can be inspected before running:
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <a
                    href="https://github.com/DaiYuAmbwororth/DoINeedAnUpgrade/tree/main/scanner"
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
