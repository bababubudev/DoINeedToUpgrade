"use client";

import { useEffect, useRef, useState } from "react";
import { HiCog, HiSun, HiMoon, HiSparkles, HiMinusCircle } from "react-icons/hi";

export default function SettingsDropdown() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme !== "light";
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

    const savedMotion = localStorage.getItem("reduceMotion");
    const isReduced = savedMotion !== null
      ? savedMotion === "true"
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(isReduced);
    document.documentElement.setAttribute("data-reduce-motion", String(isReduced));
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    const theme = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }

  function toggleMotion() {
    const next = !reduced;
    setReduced(next);
    document.documentElement.setAttribute("data-reduce-motion", String(next));
    localStorage.setItem("reduceMotion", String(next));
  }

  return (
    <div className={`dropdown dropdown-end${open ? " dropdown-open" : ""}`} ref={ref}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(!open)}
        aria-label="Settings"
      >
        <HiCog className="w-4 h-4" />
        <span className="hidden sm:inline">Settings</span>
      </button>
      {open && (
        <ul className="dropdown-content z-50 menu p-2 shadow-lg bg-base-200 rounded-box w-56 mt-2 animate-dropdownIn">
          <li>
            <button className="flex items-center gap-2" onClick={toggleTheme}>
              {dark ? <HiMoon className="w-4 h-4" /> : <HiSun className="w-4 h-4" />}
              {dark ? "Dark Mode" : "Light Mode"}
            </button>
          </li>
          <li>
            <button className="flex items-center gap-2" onClick={toggleMotion}>
              {reduced ? <HiSparkles className="w-4 h-4" /> : <HiMinusCircle className="w-4 h-4" />}
              {reduced ? "Show Animations" : "Hide Animations"}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
