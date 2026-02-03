"use client";

import { VerdictResult } from "@/types";
import { HiCheckCircle, HiExclamation, HiXCircle, HiQuestionMarkCircle } from "react-icons/hi";

interface Props {
  result: VerdictResult;
}

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

const verdictStyles = {
  pass: "alert alert-success",
  minimum: "alert alert-warning",
  fail: "alert alert-error",
  unknown: "card bg-base-100 dark:bg-warning/20 shadow-sm",
} as const;

const verdictIcons = {
  pass: HiCheckCircle,
  minimum: HiExclamation,
  fail: HiXCircle,
  unknown: HiQuestionMarkCircle,
} as const;

export default function VerdictBanner({ result }: Props) {
  const Icon = verdictIcons[result.verdict];
  const isUnknown = result.verdict === "unknown";

  if (isUnknown) {
    return (
      <div className={verdictStyles.unknown}>
        <div className="card-body p-4 flex-row items-start gap-3">
          <Icon className="w-8 h-8 text-warning/30" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-warning">
              {result.warnComponents.length > 0
                ? `Manual check needed for ${formatList(result.warnComponents.map((c) => c.toLowerCase()))}`
                : result.title}
            </h3>
            <p className="text-sm text-base-content/70 mt-1">{result.description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="alert" className={verdictStyles[result.verdict]}>
      <Icon className="w-8 h-8" />
      <div className="flex-1">
        <h3 className="text-lg font-bold">{result.title}</h3>
        <p className="text-sm mt-1">{result.description}</p>
      </div>
    </div>
  );
}
