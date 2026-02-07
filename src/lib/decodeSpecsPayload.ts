import { UserSpecs } from "@/types";

const PREFIX = "DINAU:";

export function decodeSpecsPayload(input: string): UserSpecs | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith(PREFIX)) return null;

  const b64 = trimmed.slice(PREFIX.length);

  let json: string;
  try {
    json = atob(b64);
  } catch {
    return null;
  }

  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof data !== "object" || data === null) return null;

  const obj = data as Record<string, unknown>;

  if (typeof obj.os !== "string") return null;
  if (typeof obj.cpu !== "string") return null;
  if (typeof obj.gpu !== "string" && obj.gpu !== null && obj.gpu !== undefined) return null;

  const cpuCores = typeof obj.cpuCores === "number" ? obj.cpuCores : null;
  const cpuSpeedGHz = typeof obj.cpuSpeedGHz === "number" ? obj.cpuSpeedGHz : null;
  const ramGB = typeof obj.ramGB === "number" ? obj.ramGB : null;
  const storageGB = typeof obj.storageGB === "number" ? obj.storageGB : null;

  return {
    os: obj.os,
    cpu: obj.cpu,
    cpuCores,
    cpuSpeedGHz,
    gpu: typeof obj.gpu === "string" ? obj.gpu : "",
    ramGB,
    storageGB,
    detectionSource: "script",
    ramApproximate: false,
  };
}
