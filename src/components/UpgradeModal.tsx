"use client";

import { VerdictResult } from "@/types";

interface Props {
  result: VerdictResult;
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ result, open, onClose }: Props) {
  if (!open) return null;

  const hasUpgrades = result.upgradeItems.length > 0;
  const isPass = result.verdict === "pass";

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          &times;
        </button>

        {isPass ? (
          <>
            <h3 className="text-xl font-bold text-success">No Upgrade Needed!</h3>
            <p className="py-4 text-base-content/80">
              Your system meets or exceeds all recommended requirements. You&apos;re good to go!
            </p>
          </>
        ) : result.verdict === "fail" && hasUpgrades ? (
          <>
            <h3 className="text-xl font-bold text-error">Upgrade Required</h3>
            <p className="py-2 text-base-content/80">{result.description}</p>

            <div className="overflow-x-auto mt-2">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Your Current</th>
                    <th>Required</th>
                  </tr>
                </thead>
                <tbody>
                  {result.upgradeItems.map((item) => (
                    <tr key={item.component}>
                      <td className="font-semibold">{item.component}</td>
                      <td className="text-error">{item.current}</td>
                      <td className="text-success">{item.required}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : result.verdict === "minimum" && hasUpgrades ? (
          <>
            <h3 className="text-xl font-bold text-info">Upgrade Optional</h3>
            <p className="py-2 text-base-content/80">
              Your system can run this game! For a better experience, you could consider upgrading the following:
            </p>

            <div className="overflow-x-auto mt-2">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Your Current</th>
                    <th>Recommended</th>
                  </tr>
                </thead>
                <tbody>
                  {result.upgradeItems.map((item) => (
                    <tr key={item.component}>
                      <td className="font-semibold">{item.component}</td>
                      <td className="text-info">{item.current}</td>
                      <td className="text-base-content/70">{item.required}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-bold">{result.title}</h3>
            <p className="py-4 text-base-content/80">{result.description}</p>
          </>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
