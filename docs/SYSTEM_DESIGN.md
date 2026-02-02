# System Design

Architecture reference for the System Requirements Checker application.

---

## Overview

A Next.js (App Router) application that lets users check whether their PC hardware meets the system requirements for any Steam game. Built with TypeScript, Tailwind CSS, and DaisyUI.

---

## Component Hierarchy

```
RootLayout (layout.tsx)
  └── Home (page.tsx)                    # Main client component, owns all state
      ├── SystemSpecs                    # User's hardware input form
      │   └── AutocompleteInput (x3)     # OS, CPU, GPU autocomplete fields
      ├── GameSearch                     # Steam game search with dropdown
      ├── RequirementsEditor             # Editable min/rec requirements
      │   └── AutocompleteInput (x4)     # CPU/GPU fields in min/rec columns
      ├── VerdictBanner                  # Overall pass/fail/minimum verdict
      └── ComparisonResult               # Detailed comparison table
```

---

## Data Flow

```
User Input (specs)  ─┐
                     ├── compareSpecs() ──▶ ComparisonItem[] ──┐
Game Requirements ───┘                                         ├── computeVerdict() ──▶ VerdictResult
                                                               │
                                                               └── ComparisonResult (table display)
```

1. **SystemSpecs** captures `UserSpecs` (OS, CPU, GPU, RAM, storage). Auto-detection runs on mount.
2. **GameSearch** calls `/api/search` to find games, then `/api/game` to load requirements.
3. Requirements populate `minReqs` / `recReqs` state in Home.
4. **RequirementsEditor** allows manual editing of requirements.
5. `compareSpecs()` runs reactively (via `useCallback` + `useEffect`) whenever specs or requirements change, producing `ComparisonItem[]`.
6. `computeVerdict()` derives an `OverallVerdict` from the comparison items.
7. **VerdictBanner** displays the verdict. **ComparisonResult** shows the detailed breakdown.

---

## API Routes

### `GET /api/search?q=<term>`
- Proxies to Steam's store search API
- Returns `{ items: GameSearchResult[] }`
- Each result: `{ id, name, tiny_image }`

### `GET /api/game?appid=<id>`
- Fetches game details from Steam's app details API
- Parses HTML requirement strings into structured `GameRequirements`
- Returns `GameDetails { name, headerImage, requirements: { minimum, recommended } }`

### `GET /api/benchmarks`
- Returns CPU and GPU benchmark data
- Used by `useBenchmarks()` hook to populate autocomplete lists and score maps

---

## Key Types

```typescript
interface UserSpecs {
  os: string; cpu: string; cpuCores: number | null;
  gpu: string; ramGB: number | null; storageGB: number | null;
}

interface GameRequirements {
  os: string; cpu: string; gpu: string;
  ram: string; storage: string; directx: string;
}

type ComparisonStatus = "pass" | "warn" | "fail" | "info";

interface ComparisonItem {
  label: string; userValue: string;
  minValue: string; recValue: string;
  minStatus: ComparisonStatus; recStatus: ComparisonStatus;
}

type OverallVerdict = "pass" | "minimum" | "fail" | "unknown";

interface VerdictResult {
  verdict: OverallVerdict; title: string; description: string;
  failedComponents: string[]; warnComponents: string[];
}
```

---

## Verdict Computation Logic

`computeVerdict(items: ComparisonItem[]): VerdictResult`

Priority-ordered rules:

1. **fail** -- Any item has `minStatus === "fail"` → "Cannot Run This Game"
2. **pass** -- All `minStatus` are pass/info AND all `recStatus` are pass/info → "Ready to Play!"
3. **minimum** -- All `minStatus` are pass/info (but some `recStatus` aren't) → "Can Run at Minimum Settings"
4. **unknown** -- Fallback → "Manual Check Needed"

The function also collects `failedComponents` (labels where `minStatus === "fail"`) and `warnComponents` (labels where either status is `"warn"`), which the VerdictBanner can display.

---

## Library Modules

| Module              | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `compareSpecs.ts`   | Compares user specs against min/rec requirements       |
| `computeVerdict.ts` | Derives overall verdict from comparison items          |
| `detectSpecs.ts`    | Auto-detects OS, GPU, CPU cores, RAM via browser APIs  |
| `fuzzyMatch.ts`     | Fuzzy string matching for hardware name comparison     |
| `hardwareData.ts`   | Static lists of OS names, CPU models, GPU models       |
| `parseRequirements.ts` | Parses Steam HTML requirement strings              |
| `useBenchmarks.ts`  | React hook that fetches benchmark data from API        |

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + DaisyUI (custom light theme)
- **State Management**: React useState/useCallback/useEffect (no external state library)
- **API Layer**: Next.js Route Handlers (`app/api/`)
