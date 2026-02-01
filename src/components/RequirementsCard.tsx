"use client";

import { GameRequirements } from "@/types";

interface Props {
  title: string;
  requirements: GameRequirements | null;
}

const FIELDS: { key: keyof GameRequirements; label: string }[] = [
  { key: "os", label: "OS" },
  { key: "cpu", label: "Processor" },
  { key: "gpu", label: "Graphics" },
  { key: "ram", label: "Memory" },
  { key: "storage", label: "Storage" },
  { key: "directx", label: "DirectX" },
];

export default function RequirementsCard({ title, requirements }: Props) {
  if (!requirements) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-lg">{title}</h3>
          <p className="text-base-content/50">Not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-lg">{title}</h3>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <tbody>
              {FIELDS.map(({ key, label }) => {
                const value = requirements[key];
                if (!value) return null;
                return (
                  <tr key={key}>
                    <td className="font-semibold w-28">{label}</td>
                    <td>{value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
