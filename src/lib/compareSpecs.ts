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
  if (lower.includes("macos") || lower.includes("mac os") || lower.includes("os x")) return "macos";
  if (lower.includes("linux") || lower.includes("ubuntu") || lower.includes("steamos")) return "linux";
  return null;
}

function compareOS(userOS: string, reqOS: string): ComparisonStatus {
  if (!reqOS) return "pass";
  if (!userOS) return "info";

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

  const userMatch = fuzzyMatchHardware(userOS, samePlatformList);
  const reqMatch = fuzzyMatchHardware(reqOS, samePlatformList);

  if (userMatch && reqMatch) {
    const userScore = osScores[userMatch];
    const reqScore = osScores[reqMatch];

    if (userScore != null && reqScore != null) {
      return userScore >= reqScore ? "pass" : "fail";
    }
  }

  // Same platform but couldn't determine version ordering
  return "pass";
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
 * Compare CPU with fallback to spec-based comparison.
 * 1. Try model-based matching first (existing logic)
 * 2. Fall back to spec-based comparison when model matching fails
 */
function compareCPU(
  user: UserSpecs,
  reqText: string,
  candidates: string[],
  scores: Record<string, number>
): ComparisonStatus {
  if (!reqText) return "pass";

  // Try each alternative in the requirement text
  const alternatives = splitAlternatives(reqText);
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
 * Detect if a requirement string describes a graphics API capability
 * (e.g. "Support for OpenGL 3.3", "DirectX 11 compatible") rather than
 * a specific GPU model.
 */
function isGpuCapabilityRequirement(text: string): boolean {
  if (!text) return false;
  const hasCapability = /\b(opengl|directx|direct3d|dx\s*\d+|vulkan|metal|shader\s*model|opencl)\b/i.test(text);
  const hasModel = /\b(nvidia|geforce|radeon|gtx|rtx|rx\s*\d{3,4}|intel\s*(hd|uhd|iris|arc)|apple\s*m\d)\b/i.test(text);
  return hasCapability && !hasModel;
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
  let gpuMinStatus = compareHardware(user.gpu, min.gpu, Object.keys(gpuScores), gpuScores);
  let gpuRecStatus = compareHardware(user.gpu, rec.gpu, Object.keys(gpuScores), gpuScores);

  // When requirement is a capability (e.g. "OpenGL 3.3") rather than a GPU model
  // and user's GPU is a known model, treat as pass — any tracked GPU supports these APIs.
  if (gpuMinStatus === "info" && isGpuCapabilityRequirement(min.gpu) && user.gpu) {
    const userMatch = fuzzyMatchHardware(user.gpu, Object.keys(gpuScores));
    if (userMatch && gpuScores[userMatch] != null) gpuMinStatus = "pass";
  }
  if (gpuRecStatus === "info" && isGpuCapabilityRequirement(rec.gpu) && user.gpu) {
    const userMatch = fuzzyMatchHardware(user.gpu, Object.keys(gpuScores));
    if (userMatch && gpuScores[userMatch] != null) gpuRecStatus = "pass";
  }
  if (gpuMinStatus === "info" && gpuRecStatus === "pass") gpuMinStatus = "pass";
  if (gpuRecStatus === "info" && gpuMinStatus === "pass") gpuRecStatus = "pass";

  items.push({
    label: "Graphics",
    userValue: user.gpu || "Unknown",
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
