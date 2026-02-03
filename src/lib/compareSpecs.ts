import { UserSpecs, GameRequirements, ComparisonItem, ComparisonStatus } from "@/types";
import { osList, osScores } from "@/lib/hardwareData";
import { fuzzyMatchHardware } from "@/lib/fuzzyMatch";

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
  if (userVal === null || !reqText) return "info";
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
  if (!userOS || !reqOS) return "info";

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

function compareHardware(
  userText: string,
  reqText: string,
  candidates: string[],
  scores: Record<string, number>
): ComparisonStatus {
  if (!userText || !reqText) return "info";

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
  items.push({
    label: "Operating System",
    userValue: user.os || "Unknown",
    minValue: min.os || "—",
    recValue: rec.os || "—",
    minStatus: compareOS(user.os, min.os),
    recStatus: compareOS(user.os, rec.os),
  });

  // CPU — fuzzy match + score comparison
  const cpuDisplay = user.cpu
    ? user.cpuCores
      ? `${user.cpu} (${user.cpuCores} cores)`
      : user.cpu
    : user.cpuCores
      ? `${user.cpuCores} cores detected`
      : "Unknown";

  items.push({
    label: "Processor",
    userValue: cpuDisplay,
    minValue: min.cpu || "—",
    recValue: rec.cpu || "—",
    minStatus: compareHardware(user.cpu, min.cpu, Object.keys(cpuScores), cpuScores),
    recStatus: compareHardware(user.cpu, rec.cpu, Object.keys(cpuScores), cpuScores),
  });

  // GPU — fuzzy match + score comparison
  items.push({
    label: "Graphics",
    userValue: user.gpu || "Unknown",
    minValue: min.gpu || "—",
    recValue: rec.gpu || "—",
    minStatus: compareHardware(user.gpu, min.gpu, Object.keys(gpuScores), gpuScores),
    recStatus: compareHardware(user.gpu, rec.gpu, Object.keys(gpuScores), gpuScores),
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
