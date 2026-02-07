import { UserSpecs } from "@/types";

const macVersionNames: Record<number, string> = {
  12: "macOS Monterey",
  13: "macOS Ventura",
  14: "macOS Sonoma",
  15: "macOS Sequoia",
};

function detectOS(): string {
  if (typeof navigator === "undefined") return "Unknown";

  const ua = navigator.userAgent;

  // Windows — try to extract version from UA
  if (ua.includes("Win")) {
    const winMatch = ua.match(/Windows NT ([\d.]+)/);
    if (winMatch) {
      const nt = parseFloat(winMatch[1]);
      if (nt >= 10.0) return "Windows 10"; // NT 10.0 covers both Win 10 and 11
      if (nt >= 6.3) return "Windows 8.1";
      if (nt >= 6.2) return "Windows 8";
      if (nt >= 6.1) return "Windows 7";
    }
    return "Windows";
  }

  // macOS — extract version from "Mac OS X 10_15_7" or "Mac OS X 14_0"
  if (ua.includes("Mac")) {
    const macMatch = ua.match(/Mac OS X (\d+)[._](\d+)/);
    if (macMatch) {
      const major = parseInt(macMatch[1], 10);
      if (major >= 11) {
        // macOS 11+ uses major version directly (11=Big Sur, 12=Monterey, etc.)
        return macVersionNames[major] || `macOS (version ${major})`;
      }
      // macOS 10.x — older, return generic
      return "macOS";
    }
    return "macOS";
  }

  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("CrOS")) return "Chrome OS";
  return navigator.platform || "Unknown";
}

function detectGPU(): string {
  if (typeof document === "undefined") return "Unknown";

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return "Unknown";

    const ext = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
    if (!ext) return "Unknown (WebGL supported)";

    return (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL) || "Unknown";
  } catch {
    return "Unknown";
  }
}

function detectRAM(): number | null {
  if (typeof navigator === "undefined") return null;
  // navigator.deviceMemory is Chrome-only and approximate
  const nav = navigator as Navigator & { deviceMemory?: number };
  return nav.deviceMemory ?? null;
}

function detectCores(): number | null {
  if (typeof navigator === "undefined") return null;
  return navigator.hardwareConcurrency ?? null;
}

export function detectSpecs(): UserSpecs {
  return {
    os: detectOS(),
    cpu: "",
    cpuCores: detectCores(),
    cpuSpeedGHz: null,
    gpu: detectGPU(),
    ramGB: detectRAM(),
    storageGB: null,
  };
}
