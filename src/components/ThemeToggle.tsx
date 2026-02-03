"use client";

import { useEffect, useState } from "react";
import { HiSun, HiMoon } from "react-icons/hi";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const theme = next ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }

  return (
    <label className="swap swap-rotate btn btn-ghost btn-circle">
      <input type="checkbox" checked={dark} onChange={toggle} />
      <HiSun className="swap-off w-6 h-6" />
      <HiMoon className="swap-on w-6 h-6" />
    </label>
  );
}
