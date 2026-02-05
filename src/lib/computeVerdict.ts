import { ComparisonItem, VerdictResult, UpgradeItem } from "@/types";

function formatList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function computeVerdict(items: ComparisonItem[]): VerdictResult {
  const failedComponents: string[] = [];
  const warnComponents: string[] = [];
  const upgradeItems: UpgradeItem[] = [];

  for (const item of items) {
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
      title: "Yes, you need an upgrade",
      description: `Your ${formatList(failedComponents.map((c) => c.toLowerCase()))} ${failedComponents.length === 1 ? "doesn't" : "don't"} meet the minimum requirements.`,
      failedComponents,
      warnComponents,
      upgradeItems,
    };
  }

  const allMinPass = items.every((i) => i.minStatus === "pass");
  const allMinPassOrInfo = items.every(
    (i) => i.minStatus === "pass" || i.minStatus === "info"
  );
  const allRecPass = items.every((i) => i.recStatus === "pass");
  const allRecPassOrInfo = items.every(
    (i) => i.recStatus === "pass" || i.recStatus === "info"
  );
  const hasInfo = items.some(
    (i) => i.minStatus === "info" || i.recStatus === "info"
  );

  // All confirmed pass → pass
  if (allMinPass && allRecPass) {
    return {
      verdict: "pass",
      title: "No, you don't need an upgrade!",
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
      title: "Probably not, but we're not 100% sure",
      description: `We couldn't verify your ${formatList(warnComponents.map((c) => c.toLowerCase()))} automatically.`,
      failedComponents,
      warnComponents,
      upgradeItems,
    };
  }

  // All min pass (or info) but some rec fail → minimum
  if (allMinPassOrInfo) {
    const recFailed = upgradeItems.map((u) => u.component.toLowerCase());
    return {
      verdict: "minimum",
      title: "Not required, but an upgrade would help",
      description: recFailed.length > 0
        ? `Upgrading your ${formatList(recFailed)} would improve the experience.`
        : "You may need to lower graphics settings for smoother performance.",
      failedComponents,
      warnComponents,
      upgradeItems,
    };
  }

  // Otherwise → unknown
  return {
    verdict: "unknown",
    title: "We're not sure — check the details below",
    description: "Review the comparison below to decide.",
    failedComponents,
    warnComponents,
    upgradeItems,
  };
}
