"use client";

import { VerdictResult } from "@/types";

interface Props {
  result: VerdictResult;
}

function CheckIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-8 h-8 ${className ?? ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-8 h-8 ${className ?? ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
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
  pass: CheckIcon,
  minimum: WarningIcon,
  fail: XIcon,
  unknown: QuestionIcon,
} as const;

export default function VerdictBanner({ result }: Props) {
  const Icon = verdictIcons[result.verdict];
  const isUnknown = result.verdict === "unknown";

  if (isUnknown) {
    return (
      <div className={verdictStyles.unknown}>
        <div className="card-body p-4 flex-row items-start gap-3">
          <Icon className="text-warning" />
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
      <Icon />
      <div className="flex-1">
        <h3 className="text-lg font-bold">{result.title}</h3>
        <p className="text-sm mt-1">{result.description}</p>
      </div>
    </div>
  );
}
