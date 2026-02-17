import { UserSpecs, GameRequirements, ComparisonItem, ComparisonStatus } from "@/types";
import { osList, osScores } from "@/lib/hardwareData";
import { fuzzyMatchHardware } from "@/lib/fuzzyMatch";
import { parseCPURequirement, ParsedCPUSpecs } from "@/lib/parseRequirements";

function parseGB(text: string): number | null {
  if (!text) return null;
  // Match patterns like "8 GB", "8GB", "16384 MB"
  const gbMatch = text.match(/([\d.]+)\s*GB/i);
  if (gbMatch) return parseFloat(gbMatch[1]);

  const mbMatch = text.match(/([\d.]+)\s*MB/i);
  if (mbMatch) return parseFloat(mbMatch[1]) / 1024;

  const tbMatch = text.match(/([\d.]+)\s*TB/i);
  if (tbMatch) return parseFloat(tbMatch[1]) * 1024;

  return null;
}

function compareNumeric(
  userVal: number | null,
  reqText: string
): ComparisonStatus {
  if (!reqText) return "pass";
  if (userVal === null) return "info";
  const reqVal = parseGB(reqText);
  if (reqVal === null) return "info";
  return userVal >= reqVal ? "pass" : "fail";
}

function extractPlatform(text: string): "windows" | "macos" | "linux" | null {
  const lower = text.toLowerCase();
  if (lower.includes("windows") || lower.includes("win")) return "windows";
  if (lower.includes("macos") || lower.includes("mac os") || lower.includes("os x") || lower.includes("osx") ||
      /\b(big sur|monterey|ventura|sonoma|sequoia|catalina|mojave|high sierra|sierra|el capitan|yosemite|mavericks)\b/.test(lower)) return "macos";
  if (lower.includes("linux") || lower.includes("ubuntu") || lower.includes("steamos")) return "linux";
  return null;
}

/**
 * Detect vague OS requirements that don't specify a real platform
 * (e.g. "Any up to date version", "Any modern OS", "Any 64-bit OS").
 */
function isVagueOSRequirement(text: string): boolean {
  return /\bany\b/i.test(text) && !/\b(windows|mac|linux|ubuntu|steamos)\b/i.test(text);
}

/**
 * Normalize an OS string for better matching:
 * - Handle range formats: "OSX 10.9.5 - 10.11.6" → take the lower bound
 * - Normalize "OSX" → "OS X" for consistent matching
 * - Strip patch versions: "10.9.5" → "10.9", "10.11.6" → "10.11"
 */
function normalizeOSString(text: string): string {
  let normalized = text;

  // Handle range formats: "OSX 10.9.5 - 10.11.6" → take the lower bound
  const rangeMatch = normalized.match(/^(.+?)\s*[-–—]\s*[\d.]+\s*$/);
  if (rangeMatch) {
    normalized = rangeMatch[1].trim();
  }

  // Normalize "OSX" to "OS X" (without space is common in Steam requirements)
  normalized = normalized.replace(/\bOSX\b/g, "OS X");

  // Strip patch versions for macOS: "10.9.5" → "10.9", "10.11.6" → "10.11"
  // Only strip the third component of dotted versions (keep major.minor)
  normalized = normalized.replace(/(\d+\.\d+)\.\d+/g, "$1");

  return normalized.trim();
}

function compareOS(userOS: string, reqOS: string): ComparisonStatus {
  if (!reqOS) return "pass";
  if (!userOS) return "info";

  // "Any up to date version" or similar vague requirements → pass
  if (isVagueOSRequirement(reqOS)) return "pass";

  // Always check platform first — cross-platform is always "warn"
  const userPlatform = extractPlatform(userOS);
  const reqPlatform = extractPlatform(reqOS);

  if (!userPlatform || !reqPlatform) return "info";
  if (userPlatform !== reqPlatform) return "warn";

  // Same platform — try score-based comparison via fuzzy match
  // Only match against candidates from the same platform to avoid cross-platform false matches
  const samePlatformList = osList.filter(
    (os) => extractPlatform(os) === userPlatform
  );

  const normalizedUser = normalizeOSString(userOS);
  const userMatch = fuzzyMatchHardware(normalizedUser, samePlatformList);

  if (!userMatch || osScores[userMatch] == null) {
    // Same platform but couldn't determine version ordering
    return "pass";
  }

  const userScore = osScores[userMatch];

  // Split requirement on alternatives (e.g. "Windows 10/11" → ["Windows 10", "11"])
  // and find the lowest matching score (the minimum requirement)
  const alternatives = splitAlternatives(reqOS);
  let bestReqScore: number | null = null;

  for (const alt of alternatives) {
    const normalizedAlt = normalizeOSString(alt);
    const reqMatch = fuzzyMatchHardware(normalizedAlt, samePlatformList);
    if (reqMatch && osScores[reqMatch] != null) {
      if (bestReqScore === null || osScores[reqMatch] < bestReqScore) {
        bestReqScore = osScores[reqMatch];
      }
    }
  }

  if (bestReqScore === null) {
    // Same platform but couldn't determine version ordering
    return "pass";
  }

  return userScore >= bestReqScore ? "pass" : "fail";
}

function splitAlternatives(text: string): string[] {
  // Split on comma, " or ", " / " to handle multi-item requirements
  return text
    .split(/,|\bor\b|\//i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Compare CPU specs (clock speed and cores) when model matching isn't available.
 * Returns a status based on whether user's specs meet the requirement.
 */
function compareSpecsOnly(
  userSpeedGHz: number | null,
  userCores: number | null,
  reqSpecs: ParsedCPUSpecs
): ComparisonStatus {
  let speedPasses: boolean | null = null;
  let coresPasses: boolean | null = null;

  if (userSpeedGHz !== null && reqSpecs.speedGHz !== null) {
    // Allow 10% tolerance for clock speed
    speedPasses = userSpeedGHz >= reqSpecs.speedGHz * 0.9;
  }

  if (userCores !== null && reqSpecs.cores !== null) {
    coresPasses = userCores >= reqSpecs.cores;
  }

  // If we have both comparisons, both must pass
  if (speedPasses !== null && coresPasses !== null) {
    if (speedPasses && coresPasses) return "pass";
    if (!speedPasses && !coresPasses) return "fail";
    return "warn"; // One passes, one fails
  }

  // If only one comparison is available
  if (speedPasses !== null) return speedPasses ? "pass" : "fail";
  if (coresPasses !== null) return coresPasses ? "pass" : "fail";

  return "info"; // No specs to compare
}

/**
 * CPU family patterns — when a requirement says e.g. "Intel i5" without a
 * specific model number, match all i5 variants and use their average score.
 */
const CPU_FAMILY_PATTERNS: { pattern: RegExp; filter: (c: string) => boolean }[] = [
  { pattern: /\bi3\b/i, filter: (c) => /\bi3[-\s]/i.test(c) },
  { pattern: /\bi5\b/i, filter: (c) => /\bi5[-\s]/i.test(c) },
  { pattern: /\bi7\b/i, filter: (c) => /\bi7[-\s]/i.test(c) },
  { pattern: /\bi9\b/i, filter: (c) => /\bi9[-\s]/i.test(c) },
  { pattern: /\bryzen\s*3\b/i, filter: (c) => /\bryzen\s*3\b/i.test(c) },
  { pattern: /\bryzen\s*5\b/i, filter: (c) => /\bryzen\s*5\b/i.test(c) },
  { pattern: /\bryzen\s*7\b/i, filter: (c) => /\bryzen\s*7\b/i.test(c) },
  { pattern: /\bryzen\s*9\b/i, filter: (c) => /\bryzen\s*9\b/i.test(c) },
];

/**
 * When a requirement specifies a CPU family (e.g. "Intel i5") without a
 * specific model, return the average score across all members of that family.
 */
function familyAverageScore(
  reqText: string,
  candidates: string[],
  scores: Record<string, number>
): number | null {
  // Detect "and up", "or better", "or higher", "or above" qualifiers
  const isMinimumTier = /\b(and\s+up|or\s+better|or\s+higher|or\s+above)\b/i.test(reqText);

  for (const { pattern, filter } of CPU_FAMILY_PATTERNS) {
    if (!pattern.test(reqText)) continue;
    const members = candidates.filter(
      (c) => filter(c) && scores[c] != null
    );
    if (members.length === 0) continue;

    // "i5 and up" means "at least an i5" → use minimum score in the family
    // Plain "i5" → use average score as representative benchmark
    if (isMinimumTier) {
      return Math.min(...members.map((m) => scores[m]));
    }
    const total = members.reduce((sum, m) => sum + scores[m], 0);
    return total / members.length;
  }
  return null;
}

/**
 * Detect CPU platform from text (Intel vs AMD).
 */
function extractCPUPlatform(text: string): "intel" | "amd" | null {
  const lower = text.toLowerCase();
  if (lower.includes("intel") || /\b(core\s+)?i[3579]\b/.test(lower)) return "intel";
  if (lower.includes("amd") || /\b(ryzen|athlon|fx[-\s]|phenom)\b/.test(lower)) return "amd";
  return null;
}

/**
 * Compare CPU with fallback to spec-based comparison.
 * 1. Try model-based matching first (existing logic)
 * 2. Try family-average matching for broad requirements like "Intel i5"
 * 3. Fall back to spec-based comparison when model matching fails
 *
 * When the requirement lists platform-specific alternatives (e.g.
 * "i7-3770K or FX-8350"), only compare against the user's platform.
 */
function compareCPU(
  user: UserSpecs,
  reqText: string,
  candidates: string[],
  scores: Record<string, number>
): ComparisonStatus {
  if (!reqText) return "pass";

  // Try each alternative in the requirement text
  const allAlternatives = splitAlternatives(reqText);

  // Prefer same-platform alternatives when available (e.g. Intel user
  // should compare against the Intel requirement, not the AMD equivalent)
  const userPlatform = user.cpu ? extractCPUPlatform(user.cpu) : null;
  let alternatives = allAlternatives;
  if (userPlatform) {
    const samePlatform = allAlternatives.filter(
      (alt) => {
        const altPlatform = extractCPUPlatform(alt);
        return altPlatform === userPlatform || altPlatform === null;
      }
    );
    if (samePlatform.length > 0) alternatives = samePlatform;
  }

  let bestStatus: ComparisonStatus = "info";

  for (const alt of alternatives) {
    const parsed = parseCPURequirement(alt);

    // Strategy 1: Try model-based matching if there's a model in the requirement
    if (parsed.model && user.cpu) {
      const userMatch = fuzzyMatchHardware(user.cpu, candidates);
      const reqMatch = fuzzyMatchHardware(parsed.model, candidates);

      if (userMatch && reqMatch && scores[userMatch] != null && scores[reqMatch] != null) {
        const status = scores[userMatch] >= scores[reqMatch] ? "pass" : "fail";
        if (status === "pass") return "pass"; // Found a passing alternative
        if (bestStatus === "info" || bestStatus === "warn") bestStatus = status;
        continue;
      }

      // Strategy 1b: Exact model match failed — try family-average comparison
      if (userMatch && scores[userMatch] != null) {
        const familyScore = familyAverageScore(parsed.model, candidates, scores);
        if (familyScore !== null) {
          const status = scores[userMatch] >= familyScore ? "pass" : "fail";
          if (status === "pass") return "pass";
          if (bestStatus === "info" || bestStatus === "warn") bestStatus = status;
          continue;
        }
      }
    }

    // Strategy 2: Fall back to spec-based comparison
    if (parsed.speedGHz !== null || parsed.cores !== null) {
      const specStatus = compareSpecsOnly(user.cpuSpeedGHz, user.cpuCores, parsed);
      if (specStatus === "pass") return "pass"; // Found a passing alternative
      if (specStatus !== "info") {
        // Keep track of best non-info status
        if (bestStatus === "info") bestStatus = specStatus;
        else if (bestStatus === "fail" && specStatus === "warn") bestStatus = "warn";
      }

      // Strategy 2b: Requirement is speed/cores only (no model) but user's CPU is
      // a known model in our database — any tracked CPU can handle generic speed
      // requirements (all CPUs in our DB are modern enough to meet them).
      if (specStatus === "info" && !parsed.model && user.cpu) {
        const userMatch = fuzzyMatchHardware(user.cpu, candidates);
        if (userMatch && scores[userMatch] != null) {
          return "pass";
        }
      }
    }
  }

  // If we couldn't determine anything from alternatives, try the original hardware comparison
  if (bestStatus === "info" && user.cpu) {
    return compareHardware(user.cpu, reqText, candidates, scores);
  }

  return bestStatus;
}

/**
 * Map lspci GPU codenames to recognizable product names.
 * Keys are lowercase for case-insensitive lookup.
 */
const GPU_CODENAME_MAP: Record<string, string> = {
  // AMD codenames
  "navi 10": "AMD Radeon RX 5600 XT",
  "navi 14": "AMD Radeon RX 5500 XT",
  "navi 21": "AMD Radeon RX 6800 XT",
  "navi 22": "AMD Radeon RX 6700 XT",
  "navi 23": "AMD Radeon RX 6600",
  "navi 24": "AMD Radeon RX 6500 XT",
  "navi 31": "AMD Radeon RX 7900 XTX",
  "navi 32": "AMD Radeon RX 7800 XT",
  "navi 33": "AMD Radeon RX 7600",
  "vangogh": "AMD Radeon Vega 8",
  "tahiti pro": "AMD Radeon HD 7950",
  "tahiti xt": "AMD Radeon HD 7970",
  "hawaii pro": "AMD Radeon R9 290",
  "hawaii xt": "AMD Radeon R9 290X",
  "ellesmere": "AMD Radeon RX 480",
  "polaris": "AMD Radeon RX 580",
  "vega 10": "AMD Radeon RX Vega 56",
  "vega 20": "AMD Radeon VII",
  "renoir": "AMD Radeon Vega 8",
  "cezanne": "AMD Radeon Vega 8",
  "rembrandt": "AMD Radeon 680M",
  "phoenix": "AMD Radeon 780M",
  "raphael": "AMD Radeon 780M",
  // Intel codenames
  "alderlake-s gt1": "Intel UHD Graphics 770",
  "alderlake-p gt2": "Intel Iris Xe Graphics",
  "raptorlake-s gt1": "Intel UHD Graphics 770",
  "raptorlake-p gt2": "Intel Iris Xe Graphics",
  "tigerlake gt2": "Intel Iris Xe Graphics",
  "coffeelake gt2": "Intel UHD Graphics 630",
  "kabylake gt2": "Intel HD Graphics 630",
  "skylake gt2": "Intel HD Graphics 530",
  // NVIDIA codenames
  "ga104": "NVIDIA GeForce RTX 3070",
  "ga106": "NVIDIA GeForce RTX 3060",
  "ga102": "NVIDIA GeForce RTX 3090",
  "ad104": "NVIDIA GeForce RTX 4070 Ti",
  "ad103": "NVIDIA GeForce RTX 4080",
  "ad102": "NVIDIA GeForce RTX 4090",
  "tu106": "NVIDIA GeForce RTX 2070",
  "tu104": "NVIDIA GeForce RTX 2080",
  "tu102": "NVIDIA GeForce RTX 2080 Ti",
  "gp106": "NVIDIA GeForce GTX 1060 6GB",
  "gp104": "NVIDIA GeForce GTX 1080",
  "gp102": "NVIDIA GeForce GTX 1080 Ti",
};

/**
 * Try to resolve an lspci codename to a known product name.
 * Returns the mapped name or null if no match.
 */
function resolveGPUCodename(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [codename, product] of Object.entries(GPU_CODENAME_MAP)) {
    if (lower.includes(codename)) return product;
  }
  return null;
}

/**
 * Clean raw lspci GPU strings that may have been stored from older scanner versions.
 * e.g. "00:02.0 VGA compatible controller: Intel Corporation Raptor Lake-P [UHD Graphics] (rev 04)"
 * → "Intel UHD Graphics"
 */
function cleanLspciGPU(text: string): string {
  if (!text) return text;
  // Strip slot address prefix and device class if present
  let cleaned = text.replace(/^\d{2}:\d{2}\.\d\s+.*?:\s*/, "");
  // Strip "(rev XX)"
  cleaned = cleaned.replace(/\(rev\s+[0-9a-fA-F]+\)/gi, "");

  // Detect vendor
  const lower = cleaned.toLowerCase();
  let vendor = "";
  if (lower.includes("intel")) vendor = "Intel";
  else if (lower.includes("nvidia")) vendor = "NVIDIA";
  else if (lower.includes("amd") || lower.includes("advanced micro")) vendor = "AMD";

  // Strip "[AMD/ATI]" tag before bracket extraction (it's a vendor tag, not a device name)
  cleaned = cleaned.replace(/\[AMD\/ATI\]\s*/gi, "");

  // Extract bracket content as device name (e.g. [GeForce RTX 3070], [UHD Graphics])
  const bracketMatch = cleaned.match(/\[(.+?)\]/);
  if (bracketMatch) {
    const deviceName = bracketMatch[1];
    if (vendor && !deviceName.toLowerCase().includes(vendor.toLowerCase())) {
      cleaned = (vendor + " " + deviceName).replace(/\s+/g, " ").trim();
    } else {
      cleaned = deviceName.replace(/\s+/g, " ").trim();
    }
  } else {
    // No brackets — strip common noise words
    cleaned = cleaned.replace(/\bCorporation\b/gi, "");
    cleaned = cleaned.replace(/\bAdvanced Micro Devices,?\s*Inc\.?\s*/gi, "AMD ");
    cleaned = cleaned.replace(/\s+/g, " ").trim();
  }

  // Try codename resolution on the original text (before cleaning may have lost info)
  // and on the cleaned text — use codename match if the cleaned name doesn't look
  // like a recognizable product (i.e. no model number pattern)
  const hasModelNumber = /\b(geforce|radeon\s*(rx|hd|r[79]|pro)|gtx|rtx|arc\s*a\d|uhd|iris|hd\s+graphics)\b/i.test(cleaned);
  if (!hasModelNumber) {
    const resolved = resolveGPUCodename(text) ?? resolveGPUCodename(cleaned);
    if (resolved) return resolved;
  }

  return cleaned;
}

function compareHardware(
  userText: string,
  reqText: string,
  candidates: string[],
  scores: Record<string, number>
): ComparisonStatus {
  if (!reqText) return "pass";
  if (!userText) return "info";

  const userMatch = fuzzyMatchHardware(userText, candidates);
  if (!userMatch) return "info";
  const userScore = scores[userMatch];
  if (userScore == null) return "info";

  // Try each alternative in the requirement text — pass if user beats any
  const alternatives = splitAlternatives(reqText);
  let bestReqScore: number | null = null;

  for (const alt of alternatives) {
    const reqMatch = fuzzyMatchHardware(alt, candidates);
    if (reqMatch && scores[reqMatch] != null) {
      if (bestReqScore === null || scores[reqMatch] < bestReqScore) {
        bestReqScore = scores[reqMatch];
      }
    }
  }

  if (bestReqScore === null) return "info";

  return userScore >= bestReqScore ? "pass" : "fail";
}

export function compareSpecs(
  user: UserSpecs,
  minimum: GameRequirements | null,
  recommended: GameRequirements | null,
  cpuScores: Record<string, number>,
  gpuScores: Record<string, number>
): ComparisonItem[] {
  const min = minimum ?? { os: "", cpu: "", gpu: "", ram: "", storage: "" };
  const rec = recommended ?? { os: "", cpu: "", gpu: "", ram: "", storage: "" };

  const items: ComparisonItem[] = [];

  // OS — version-based comparison
  const osMinStatus = compareOS(user.os, min.os);
  const osRecStatus = compareOS(user.os, rec.os);
  items.push({
    label: "Operating System",
    userValue: user.os || "Unknown",
    minValue: min.os || "—",
    recValue: rec.os || "—",
    minStatus: osMinStatus,
    recStatus: osRecStatus,
  });

  // CPU — model match + spec-based fallback for clock speed/cores
  const cpuDisplay = user.cpuSpeedGHz
    ? `${user.cpu || "Unknown"} @ ${user.cpuSpeedGHz.toFixed(1)} GHz`
    : user.cpu || "Unknown";
  let cpuMinStatus = compareCPU(user, min.cpu, Object.keys(cpuScores), cpuScores);
  let cpuRecStatus = compareCPU(user, rec.cpu, Object.keys(cpuScores), cpuScores);
  // If one column is unmatched but the other passes, promote info → pass
  if (cpuMinStatus === "info" && cpuRecStatus === "pass") cpuMinStatus = "pass";
  if (cpuRecStatus === "info" && cpuMinStatus === "pass") cpuRecStatus = "pass";

  items.push({
    label: "Processor",
    userValue: cpuDisplay,
    minValue: min.cpu || "—",
    recValue: rec.cpu || "—",
    minStatus: cpuMinStatus,
    recStatus: cpuRecStatus,
  });

  // GPU — fuzzy match + score comparison, with capability requirement fallback
  // Clean raw lspci strings from older scanner versions
  const cleanedGPU = cleanLspciGPU(user.gpu);
  let gpuMinStatus = compareHardware(cleanedGPU, min.gpu, Object.keys(gpuScores), gpuScores);
  let gpuRecStatus = compareHardware(cleanedGPU, rec.gpu, Object.keys(gpuScores), gpuScores);

  // When the user's GPU is a known modern model but the requirement couldn't be matched,
  // the requirement is likely too old/obscure to be in our database (e.g. "32MB Radeon",
  // "GeForce 2") or is a capability requirement (e.g. "OpenGL 3.3").
  // Any tracked GPU exceeds these ancient/generic requirements.
  if (gpuMinStatus === "info" && min.gpu && cleanedGPU) {
    const userMatch = fuzzyMatchHardware(cleanedGPU, Object.keys(gpuScores));
    if (userMatch && gpuScores[userMatch] != null) gpuMinStatus = "pass";
  }
  if (gpuRecStatus === "info" && rec.gpu && cleanedGPU) {
    const userMatch = fuzzyMatchHardware(cleanedGPU, Object.keys(gpuScores));
    if (userMatch && gpuScores[userMatch] != null) gpuRecStatus = "pass";
  }
  if (gpuMinStatus === "info" && gpuRecStatus === "pass") gpuMinStatus = "pass";
  if (gpuRecStatus === "info" && gpuMinStatus === "pass") gpuRecStatus = "pass";

  items.push({
    label: "Graphics",
    userValue: cleanedGPU || "Unknown",
    minValue: min.gpu || "—",
    recValue: rec.gpu || "—",
    minStatus: gpuMinStatus,
    recStatus: gpuRecStatus,
  });

  // RAM — numeric comparison
  const ramDisplay = user.ramGB ? `${user.ramGB} GB` : "Unknown";
  items.push({
    label: "Memory (RAM)",
    userValue: ramDisplay,
    minValue: min.ram || "—",
    recValue: rec.ram || "—",
    minStatus: compareNumeric(user.ramGB, min.ram),
    recStatus: compareNumeric(user.ramGB, rec.ram),
  });

  // Storage — numeric comparison
  const storageDisplay = user.storageGB ? `${user.storageGB} GB` : "Unknown";
  items.push({
    label: "Storage",
    userValue: storageDisplay,
    minValue: min.storage || "—",
    recValue: rec.storage || "—",
    minStatus: compareNumeric(user.storageGB, min.storage),
    recStatus: compareNumeric(user.storageGB, rec.storage),
  });

  return items;
}
