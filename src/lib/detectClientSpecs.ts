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

interface UADataWithHints {
  platform: string;
  getHighEntropyValues?(hints: string[]): Promise<{ platformVersion?: string }>;
}

// Safari major version → macOS major version mapping.
// Safari versions are tied to specific macOS releases.
const safariVersionToMacOS: Record<number, string> = {
  14: "11",   // Safari 14 → macOS Big Sur
  15: "12",   // Safari 15 → macOS Monterey
  16: "13",   // Safari 16 → macOS Ventura
  17: "14",   // Safari 17 → macOS Sonoma
  18: "15",   // Safari 18 → macOS Sequoia
  19: "16",   // Safari 19 → future
};

function inferMacOSFromSafariVersion(ua: string): string | null {
  // Safari UA contains "Version/18.2 Safari/605.1.15"
  const match = ua.match(/Version\/(\d+)\.\d+.*Safari\//);
  if (!match) return null;
  const safariMajor = parseInt(match[1], 10);
  const macVersion = safariVersionToMacOS[safariMajor];
  if (!macVersion) return null;
  return macosVersionToCodename(macVersion);
}

async function detectOS(): Promise<string> {
  const ua = navigator.userAgent;

  // Try modern User-Agent Client Hints API first (Chrome/Edge)
  const uaData = (navigator as unknown as { userAgentData?: UADataWithHints })
    .userAgentData;
  if (uaData?.platform) {
    const platform = uaData.platform;
    if (platform === "macOS") {
      // Chrome freezes the macOS version in the UA string to 10_15_7.
      // Use getHighEntropyValues to get the real platform version.
      if (uaData.getHighEntropyValues) {
        try {
          const hints = await uaData.getHighEntropyValues(["platformVersion"]);
          if (hints.platformVersion) {
            const codename = macosVersionToCodename(hints.platformVersion);
            if (codename) return codename;
            return `macOS ${hints.platformVersion}`;
          }
        } catch {
          // Fall through to UA string parsing
        }
      }
      // Fallback to UA string (will be frozen on Chromium browsers)
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
      if (ua.includes("Windows NT 10.0")) return "Windows 10/11";
      return "Windows";
    }
    if (platform === "Linux") return "Linux";
    if (platform === "Chrome OS") return "Chrome OS";
    return platform;
  }

  // Fallback to userAgent string parsing (Safari, Firefox, etc.)
  if (ua.includes("Windows NT 10.0")) return "Windows 10/11";
  if (ua.includes("Windows NT 6.3")) return "Windows 8.1";
  if (ua.includes("Windows NT 6.2")) return "Windows 8";
  if (ua.includes("Windows NT 6.1")) return "Windows 7";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS X")) {
    // Safari also freezes macOS version to 10_15_7 in the UA string.
    // Use the Safari version number to infer the real macOS version.
    const safariInferred = inferMacOSFromSafariVersion(ua);
    if (safariInferred) return safariInferred;

    // Non-Safari browsers (Firefox) may report the real version
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

function getMacOSMajorVersion(os: string): number | null {
  const codenameMap: Record<string, number> = {
    "macOS Big Sur": 11,
    "macOS Monterey": 12,
    "macOS Ventura": 13,
    "macOS Sonoma": 14,
    "macOS Sequoia": 15,
  };
  if (codenameMap[os]) return codenameMap[os];
  const match = os.match(/macOS\s+(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

function guessAppleSilicon(
  coreCount: number,
  macosVersion: number
): { cpu: string; gpu: string } | null {
  if (macosVersion < 11) return null; // Intel Mac

  let gen: number;
  if (macosVersion >= 15) gen = 4;
  else if (macosVersion >= 14) gen = 3;
  else if (macosVersion >= 13) gen = 2;
  else gen = 1;

  let variant = "";
  // M4 base has 10 cores; M1-M3 base has 8 cores
  if (gen === 4) {
    if (coreCount >= 20) variant = " Ultra";
    else if (coreCount >= 16) variant = " Max";
    else if (coreCount >= 12) variant = " Pro";
  } else {
    if (coreCount >= 20) variant = " Ultra";
    else if (coreCount >= 14) variant = " Max";
    else if (coreCount >= 10) variant = " Pro";
  }

  const chip = `M${gen}${variant}`;
  return {
    cpu: `Apple ${chip}`,
    gpu: `Apple ${chip} GPU`,
  };
}

function detectGPU(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return "";

    // Try WEBGL_debug_renderer_info first (Chrome, Edge, etc.)
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (ext) {
      const raw = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "";
      if (raw) return cleanGPURenderer(raw);
    }

    // Firefox fallback: gl.getParameter(gl.RENDERER) now returns detailed GPU info
    const renderer = gl.getParameter(gl.RENDERER) ?? "";
    if (renderer && renderer !== "Mozilla" && renderer !== "Generic Renderer") {
      return cleanGPURenderer(renderer);
    }

    return "";
  } catch {
    return "";
  }
}

async function detectGPUViaWebGPU(): Promise<string> {
  try {
    const nav = navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } };
    if (!nav.gpu) return "";

    const adapter = await nav.gpu.requestAdapter() as {
      info?: { vendor?: string; architecture?: string; device?: string; description?: string };
    } | null;
    if (!adapter?.info) return "";

    const info = adapter.info;
    // Prefer description if available, otherwise construct from vendor + architecture
    if (info.description) return cleanGPURenderer(info.description);
    if (info.vendor && info.architecture) {
      return cleanGPURenderer(`${info.vendor} ${info.architecture}`);
    }
    return "";
  } catch {
    return "";
  }
}

export async function detectClientSpecs(gpuList?: string[]): Promise<UserSpecs> {
  const os = await detectOS();
  let gpu = detectGPU();
  const cpuCores = navigator.hardwareConcurrency ?? null;

  // If WebGL detection failed or returned empty, try WebGPU as fallback
  if (!gpu) {
    gpu = await detectGPUViaWebGPU();
  }

  // Fuzzy-match cleaned GPU string against known GPU list for canonical name
  if (gpu && gpuList && gpuList.length > 0) {
    const matched = fuzzyMatchHardware(gpu, gpuList);
    if (matched) {
      gpu = matched;
    }
  }

  // Try to infer CPU from GPU (works for Apple Silicon Macs)
  let cpu = inferCPUFromGPU(gpu, os);

  // navigator.deviceMemory is Chrome/Edge only (returns approximate GB as power of 2)
  const deviceMemory = (navigator as unknown as { deviceMemory?: number })
    .deviceMemory;
  let ramGB = deviceMemory ? Math.round(deviceMemory) : null;
  const ramApproximate = deviceMemory != null;

  // On macOS, if GPU/CPU detection failed, use heuristic based on core count + OS version
  const guessedFields: string[] = [];
  const isMac = os.toLowerCase().includes("mac");
  const isGenericAppleGPU = !gpu || gpu === "Apple GPU";

  if (isMac && isGenericAppleGPU && cpuCores) {
    const macVersion = getMacOSMajorVersion(os);
    if (macVersion) {
      const guess = guessAppleSilicon(cpuCores, macVersion);
      if (guess) {
        // Apply guess and match against known hardware lists
        const gpuMatch = gpuList && gpuList.length > 0
          ? fuzzyMatchHardware(guess.gpu, gpuList)
          : null;
        gpu = gpuMatch ?? guess.gpu;
        cpu = guess.cpu;
        guessedFields.push("CPU", "GPU");
      }
    }
  }

  // Estimate RAM for Apple Silicon Macs when deviceMemory is unavailable
  if (isMac && ramGB === null) {
    // Conservative minimums by variant — user will be prompted to confirm
    if (cpu.includes("Ultra")) ramGB = 64;
    else if (cpu.includes("Max")) ramGB = 36;
    else if (cpu.includes("Pro")) ramGB = 18;
    else if (cpu.includes("Apple M")) ramGB = 8;
    if (ramGB !== null) guessedFields.push("RAM");
  }

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
    detectionSource: "auto",
    ramApproximate,
    guessedFields: guessedFields.length > 0 ? guessedFields : undefined,
  };
}
