"use client";

import { useEffect, useState } from "react";
import { HiX } from "react-icons/hi";

export default function PerformanceHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onHint() {
      if (sessionStorage.getItem("perfHintDismissed")) return;
      setVisible(true);
    }
    window.addEventListener("performancehint", onHint);
    return () => window.removeEventListener("performancehint", onHint);
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    sessionStorage.setItem("perfHintDismissed", "true");
  }

  return (
    <div className="toast toast-end toast-top z-50 mt-16">
      <div className="alert alert-warning shadow-lg gap-2 py-2">
        <span className="text-sm">
          Animations may be affecting performance. You can disable them in <strong>Settings</strong>.
        </span>
        <button className="btn btn-ghost btn-xs" onClick={dismiss} aria-label="Dismiss">
          <HiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
