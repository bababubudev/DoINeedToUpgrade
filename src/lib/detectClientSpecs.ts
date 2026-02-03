import { UserSpecs } from "@/types";
import { fuzzyMatchHardware } from "@/lib/fuzzyMatch";

const macosVersionMap: Record<string, string> = {
  "10.13": "macOS High Sierra",
  "10.14": "macOS Mojave",
  "10.15": "macOS Catalina",
  "11": "macOS Big Sur",
  "12": "macOS Monterey",
  "13": "macOS Ventura",
  "14": "macOS Sonoma",
  "15": "macOS Sequoia",
};

function macosVersionToCodename(version: string): string | null {
  // Try exact match first (e.g. "10.15")
  if (macosVersionMap[version]) return macosVersionMap[version];
  // Try major version only (e.g. "14.1" → "14")
  const major = version.split(".")[0];
  if (macosVersionMap[major]) return macosVersionMap[major];
  // For 10.x, try "10.major"
  if (major === "10") {
    const minor = version.split(".")[1];
    if (minor && macosVersionMap[`10.${minor}`]) return macosVersionMap[`10.${minor}`];
  }
  return null;
}

function detectOS(): string {
  const ua = navigator.userAgent;

  // Try modern User-Agent Client Hints API first
  const uaData = (navigator as unknown as { userAgentData?: { platform: string } })
    .userAgentData;
  if (uaData?.platform) {
    const platform = uaData.platform;
    if (platform === "macOS") {
      // Client Hints gives bare "macOS" — try to get version from UA string
      const match = ua.match(/Mac OS X (\d+[._]\d+)/);
      if (match) {
        const version = match[1].replace("_", ".");
        const codename = macosVersionToCodename(version);
        if (codename) return codename;
        return `macOS ${version}`;
      }
      return "macOS";
    }
    if (platform === "Windows") {
      // Try to get specific Windows version from UA
      if (ua.includes("Windows NT 10.0")) return "Windows 10/11";
      return "Windows";
    }
    if (platform === "Linux") return "Linux";
    if (platform === "Chrome OS") return "Chrome OS";
    return platform;
  }

  // Fallback to userAgent string parsing
  if (ua.includes("Windows NT 10.0")) return "Windows 10/11";
  if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
  if (ua.includes("Windows NT 6.2")) return "Windows 8";
  if (ua.includes("Windows NT 6.1")) return "Windows 7";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS X")) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    if (match) {
      const version = match[1].replace("_", ".");
      const codename = macosVersionToCodename(version);
      if (codename) return codename;
      return `macOS ${version}`;
    }
    return "macOS";
  }
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("CrOS")) return "Chrome OS";
  return "Unknown OS";
}

function cleanGPURenderer(raw: string): string {
  let cleaned = raw;

  // Strip ANGLE(...) wrapper
  const angleMatch = cleaned.match(/^ANGLE\s*\((.+)\)$/i);
  if (angleMatch) {
    const inner = angleMatch[1];
    // Split by comma, take segment[1] (the GPU model) if available
    const segments = inner.split(",").map((s) => s.trim());
    cleaned = segments.length >= 2 ? segments[1] : segments[0];
  }

  // Strip hex device IDs: (0x00001B81) etc.
  cleaned = cleaned.replace(/\(0x[0-9A-Fa-f]+\)/g, "");

  // Strip Direct3D / D3D references
  cleaned = cleaned.replace(/\bDirect3D\d*\b/gi, "");
  cleaned = cleaned.replace(/\bD3D\d*\b/gi, "");

  // Strip shader model tokens: vs_5_0, ps_5_0, etc.
  cleaned = cleaned.replace(/\b[vp]s_\d+_\d+\b/gi, "");

  // Strip standalone API names
  cleaned = cleaned.replace(/\bOpenGL\b/gi, "");
  cleaned = cleaned.replace(/\bVulkan\b/gi, "");
  cleaned = cleaned.replace(/\bMetal\b/gi, "");

  // Strip trademark markers
  cleaned = cleaned.replace(/\(R\)/gi, "");
  cleaned = cleaned.replace(/\(TM\)/gi, "");

  // Collapse whitespace and trim
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  // For Apple Silicon: if it matches "Apple M<digit>", append " GPU"
  if (/^Apple M\d/i.test(cleaned) && !cleaned.toLowerCase().includes("gpu")) {
    cleaned = cleaned + " GPU";
  }

  return cleaned;
}

function inferCPUFromGPU(gpu: string, os: string): string {
  // Only infer for macOS with Apple Silicon GPUs
  if (!os.toLowerCase().includes("macos") && !os.toLowerCase().includes("mac")) {
    return "";
  }

  // Match "Apple M1/M2/M3/M4 [Pro/Max/Ultra] GPU"
  const match = gpu.match(/^Apple (M\d+(?:\s+(?:Pro|Max|Ultra))?)\s*GPU$/i);
  if (match) {
    return `Apple ${match[1]}`;
  }

  // "Apple GPU" alone (Safari privacy) — can't infer
  return "";
}

function detectGPU(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return "";

    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return "";

    const raw = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "";
    return cleanGPURenderer(raw);
  } catch {
    return "";
  }
}

export async function detectClientSpecs(gpuList?: string[]): Promise<UserSpecs> {
  const os = detectOS();
  let gpu = detectGPU();
  const cpuCores = navigator.hardwareConcurrency ?? null;

  // Fuzzy-match cleaned GPU string against known GPU list for canonical name
  if (gpu && gpuList && gpuList.length > 0) {
    const matched = fuzzyMatchHardware(gpu, gpuList);
    if (matched) {
      gpu = matched;
    }
  }

  // Try to infer CPU from GPU (works for Apple Silicon Macs)
  const cpu = inferCPUFromGPU(gpu, os);

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
    cpu,
    cpuCores,
    gpu,
    ramGB,
    storageGB,
  };
}
