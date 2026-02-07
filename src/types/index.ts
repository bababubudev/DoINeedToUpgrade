export type DetectionSource = "auto" | "script";

export interface UserSpecs {
  os: string;
  cpu: string;
  cpuCores: number | null;
  cpuSpeedGHz: number | null;
  gpu: string;
  ramGB: number | null;
  storageGB: number | null;
  detectionSource?: DetectionSource;
  ramApproximate?: boolean;
  guessedFields?: string[];
  manualFields?: string[];
}

export interface GameRequirements {
  os: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
}

export interface ParsedGameRequirements {
  minimum: GameRequirements | null;
  recommended: GameRequirements | null;
}

export type Platform = "windows" | "macos" | "linux";

export type PlatformRequirements = Partial<Record<Platform, ParsedGameRequirements>>;

export interface GameSearchResult {
  id: number;
  name: string;
  tiny_image: string;
}

export interface GameDetails {
  appid: number;
  name: string;
  headerImage: string;
  requirements: ParsedGameRequirements;
  platformRequirements: PlatformRequirements;
  availablePlatforms: Platform[];
}

export type ComparisonStatus = "pass" | "warn" | "fail" | "info";

export type OverallVerdict = "pass" | "minimum" | "fail" | "unknown";
export interface UpgradeItem {
  component: string;
  current: string;
  required: string;
}

export interface VerdictResult {
  verdict: OverallVerdict;
  title: string;
  description: string;
  failedComponents: string[];
  warnComponents: string[];
  upgradeItems: UpgradeItem[];
}

export interface ComparisonItem {
  label: string;
  userValue: string;
  minValue: string;
  recValue: string;
  minStatus: ComparisonStatus;
  recStatus: ComparisonStatus;
}
