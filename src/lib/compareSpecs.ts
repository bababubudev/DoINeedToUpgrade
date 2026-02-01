import { UserSpecs, GameRequirements, ComparisonItem, ComparisonStatus } from "@/types";
import { cpuList, gpuList, cpuScores, gpuScores } from "@/lib/hardwareData";
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

function compareHardware(
  userText: string,
  reqText: string,
  candidates: string[],
  scores: Record<string, number>
): ComparisonStatus {
  if (!userText || !reqText) return "info";

  const userMatch = fuzzyMatchHardware(userText, candidates);
  const reqMatch = fuzzyMatchHardware(reqText, candidates);

  if (!userMatch || !reqMatch) return "info";

  const userScore = scores[userMatch];
  const reqScore = scores[reqMatch];

  if (userScore == null || reqScore == null) return "info";

  return userScore >= reqScore ? "pass" : "fail";
}

export function compareSpecs(
  user: UserSpecs,
  minimum: GameRequirements | null,
  recommended: GameRequirements | null
): ComparisonItem[] {
  const min = minimum ?? { os: "", cpu: "", gpu: "", ram: "", storage: "", directx: "" };
  const rec = recommended ?? { os: "", cpu: "", gpu: "", ram: "", storage: "", directx: "" };

  const items: ComparisonItem[] = [];

  // OS — text comparison only
  items.push({
    label: "Operating System",
    userValue: user.os || "Unknown",
    minValue: min.os || "—",
    recValue: rec.os || "—",
    minStatus: "info",
    recStatus: "info",
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
    minStatus: compareHardware(user.cpu, min.cpu, cpuList, cpuScores),
    recStatus: compareHardware(user.cpu, rec.cpu, cpuList, cpuScores),
  });

  // GPU — fuzzy match + score comparison
  items.push({
    label: "Graphics",
    userValue: user.gpu || "Unknown",
    minValue: min.gpu || "—",
    recValue: rec.gpu || "—",
    minStatus: compareHardware(user.gpu, min.gpu, gpuList, gpuScores),
    recStatus: compareHardware(user.gpu, rec.gpu, gpuList, gpuScores),
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

  // DirectX — info only
  if (min.directx || rec.directx) {
    items.push({
      label: "DirectX",
      userValue: "—",
      minValue: min.directx || "—",
      recValue: rec.directx || "—",
      minStatus: "info",
      recStatus: "info",
    });
  }

  return items;
}
