import { GameRequirements, ParsedGameRequirements } from "@/types";

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&trade;/g, "™")
    .replace(/&reg;/g, "®")
    .trim();
}

function parseSection(text: string): GameRequirements {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: GameRequirements = {
    os: "",
    cpu: "",
    gpu: "",
    ram: "",
    storage: "",
    directx: "",
  };

  for (const line of lines) {
    const lower = line.toLowerCase();
    // Match patterns like "OS: Windows 10" or "OS *: Windows 10"
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) continue;

    const key = match[1].toLowerCase().replace(/\*/g, "").trim();
    const value = match[2].trim();

    if (key.includes("os") || key.includes("operating")) {
      result.os = value;
    } else if (key.includes("processor") || key.includes("cpu")) {
      result.cpu = value;
    } else if (key.includes("graphics") || key.includes("video") || key.includes("gpu")) {
      result.gpu = value;
    } else if (key.includes("memory") || key.includes("ram")) {
      result.ram = value;
    } else if (key.includes("storage") || key.includes("hard") || key.includes("disk") || key.includes("space")) {
      result.storage = value;
    } else if (key.includes("directx")) {
      result.directx = value;
    }
  }

  return result;
}

export function parseRequirements(
  minimumHtml: string | undefined,
  recommendedHtml: string | undefined
): ParsedGameRequirements {
  return {
    minimum: minimumHtml ? parseSection(stripHtml(minimumHtml)) : null,
    recommended: recommendedHtml ? parseSection(stripHtml(recommendedHtml)) : null,
  };
}
