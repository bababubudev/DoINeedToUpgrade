import { ComparisonItem, VerdictResult, UpgradeItem } from "@/types";

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function computeVerdict(items: ComparisonItem[]): VerdictResult {
  // Filter out components where the game doesn't specify any requirement
  // (both min and rec are "—") — these shouldn't affect the verdict
  const relevantItems = items.filter(
    (item) => item.minValue !== "—" || item.recValue !== "—"
  );

  // No requirements were provided at all — let the user know
  if (relevantItems.length === 0) {
    return {
      verdict: "pass",
      title: "No system requirements were provided for this game",
      description:
        "We couldn't find any system requirements to compare against. This game may not have published its requirements yet.",
      failedComponents: [],
      warnComponents: [],
      upgradeItems: [],
    };
  }

  const failedComponents: string[] = [];
  const warnComponents: string[] = [];
  const upgradeItems: UpgradeItem[] = [];

  for (const item of relevantItems) {
    if (item.minStatus === "fail") {
      failedComponents.push(item.label);
      upgradeItems.push({
        component: item.label,
        current: item.userValue,
        required: item.minValue !== "—" ? item.minValue : item.recValue,
      });
    } else if (item.recStatus === "fail") {
      // Meets minimum but not recommended — suggest upgrade
      upgradeItems.push({
        component: item.label,
        current: item.userValue,
        required: item.recValue,
      });
    }
    if (item.minStatus === "warn" || item.recStatus === "warn" || item.minStatus === "info" || item.recStatus === "info") {
      if (!warnComponents.includes(item.label)) {
        warnComponents.push(item.label);
      }
    }
  }

  // Any fail in minStatus → fail
  if (failedComponents.length > 0) {
    return {
      verdict: "fail",
      title: `You'll need to upgrade your ${formatList(failedComponents.map((c) => c.toLowerCase()))} to run this game`,
      description: `Your ${formatList(failedComponents.map((c) => c.toLowerCase()))} ${failedComponents.length === 1 ? "falls" : "fall"} below the minimum requirements.`,
      failedComponents,
      warnComponents,
      upgradeItems,
    };
  }

  const allMinPass = relevantItems.every((i) => i.minStatus === "pass");
  const allMinPassOrInfo = relevantItems.every(
    (i) => i.minStatus === "pass" || i.minStatus === "info"
  );
  const allRecPass = relevantItems.every((i) => i.recStatus === "pass");
  const allRecPassOrInfo = relevantItems.every(
    (i) => i.recStatus === "pass" || i.recStatus === "info"
  );
  const hasInfo = relevantItems.some(
    (i) => i.minStatus === "info" || i.recStatus === "info"
  );

  // All confirmed pass → pass
  if (allMinPass && allRecPass) {
    return {
      verdict: "pass",
      title: "You're good to go — no upgrade needed!",
      description: "Your system meets or exceeds the recommended specs.",
      failedComponents,
      warnComponents,
      upgradeItems,
    };
  }

  // Everything passes or is unknown — but some are unknown → needs review
  if (allMinPassOrInfo && allRecPassOrInfo && hasInfo) {
    return {
      verdict: "unknown",
      title: "An upgrade probably isn't needed, but we can't say for sure",
      description: `We couldn't automatically verify your ${formatList(warnComponents.map((c) => c.toLowerCase()))} against the game's requirements.`,
      failedComponents,
      warnComponents,
      upgradeItems,
    };
  }

  // All min confirmed pass but some rec fail or warn → minimum or unknown
  if (allMinPass) {
    const recFailed = upgradeItems.map((u) => u.component.toLowerCase());
    const hasRecFail = relevantItems.some((i) => i.recStatus === "fail");

    if (hasRecFail) {
      return {
        verdict: "minimum",
        title: "It'll run, but an upgrade would make it smoother",
        description: recFailed.length > 0
          ? `Your system can handle this game, but upgrading your ${formatList(recFailed)} would give you a better experience.`
          : "You meet the minimum specs, but you might need to turn down some settings for smoother performance.",
        failedComponents,
        warnComponents,
        upgradeItems,
      };
    }

    // Min passes but rec is only warn (couldn't verify) — no confirmed shortfall
    return {
      verdict: "minimum",
      title: "It'll run, but we couldn't fully verify the recommended specs",
      description: `Your system meets the minimum requirements. We couldn't automatically verify your ${formatList(warnComponents.map((c) => c.toLowerCase()))} against the recommended specs.`,
      failedComponents,
      warnComponents,
      upgradeItems,
    };
  }

  // Otherwise → unknown
  return {
    verdict: "unknown",
    title: "Not sure if you need an upgrade — take a look below",
    description: "We weren't able to determine if your system can run this game.",
    failedComponents,
    warnComponents,
    upgradeItems,
  };
}
