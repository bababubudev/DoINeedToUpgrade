"use client";

import { useEffect, useState } from "react";
import { HiSparkles, HiMinusCircle } from "react-icons/hi";

function shouldReduceMotion(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (navigator.hardwareConcurrency <= 2) return true;
  if ("deviceMemory" in navigator && (navigator as { deviceMemory?: number }).deviceMemory! <= 2) return true;
  return false;
}

export default function ReduceMotionToggle() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("reduceMotion");
    const isReduced = saved !== null ? saved === "true" : shouldReduceMotion();
    setReduced(isReduced);
    document.documentElement.setAttribute("data-reduce-motion", String(isReduced));
    if (saved === null && isReduced) {
      localStorage.setItem("reduceMotion", "true");
    }
  }, []);

  function toggle() {
    const next = !reduced;
    setReduced(next);
    document.documentElement.setAttribute("data-reduce-motion", String(next));
    localStorage.setItem("reduceMotion", String(next));
  }

  return (
    <label className="swap swap-rotate btn btn-ghost btn-circle" title={reduced ? "Enable animations" : "Reduce motion"}>
      <input type="checkbox" checked={reduced} onChange={toggle} />
      <HiSparkles className="swap-off w-6 h-6" />
      <HiMinusCircle className="swap-on w-6 h-6" />
    </label>
  );
}
