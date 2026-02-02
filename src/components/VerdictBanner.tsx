"use client";

import { VerdictResult } from "@/types";

interface Props {
  result: VerdictResult;
}

function CheckIcon() {
  return (
    <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg className="w-8 h-8 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const verdictStyles = {
  pass: "border-success/40 bg-success/10",
  minimum: "border-warning/40 bg-warning/10",
  fail: "border-error/40 bg-error/10",
  unknown: "border-info/40 bg-info/10",
} as const;

const verdictIcons = {
  pass: CheckIcon,
  minimum: WarningIcon,
  fail: XIcon,
  unknown: QuestionIcon,
} as const;

export default function VerdictBanner({ result }: Props) {
  const Icon = verdictIcons[result.verdict];

  return (
    <div className={`rounded-lg border-2 p-5 ${verdictStyles[result.verdict]}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <Icon />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-base-content">{result.title}</h3>
          <p className="text-sm text-base-content/70 mt-1">{result.description}</p>
          {result.failedComponents.length > 0 && (
            <div className="mt-2">
              <span className="text-sm font-medium text-error">
                Failed: {result.failedComponents.join(", ")}
              </span>
            </div>
          )}
          {result.warnComponents.length > 0 && (
            <div className="mt-1">
              <span className="text-sm font-medium text-warning">
                Needs review: {result.warnComponents.join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
