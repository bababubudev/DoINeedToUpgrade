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
        <div className="card-body p-3 flex-row items-center gap-3">
          <Icon className="w-6 h-6 text-warning/30" />
          <h3 className="text-base font-bold text-warning">
            {result.warnComponents.length > 0
              ? `Manual check needed for ${formatList(result.warnComponents.map((c) => c.toLowerCase()))}`
              : result.title}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div role="alert" className={`${verdictStyles[result.verdict]} py-2 text-black`}>
      <Icon className="w-6 h-6" />
      <h3 className="text-base font-bold">{result.title}</h3>
    </div>
  );
}
