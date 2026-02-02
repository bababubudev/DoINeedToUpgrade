import { ComparisonItem, VerdictResult, UpgradeItem } from "@/types";

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
    if (item.minStatus === "warn" || item.recStatus === "warn") {
      warnComponents.push(item.label);
    }
  }

  // Any fail in minStatus → fail
  if (failedComponents.length > 0) {
    return {
      verdict: "fail",
      title: "You Need To Upgrade",
      description: `Your system does not meet the minimum requirements for ${failedComponents.length} component${failedComponents.length > 1 ? "s" : ""}.`,
      failedComponents,
      warnComponents,
      upgradeItems,
    };
  }

  const allMinPass = items.every(
    (i) => i.minStatus === "pass" || i.minStatus === "info"
  );
  const allRecPass = items.every(
    (i) => i.recStatus === "pass" || i.recStatus === "info"
  );

  // All min pass and all rec pass → pass
  if (allMinPass && allRecPass) {
    return {
      verdict: "pass",
      title: "No Upgrade Needed!",
      description: "Your system meets or exceeds the recommended requirements.",
      failedComponents,
      warnComponents,
      upgradeItems,
    };
  }

  // All min pass but some rec aren't → minimum
  if (allMinPass) {
    return {
      verdict: "minimum",
      title: "Upgrade Recommended",
      description:
        "Your system meets minimum requirements but falls short of recommended specs.",
      failedComponents,
      warnComponents,
      upgradeItems,
    };
  }

  // Otherwise → unknown
  return {
    verdict: "unknown",
    title: "Manual Check Needed",
    description:
      "We couldn't determine a clear verdict. Please review the comparison details below.",
    failedComponents,
    warnComponents,
    upgradeItems,
  };
}
