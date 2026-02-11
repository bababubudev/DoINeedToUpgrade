"use client";

import { ComparisonItem, ComparisonStatus } from "@/types";

interface Props {
  items: ComparisonItem[];
}

function cellColor(status: ComparisonStatus): string {
  switch (status) {
    case "pass": return "bg-success/30";
    case "fail": return "bg-error/30";
    case "warn":
    case "info": return "bg-warning/30";
  }
}

export default function ComparisonResult({ items }: Props) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Component Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Your System</th>
                <th>Minimum</th>
                <th>Recommended</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.label}>
                  <td className="font-semibold">{item.label}</td>
                  <td className="whitespace-normal break-words">{item.userValue}</td>
                  <td className={`text-sm max-w-[120px] sm:max-w-[200px] truncate ${cellColor(item.minStatus)}`} title={item.minValue}>{item.minValue}</td>
                  <td className={`text-sm max-w-[120px] sm:max-w-[200px] truncate ${cellColor(item.recStatus)}`} title={item.recValue}>{item.recValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-base-content/60 pt-2 justify-end">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-success/30 border border-success/50" /> Pass — meets or exceeds</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-warning/30 border border-warning/50" /> Check — verify manually</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-error/30 border border-error/50" /> Fail — below requirement</span>
        </div>
      </div>
    </div>
  );
}
