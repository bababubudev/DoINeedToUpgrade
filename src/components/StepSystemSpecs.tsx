"use client";

import { useState, useEffect } from "react";
import { UserSpecs, GameDetails } from "@/types";
import SystemSpecs from "@/components/SystemSpecs";
import HardwareScanner from "@/components/HardwareScanner";
import { HiX, HiCheckCircle } from "react-icons/hi";

interface Props {
  specs: UserSpecs;
  onChange: (specs: UserSpecs) => void;
  dirty: boolean;
  cpuList: string[];
  gpuList: string[];
  detecting: boolean;
  unmatchedFields: string[];
  game: GameDetails | null;
  onBack: () => void;
  onConfirm: () => void;
  onScriptImport?: (specs: UserSpecs) => void;
  savedAt?: string | null;
  onClearSaved?: () => void;
  showStorageToast?: boolean;
  onToastShown?: () => void;
  hideBack?: boolean;
  confirmLabel?: string;
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
  onBack,
  onConfirm,
  onScriptImport,
  savedAt,
  onClearSaved,
  showStorageToast,
  onToastShown,
  hideBack,
  confirmLabel,
}: Props) {
  const [toastVisible, setToastVisible] = useState(!!showStorageToast);
  const [toastExiting, setToastExiting] = useState(false);

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

  return (
    <>
      <div className="animate-fadeIn flex flex-col gap-4">
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

        {onScriptImport && <HardwareScanner onImport={onScriptImport} />}

        <SystemSpecs
          specs={specs}
          onChange={onChange}
          onSubmit={onConfirm}
          dirty={dirty}
          cpuList={cpuList}
          gpuList={gpuList}
          detecting={detecting}
          unmatchedFields={unmatchedFields}
          hideSubmit
        />

        <div className={`flex ${hideBack ? "justify-end" : "justify-between"}`}>
          {!hideBack && (
            <button className="btn btn-ghost" onClick={onBack}>
              &larr; Back
            </button>
          )}
          <button className="btn btn-primary" onClick={onConfirm}>
            {confirmLabel ?? "Check Compatibility"} &rarr;
          </button>
        </div>
      </div>

      {toastVisible && (
        <div className={`fixed right-4 top-20 z-50 ${toastExiting ? "animate-toast-out" : "animate-toast-in"}`}>
          <div className="alert alert-info text-sm py-2 px-4 flex items-center gap-2">
            <HiCheckCircle className="w-5 h-5" />
            <span>System specs loaded from previous session</span>
          </div>
        </div>
      )}
    </>
  );
}
