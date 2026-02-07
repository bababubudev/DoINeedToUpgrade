import { GameRequirements, ParsedGameRequirements } from "@/types";

export interface ParsedCPUSpecs {
  model: string | null;      // The CPU model name (if identifiable)
  speedGHz: number | null;   // Clock speed in GHz
  cores: number | null;      // Core count
  raw: string;               // Original requirement string
}

/**
 * Parse a CPU requirement string to extract clock speed, core count, and model.
 * Examples:
 * - "2.6 GHz Quad Core" → { model: null, speedGHz: 2.6, cores: 4 }
 * - "Intel Core i5 @ 3.6 GHz" → { model: "Intel Core i5", speedGHz: 3.6, cores: null }
 * - "i5 3GHz or Ryzen 5 3GHz" → only parses first alternative; use splitAlternatives first
 */
export function parseCPURequirement(text: string): ParsedCPUSpecs {
  const raw = text;
  let speedGHz: number | null = null;
  let cores: number | null = null;

  // Extract clock speed: "3.6 GHz", "3.6GHz", "@ 3.6 GHz", "2600 MHz"
  const ghzMatch = text.match(/@?\s*(\d+(?:\.\d+)?)\s*GHz/i);
  if (ghzMatch) {
    speedGHz = parseFloat(ghzMatch[1]);
  } else {
    const mhzMatch = text.match(/@?\s*(\d+)\s*MHz/i);
    if (mhzMatch) {
      speedGHz = parseInt(mhzMatch[1], 10) / 1000;
    }
  }

  // Extract core count: "Quad Core", "4-core", "4 cores", "Dual Core", "Octa-core"
  const corePatterns: { pattern: RegExp; count: number | null }[] = [
    { pattern: /dual[\s-]?core/i, count: 2 },
    { pattern: /quad[\s-]?core/i, count: 4 },
    { pattern: /hexa[\s-]?core/i, count: 6 },
    { pattern: /octa[\s-]?core/i, count: 8 },
    { pattern: /(\d+)[\s-]?cores?/i, count: null },
  ];

  for (const { pattern, count } of corePatterns) {
    const match = text.match(pattern);
    if (match) {
      cores = count ?? parseInt(match[1], 10);
      break;
    }
  }

  // Strip spec patterns to try to extract model name
  let strippedText = text
    .replace(/@?\s*\d+(?:\.\d+)?\s*(GHz|MHz)/gi, "")
    .replace(/\d+\s*-?\s*cores?\b/gi, "")
    .replace(/(dual|quad|hexa|octa)[\s-]?core/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Check if remaining text looks like a CPU model
  let model: string | null = null;
  if (strippedText && strippedText.length > 2) {
    // Contains identifiable CPU brand/model markers
    const hasModel = /intel|amd|ryzen|core\s*i[3579]|apple\s*m\d/i.test(strippedText);
    if (hasModel) {
      model = strippedText;
    }
  }

  return { model, speedGHz, cores, raw };
}

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
  };

  for (const line of lines) {
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
