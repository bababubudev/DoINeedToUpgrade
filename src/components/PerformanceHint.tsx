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
    <div className="fixed right-2 sm:right-4 top-16 sm:top-20 z-50 max-w-[calc(100vw-1rem)] sm:max-w-sm">
      <div className="alert alert-warning shadow-lg gap-2 py-2 px-3 flex items-start sm:items-center">
        <span className="text-sm flex-1 min-w-0 break-words">
          Animations may be affecting performance. You can disable them in <strong>Settings</strong>.
        </span>
        <button className="btn btn-ghost btn-xs btn-circle shrink-0" onClick={dismiss} aria-label="Dismiss">
          <HiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
