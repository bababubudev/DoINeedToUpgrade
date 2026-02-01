"use client";

import { ComparisonItem, ComparisonStatus } from "@/types";

interface Props {
  items: ComparisonItem[];
  gameName: string;
}

function StatusBadge({ status }: { status: ComparisonStatus }) {
  switch (status) {
    case "pass":
      return <span className="badge badge-success badge-sm">PASS</span>;
    case "fail":
      return <span className="badge badge-error badge-sm">FAIL</span>;
    case "warn":
      return <span className="badge badge-warning badge-sm">CHECK</span>;
    case "info":
      return <span className="badge badge-ghost badge-sm">INFO</span>;
  }
}

export default function ComparisonResult({ items, gameName }: Props) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Comparison: {gameName}</h2>
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
                  <td>{item.userValue}</td>
                  <td>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">{item.minValue}</span>
                      <StatusBadge status={item.minStatus} />
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">{item.recValue}</span>
                      <StatusBadge status={item.recStatus} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-base-content/60">
          <p>
            <span className="badge badge-success badge-sm mr-1">PASS</span> Your system meets this requirement
          </p>
          <p>
            <span className="badge badge-error badge-sm mr-1">FAIL</span> Your system does not meet this requirement
          </p>
          <p>
            <span className="badge badge-warning badge-sm mr-1">CHECK</span> Different platform — verify compatibility manually
          </p>
          <p>
            <span className="badge badge-ghost badge-sm mr-1">INFO</span> Cannot be compared automatically — check manually
          </p>
        </div>
      </div>
    </div>
  );
}
