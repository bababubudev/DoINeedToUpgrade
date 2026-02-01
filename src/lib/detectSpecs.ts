import { UserSpecs } from "@/types";

function detectOS(): string {
  if (typeof navigator === "undefined") return "Unknown";

  const ua = navigator.userAgent;
  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
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
    gpu: detectGPU(),
    ramGB: detectRAM(),
    storageGB: null,
  };
}
