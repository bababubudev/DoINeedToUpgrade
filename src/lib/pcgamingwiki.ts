import { GameRequirements, ParsedGameRequirements, Platform, PlatformRequirements } from "@/types";

const API_BASE = "https://www.pcgamingwiki.com/w/api.php";

/**
 * Search PCGamingWiki for a game by name and extract system requirements.
 * Returns null if the game or requirements can't be found.
 */
export async function fetchPCGWRequirements(
  gameName: string
): Promise<{ platformRequirements: PlatformRequirements; availablePlatforms: Platform[] } | null> {
  try {
    const wikitext = await fetchPageWikitext(gameName);
    if (!wikitext) return null;

    // 3. Extract all {{System requirements}} templates
    const templates = extractSystemRequirementsTemplates(wikitext);
    if (templates.length === 0) return null;

    // 4. Parse each template into our format
    const platformRequirements: PlatformRequirements = {};
    const availablePlatforms: Platform[] = [];

    for (const template of templates) {
      const params = parseTemplateParams(template);
      const osFamily = (params.osfamily || "").toLowerCase().trim();

      let platform: Platform;
      if (osFamily.includes("windows") || osFamily === "" || osFamily.includes("pc")) {
        platform = "windows";
      } else if (osFamily.includes("os x") || osFamily.includes("mac")) {
        platform = "macos";
      } else if (osFamily.includes("linux")) {
        platform = "linux";
      } else {
        continue;
      }

      if (platformRequirements[platform]) continue; // already have this platform

      const parsed = buildRequirements(params);
      if (hasContent(parsed.minimum) || hasContent(parsed.recommended)) {
        platformRequirements[platform] = parsed;
        availablePlatforms.push(platform);
      }
    }

    if (availablePlatforms.length === 0) return null;

    return { platformRequirements, availablePlatforms };
  } catch {
    return null;
  }
}

/**
 * Try to fetch the wikitext for a game page.
 * Strategy: try direct page access first (works for exact titles), then fall back to search.
 */
async function fetchPageWikitext(gameName: string): Promise<string | null> {
  // Try direct page access first (handles exact names and redirects)
  const directRes = await fetch(
    `${API_BASE}?action=parse&page=${encodeURIComponent(gameName)}&prop=wikitext&format=json&redirects=1`
  );
  if (directRes.ok) {
    const directData = await directRes.json();
    const wikitext = directData?.parse?.wikitext?.["*"];
    if (wikitext && wikitext.includes("{{System requirements")) {
      return wikitext;
    }
  }

  // Fall back to search
  const searchRes = await fetch(
    `${API_BASE}?action=query&list=search&srsearch=${encodeURIComponent(gameName)}&format=json&srlimit=5`
  );
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json();
  const results = searchData?.query?.search;
  if (!results?.length) return null;

  // Prefer exact title match (case-insensitive)
  const nameLower = gameName.toLowerCase();
  const pageTitle =
    results.find((r: { title: string }) => r.title.toLowerCase() === nameLower)?.title
    ?? results[0].title;

  const parseRes = await fetch(
    `${API_BASE}?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&format=json&redirects=1`
  );
  if (!parseRes.ok) return null;

  const parseData = await parseRes.json();
  return parseData?.parse?.wikitext?.["*"] || null;
}

/**
 * Extract all {{System requirements ...}} template blocks from wikitext,
 * handling nested templates like {{ii}} or {{note|...}}.
 */
function extractSystemRequirementsTemplates(wikitext: string): string[] {
  const templates: string[] = [];
  let searchFrom = 0;

  while (true) {
    const start = wikitext.indexOf("{{System requirements", searchFrom);
    if (start === -1) break;

    let depth = 0;
    let i = start;
    while (i < wikitext.length) {
      if (wikitext[i] === "{" && wikitext[i + 1] === "{") {
        depth++;
        i += 2;
      } else if (wikitext[i] === "}" && wikitext[i + 1] === "}") {
        depth--;
        i += 2;
        if (depth === 0) {
          templates.push(wikitext.slice(start, i));
          break;
        }
      } else {
        i++;
      }
    }

    searchFrom = i;
  }

  return templates;
}

/**
 * Strip nested wiki markup from a value string.
 * Removes {{...}} templates (including nested ones), <ref>...</ref> tags, and [[links]].
 */
function stripWikiMarkup(text: string): string {
  // Remove <ref>...</ref> and self-closing <ref/> tags
  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "").replace(/<ref[^/]*\/>/g, "");

  // Remove nested {{...}} templates
  let result = "";
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "{" && text[i + 1] === "{") {
      depth++;
      i++;
    } else if (text[i] === "}" && text[i + 1] === "}") {
      depth--;
      i++;
    } else if (depth === 0) {
      result += text[i];
    }
  }

  // Resolve [[links]] — use display text if present, otherwise the target
  result = result.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1");

  return result.trim();
}

/**
 * Parse pipe-delimited template parameters into a key-value map.
 * e.g. "|minCPU = Intel Core i5-8400" → { mincpu: "Intel Core i5-8400" }
 */
function parseTemplateParams(template: string): Record<string, string> {
  const params: Record<string, string> = {};

  // Remove the outer {{ and }} and template name
  const inner = template
    .replace(/^\{\{System requirements\s*/, "")
    .replace(/\}\}$/, "");

  // Split on top-level pipes (not inside nested {{ }})
  const parts: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "{" && inner[i + 1] === "{") {
      depth++;
      current += "{{";
      i++;
    } else if (inner[i] === "}" && inner[i + 1] === "}") {
      depth--;
      current += "}}";
      i++;
    } else if (inner[i] === "|" && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += inner[i];
    }
  }
  if (current) parts.push(current);

  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) continue;

    const key = part.slice(0, eqIdx).trim().toLowerCase();
    let value = part.slice(eqIdx + 1).trim();

    // Strip wiki markup: {{...}} templates, <ref>...</ref> tags, [[links]]
    value = stripWikiMarkup(value);

    if (value) {
      params[key] = value;
    }
  }

  return params;
}

/**
 * Build our GameRequirements from parsed PCGamingWiki template params.
 * Combines CPU and CPU2 alternatives with " / " separator.
 */
function buildRequirements(params: Record<string, string>): ParsedGameRequirements {
  const buildReqs = (prefix: "min" | "rec"): GameRequirements | null => {
    const cpu = joinAlternatives(params[`${prefix}cpu`], params[`${prefix}cpu2`]);
    const gpu = joinAlternatives(params[`${prefix}gpu`], params[`${prefix}gpu2`]);
    const os = params[`${prefix}os`] || "";
    const ram = params[`${prefix}ram`] || "";
    const storage = params[`${prefix}hd`] || "";

    // Prefix OS with "Windows" if it's just a version number
    const osFormatted = os && !os.toLowerCase().includes("windows") && !os.toLowerCase().includes("mac") && !os.toLowerCase().includes("linux")
      ? `Windows ${os}`
      : os;

    return {
      os: osFormatted,
      cpu,
      gpu,
      ram,
      storage,
    };
  };

  return {
    minimum: buildReqs("min"),
    recommended: buildReqs("rec"),
  };
}

function joinAlternatives(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(" / ");
}

function hasContent(reqs: GameRequirements | null): boolean {
  if (!reqs) return false;
  return Object.values(reqs).some((v) => v && v.trim() !== "");
}
