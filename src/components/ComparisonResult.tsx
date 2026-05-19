"use client";

import { ComparisonItem, ComparisonStatus } from "@/types";
import { useRef, useEffect, useState } from "react";

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

function ScrollingCell({ text, className }: { text: string; className: string }) {
  const cellRef = useRef<HTMLTableCellElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [overflowPx, setOverflowPx] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const span = spanRef.current;
    const cell = cellRef.current;
    if (!span || !cell) return;

    const measure = () => {
      const overflow = span.scrollWidth - span.clientWidth;
      setOverflowPx(overflow > 0 ? overflow : 0);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(cell);
    return () => observer.disconnect();
  }, [text]);

  const duration = Math.max(overflowPx * 50, 2000);
  const shouldAnimate = overflowPx > 0 && hovered;

  return (
    <td
      ref={cellRef}
      className={`${className} px-3 overflow-hidden`}
      title={text}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        ref={spanRef}
        className={shouldAnimate ? "inline-block whitespace-nowrap" : "block truncate"}
        style={shouldAnimate ? {
          animationName: "scroll-text",
          animationDuration: `${duration}ms`,
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          "--scroll-distance": `-${overflowPx}px`,
        } as React.CSSProperties : undefined}
      >
        {text}
      </span>
    </td>
  );
}

function MobileRow({ item }: { item: ComparisonItem }) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-100/60 p-3 flex flex-col gap-2">
      <div className="font-semibold text-sm">{item.label}</div>
      <div className="text-xs">
        <span className="text-base-content/50">Your system: </span>
        <span className="break-words">{item.userValue}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded px-2 py-1.5 text-xs ${cellColor(item.minStatus)}`}>
          <div className="font-medium text-base-content/60 text-[10px] uppercase tracking-wide">Minimum</div>
          <div className="break-words">{item.minValue}</div>
        </div>
        <div className={`rounded px-2 py-1.5 text-xs ${cellColor(item.recStatus)}`}>
          <div className="font-medium text-base-content/60 text-[10px] uppercase tracking-wide">Recommended</div>
          <div className="break-words">{item.recValue}</div>
        </div>
      </div>
    </div>
  );
}

export default function ComparisonResult({ items }: Props) {
  return (
    <div className="card bg-base-100/80 backdrop-blur-sm shadow-sm w-full max-w-full overflow-hidden">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title">Component Breakdown</h2>

        {/* Mobile: stacked cards */}
        <div className="flex flex-col gap-2 sm:hidden">
          {items.map((item) => (
            <MobileRow key={item.label} item={item} />
          ))}
        </div>

        {/* sm and up: table */}
        <div className="hidden sm:block overflow-x-auto scrollbar-subtle">
          <table className="table table-sm md:table-md">
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
                  <td className="font-semibold whitespace-normal break-words">{item.label}</td>
                  <td className="whitespace-normal break-words">{item.userValue}</td>
                  <ScrollingCell
                    text={item.minValue}
                    className={`text-sm max-w-[150px] md:max-w-[200px] ${cellColor(item.minStatus)}`}
                  />
                  <ScrollingCell
                    text={item.recValue}
                    className={`text-sm max-w-[150px] md:max-w-[200px] ${cellColor(item.recStatus)}`}
                  />
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
