import { UserSpecs } from "@/types";

function detectOS(): string {
  // Try modern User-Agent Client Hints API first
  const uaData = (navigator as unknown as { userAgentData?: { platform: string } })
    .userAgentData;
  if (uaData?.platform) {
    const platform = uaData.platform;
    if (platform === "Windows") return "Windows";
    if (platform === "macOS") return "macOS";
    if (platform === "Linux") return "Linux";
    if (platform === "Chrome OS") return "Chrome OS";
    return platform;
  }

  // Fallback to userAgent string parsing
  const ua = navigator.userAgent;
  if (ua.includes("Windows NT 10.0")) return "Windows 10/11";
  if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
  if (ua.includes("Windows NT 6.2")) return "Windows 8";
  if (ua.includes("Windows NT 6.1")) return "Windows 7";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS X")) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    if (match) {
      const version = match[1].replace("_", ".");
      return `macOS ${version}`;
    }
    return "macOS";
  }
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("CrOS")) return "Chrome OS";
  return "Unknown OS";
}

function detectGPU(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return "";

    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return "";

    return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "";
  } catch {
    return "";
  }
}

export async function detectClientSpecs(): Promise<UserSpecs> {
  const os = detectOS();
  const gpu = detectGPU();
  const cpuCores = navigator.hardwareConcurrency ?? null;

  // navigator.deviceMemory is Chrome/Edge only (returns approximate GB as power of 2)
  const deviceMemory = (navigator as unknown as { deviceMemory?: number })
    .deviceMemory;
  const ramGB = deviceMemory ? Math.round(deviceMemory) : null;

  // Storage estimate gives the browser's quota, not actual disk size
  let storageGB: number | null = null;
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      if (est.quota) {
        storageGB = Math.round(est.quota / 1073741824);
      }
    }
  } catch {
    // Storage API not available
  }

  return {
    os,
    cpu: cpuCores ? `Unknown (${cpuCores} cores)` : "",
    cpuCores,
    gpu,
    ramGB,
    storageGB,
  };
}
