"use client";

import { useState, useEffect } from "react";
import { UserSpecs, GameDetails, Platform, PlaySettings } from "@/types";
import SystemSpecs from "@/components/SystemSpecs";
import HardwareScanner from "@/components/HardwareScanner";
import { HiX, HiCheckCircle, HiExclamation } from "react-icons/hi";
import { savePendingGame } from "@/lib/pendingGameCheck";

interface Props {
  specs: UserSpecs;
  onChange: (specs: UserSpecs) => void;
  dirty: boolean;
  cpuList: string[];
  gpuList: string[];
  detecting: boolean;
  unmatchedFields: string[];
  game: GameDetails | null;
  platform?: Platform;
  onBack: () => void;
  onConfirm: () => void;
  onScriptImport?: (specs: UserSpecs) => void;
  savedAt?: string | null;
  onClearSaved?: () => void;
  showStorageToast?: boolean;
  onToastShown?: () => void;
  hideBack?: boolean;
  confirmLabel?: string;
  showInfo?: boolean;
  playSettings?: PlaySettings;
  onPlaySettingsChange?: (settings: PlaySettings) => void;
}

export default function StepSystemSpecs({
  specs,
  onChange,
  dirty,
  cpuList,
  gpuList,
  detecting,
  unmatchedFields,
  game,
  platform,
  onBack,
  onConfirm,
  onScriptImport,
  savedAt,
  onClearSaved,
  showStorageToast,
  onToastShown,
  hideBack,
  confirmLabel,
  showInfo,
  playSettings,
  onPlaySettingsChange,
}: Props) {
  const [toastVisible, setToastVisible] = useState(!!showStorageToast);
  const [toastExiting, setToastExiting] = useState(false);
  const [highlightEmpty, setHighlightEmpty] = useState(false);
  const [errorToastVisible, setErrorToastVisible] = useState(false);
  const [errorToastExiting, setErrorToastExiting] = useState(false);

  useEffect(() => {
    if (!showStorageToast) return;
    onToastShown?.();
  }, [showStorageToast, onToastShown]);

  useEffect(() => {
    if (!toastVisible || toastExiting) return;
    const dismissTimer = setTimeout(() => setToastExiting(true), 8000);
    return () => clearTimeout(dismissTimer);
  }, [toastVisible, toastExiting]);

  useEffect(() => {
    if (!toastExiting) return;
    const removeTimer = setTimeout(() => {
      setToastVisible(false);
      setToastExiting(false);
    }, 400);
    return () => clearTimeout(removeTimer);
  }, [toastExiting]);

  useEffect(() => {
    if (!errorToastVisible || errorToastExiting) return;
    const timer = setTimeout(() => setErrorToastExiting(true), 4000);
    return () => clearTimeout(timer);
  }, [errorToastVisible, errorToastExiting]);

  useEffect(() => {
    if (!errorToastExiting) return;
    const timer = setTimeout(() => {
      setErrorToastVisible(false);
      setErrorToastExiting(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [errorToastExiting]);

  const emptyFieldNames: string[] = [
    ...(!specs.os.trim() ? ["OS"] : []),
    ...(!specs.cpu.trim() ? ["CPU"] : []),
    ...(!specs.gpu.trim() ? ["GPU"] : []),
    ...(specs.ramGB == null ? ["RAM"] : []),
    ...(specs.storageGB == null ? ["Storage"] : []),
  ];

  const hasEmptyField =
    !specs.os.trim() ||
    !specs.cpu.trim() ||
    !specs.gpu.trim() ||
    specs.ramGB == null ||
    specs.storageGB == null;

  function handleConfirmAttempt() {
    if (hasEmptyField) {
      // Re-trigger shake by toggling highlightEmpty off then on
      setHighlightEmpty(false);
      requestAnimationFrame(() => setHighlightEmpty(true));
      // Show/re-trigger error toast
      setErrorToastExiting(false);
      setErrorToastVisible(true);
      return;
    }
    setHighlightEmpty(false);
    setErrorToastVisible(false);
    onConfirm();
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Only trigger if Enter is pressed and no input/textarea is focused
      if (e.key === "Enter") {
        const activeEl = document.activeElement;
        const isInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";
        if (!isInput) {
          e.preventDefault();
          handleConfirmAttempt();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onConfirm, hasEmptyField]);

  function handleScannerDownload() {
    // Save the current game context so we can restore it when returning from scanner
    if (game?.appid && platform) {
      savePendingGame(game.appid, platform, game.name);
    }
  }

  return (
    <>
      <div className="animate-fadeIn flex flex-col gap-4 mt-8 py-2">
        {savedAt && (
          <div className="flex items-center justify-between text-xs text-base-content/40 px-1">
            <span>
              Using specs saved on{" "}
              {new Date(savedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
            {onClearSaved && (
              <button className="btn btn-ghost btn-xs text-base-content/40 gap-1" onClick={onClearSaved}>
                <HiX className="w-3 h-3" />
                Clear saved specs
              </button>
            )}
          </div>
        )}

        {game && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={game.headerImage}
              alt={game.name}
              className="w-24 rounded shadow-sm"
            />
            <div>
              <p className="text-sm text-base-content/70">Checking compatibility for</p>
              <h3 className="font-bold text-lg">{game.name}</h3>
            </div>
          </div>
        )}

        {onScriptImport && <HardwareScanner onImport={onScriptImport} onDownload={handleScannerDownload} />}

        <SystemSpecs
          specs={specs}
          onChange={onChange}
          onSubmit={handleConfirmAttempt}
          dirty={dirty}
          cpuList={cpuList}
          gpuList={gpuList}
          detecting={detecting}
          unmatchedFields={unmatchedFields}
          hideSubmit
          highlightEmpty={highlightEmpty}
          playSettings={playSettings}
          onPlaySettingsChange={onPlaySettingsChange}
        />

        <div className={`flex ${hideBack ? "justify-end" : "justify-between"} items-center`}>
          {!hideBack && (
            <button className="btn btn-ghost" onClick={onBack}>
              &larr; Back
            </button>
          )}
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-base-content/40">
              <kbd className="kbd kbd-xs">Enter</kbd>
              <span>to continue</span>
            </span>
            <button className="btn btn-primary" onClick={handleConfirmAttempt}>
              {confirmLabel ?? "Check Compatibility"} &rarr;
            </button>
          </div>
        </div>

        {showInfo && (
          <div className="mt-14 w-full max-w-2xl space-y-3">
            <h2 className="text-lg font-semibold opacity-80">What is this?</h2>
            <p className="text-sm opacity-60 leading-relaxed">
              <strong>Do I Need An Upgrade?</strong> checks whether your PC can run a
              game by comparing your hardware against its system requirements. Search
              for any Steam game above, and we&apos;ll auto-detect your specs and tell
              you if you&apos;re good to go or what you might need to upgrade.
            </p>
            <div className="flex flex-col gap-1 text-sm opacity-50 pt-1">
              <span>&#9679; Auto-detects your hardware</span>
              <span>&#9679; Compares CPU, GPU, RAM &amp; storage</span>
              <span>&#9679; Supports Windows, Mac &amp; Linux</span>
            </div>
            <h3 className="text-base font-semibold opacity-80 pt-3">About the hardware scanner</h3>
            <p className="text-sm opacity-60 leading-relaxed">
              For more accurate results, you can download and run the scanner app.
              It&apos;s fully open source and only reads basic system info like your
              CPU model, GPU name, RAM size, and available storage. It does not
              collect, transmit, or store any personal data — everything stays on
              your machine.
            </p>
          </div>
        )}
      </div>

      {(toastVisible || errorToastVisible) && (
        <div className="fixed right-2 sm:right-4 top-20 z-50 flex flex-col gap-3 max-w-[calc(100vw-1rem)] sm:max-w-sm">
          {toastVisible && (
            <div className={toastExiting ? "animate-toast-out" : "animate-toast-in"}>
              <div className="alert alert-info text-sm py-2 px-4 flex items-center gap-2">
                <HiCheckCircle className="w-5 h-5" />
                <span>System specs loaded from previous session</span>
              </div>
            </div>
          )}

          {errorToastVisible && (
            <div className={errorToastExiting ? "animate-toast-out" : "animate-toast-in"}>
              <div className="alert alert-error text-sm py-2 px-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <HiExclamation className="w-5 h-5 shrink-0" />
                  <span>Please fill in: {emptyFieldNames.join(", ")}</span>
                </div>
                <button className="btn btn-ghost btn-xs btn-circle shrink-0" onClick={() => setErrorToastExiting(true)}>
                  <HiX className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
