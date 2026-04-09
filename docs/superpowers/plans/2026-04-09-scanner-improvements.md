# Scanner Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add copy-paste shell scripts as a low-friction hardware detection alternative, switch to POST-based spec import with short-lived tokens, and fix Go scanner bugs (dedup, Linux cores, Apple Silicon speeds, error reporting).

**Architecture:** New `/api/import` route stores specs in an in-memory Map with 5-min TTL tokens. New `/api/scan` and `/api/scan.ps1` routes serve shell scripts that detect hardware and POST to `/api/import`. Go scanner gets deduped `cleanCPUName`, physical core detection on Linux, extrapolated Apple Silicon speeds, and error collection via a `DetectionResult` struct.

**Tech Stack:** Next.js API routes (TypeScript), Bash, PowerShell, Go, Swift

---

## File Map

### New files
- `src/app/api/import/route.ts` — POST (store specs, return token) + GET (retrieve by token)
- `src/app/api/import/store.ts` — In-memory token Map with TTL cleanup
- `src/app/api/scan/route.ts` — Serves bash script for macOS/Linux
- `src/app/api/scan.ps1/route.ts` — Serves PowerShell script for Windows

### Modified files
- `src/app/page.tsx` — Handle `?import=<token>` URL param
- `src/components/HardwareScanner.tsx` — Add terminal command section
- `scanner/main.go` — Canonical `cleanCPUName`, `DetectionResult` type, error display
- `scanner/detect_darwin.go` — Remove `cleanCPUName`, return `DetectionResult`, extrapolated speeds
- `scanner/detect_windows.go` — Remove `cleanCPUName`, return `DetectionResult`
- `scanner/detect_linux.go` — Remove `cleanCPUName`, physical core count, return `DetectionResult`
- `scanner/gui_windows.go` — Show errors in message box
- `scanner/gui_linux.go` — Show errors in dialogs/output
- `scanner/gui_darwin.go` — Show errors in terminal fallback
- `scanner/macos-gui/Scanner.swift` — Update Apple Silicon speed table

---

### Task 1: In-Memory Token Store

**Files:**
- Create: `src/app/api/import/store.ts`

- [ ] **Step 1: Create the token store module**

```ts
// src/app/api/import/store.ts
import { crypto } from "crypto";

interface StoredSpecs {
  specs: Record<string, unknown>;
  createdAt: number;
}

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

const store = new Map<string, StoredSpecs>();

function cleanup() {
  const now = Date.now();
  for (const [key, value] of store) {
    if (now - value.createdAt > TOKEN_TTL_MS) {
      store.delete(key);
    }
  }
}

export function storeSpecs(specs: Record<string, unknown>): string {
  cleanup();
  const token = crypto.randomUUID();
  store.set(token, { specs, createdAt: Date.now() });
  return token;
}

export function retrieveSpecs(token: string): Record<string, unknown> | null {
  cleanup();
  const entry = store.get(token);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > TOKEN_TTL_MS) {
    store.delete(token);
    return null;
  }
  store.delete(token); // single-use
  return entry.specs;
}
```

- [ ] **Step 2: Verify the module compiles**

Run: `cd /Users/dai/Documents/Codes/Website/DoINeedAnUpgrade && npx tsc --noEmit src/app/api/import/store.ts 2>&1 | head -20`

Fix any type errors. The `crypto` import should use Node's built-in — if the project targets a module system that doesn't support bare `crypto`, use `globalThis.crypto.randomUUID()` instead.

---

### Task 2: Import API Route

**Files:**
- Create: `src/app/api/import/route.ts`

- [ ] **Step 1: Create the POST and GET handlers**

```ts
// src/app/api/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { storeSpecs, retrieveSpecs } from "./store";

const MAX_BODY_SIZE = 4096;

export async function POST(request: NextRequest) {
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_SIZE) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const body = JSON.parse(text);

    // Validate required fields
    if (typeof body.os !== "string" || !body.os.trim()) {
      return NextResponse.json({ error: "os is required" }, { status: 400 });
    }
    if (typeof body.cpu !== "string" || !body.cpu.trim()) {
      return NextResponse.json({ error: "cpu is required" }, { status: 400 });
    }
    if (body.gpu !== undefined && body.gpu !== null && typeof body.gpu !== "string") {
      return NextResponse.json({ error: "gpu must be a string" }, { status: 400 });
    }

    const specs = {
      os: body.os,
      cpu: body.cpu,
      cpuCores: typeof body.cpuCores === "number" ? body.cpuCores : null,
      cpuSpeedGHz: typeof body.cpuSpeedGHz === "number" ? body.cpuSpeedGHz : null,
      gpu: typeof body.gpu === "string" ? body.gpu : "",
      ramGB: typeof body.ramGB === "number" ? body.ramGB : null,
      storageGB: typeof body.storageGB === "number" ? body.storageGB : null,
    };

    const token = storeSpecs(specs);
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token parameter required" }, { status: 400 });
  }

  const specs = retrieveSpecs(token);
  if (!specs) {
    return NextResponse.json({ error: "Token not found or expired" }, { status: 404 });
  }

  return NextResponse.json(specs);
}
```

- [ ] **Step 2: Test manually with curl**

Run the dev server, then:
```bash
# POST specs
curl -s -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d '{"os":"macOS 15.1","cpu":"Apple M3 Pro","cpuCores":12,"cpuSpeedGHz":4.1,"gpu":"Apple M3 Pro","ramGB":18,"storageGB":200}'

# Should return {"token":"<uuid>"}

# GET with token
curl -s "http://localhost:3000/api/import?token=<uuid-from-above>"

# Should return the specs JSON, then:
curl -s "http://localhost:3000/api/import?token=<uuid-from-above>"
# Should return 404 (single-use)
```

---

### Task 3: Handle `?import=` in page.tsx

**Files:**
- Modify: `src/app/page.tsx:87-162` (the spec-loading useEffect)

- [ ] **Step 1: Add import token handling before the existing `?specs=` check**

In the `useEffect` at line 88 that starts with `// Priority 1: Check URL params for specs`, add a new block **before** the `urlSpecs` check. The new block checks for `?import=<token>`, fetches specs from the API, and feeds them into the same flow.

Insert this block right after `useEffect(() => {` (line 88) and before `const urlSpecs = searchParams.get("specs");` (line 90):

```ts
    // Priority 0: Check URL params for import token (from shell script)
    const importToken = searchParams.get("import");
    if (importToken) {
      // Clean up URL immediately
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("import");
        window.history.replaceState({}, "", url.pathname);
      }

      (async () => {
        try {
          const res = await fetch(`/api/import?token=${encodeURIComponent(importToken)}`);
          if (!res.ok) throw new Error("Token expired or invalid");
          const data = await res.json();

          // Build UserSpecs from the response (same shape as decodeSpecsPayload output)
          const imported: UserSpecs = {
            os: data.os ?? "",
            cpu: data.cpu ?? "",
            cpuCores: typeof data.cpuCores === "number" ? data.cpuCores : null,
            cpuSpeedGHz: typeof data.cpuSpeedGHz === "number" ? data.cpuSpeedGHz : null,
            gpu: typeof data.gpu === "string" ? data.gpu : "",
            ramGB: typeof data.ramGB === "number" ? data.ramGB : null,
            storageGB: typeof data.storageGB === "number" ? data.storageGB : null,
            detectionSource: "script",
            ramApproximate: false,
          };

          setSpecs(imported);
          const now = new Date().toISOString();
          setSavedAt(now);
          localStorage.setItem("savedSpecs", JSON.stringify({ specs: imported, savedAt: now }));
          const detected = detectPlatformFromOS(imported.os || "");
          setPlatform(detected);
          setUserPlatform(detected);
          setUnmatchedFields([]);
          setDetecting(false);
          setShowUrlImportToast(true);

          // Check for pending game (same logic as ?specs= path)
          const pendingGame = getPendingGame();
          if (pendingGame) {
            clearPendingGame();
            try {
              const gameRes = await fetch(`/api/game?appid=${pendingGame.appid}`);
              if (!gameRes.ok) throw new Error("Failed to load game details");
              const gameData: GameDetails = await gameRes.json();
              setGame(gameData);

              const selectedPlatform = gameData.availablePlatforms.includes(detected)
                ? detected
                : gameData.availablePlatforms[0] ?? "windows";
              setPlatform(selectedPlatform);

              const platformReqs = gameData.platformRequirements[selectedPlatform] ?? gameData.requirements;
              const newMin = platformReqs.minimum ?? { os: "", cpu: "", gpu: "", ram: "", storage: "" };
              const newRec = platformReqs.recommended ?? { os: "", cpu: "", gpu: "", ram: "", storage: "" };
              setMinReqs(newMin);
              setRecReqs(newRec);

              const hasMin = Object.values(newMin).some((v) => v.trim() !== "");
              const hasRec = Object.values(newRec).some((v) => v.trim() !== "");
              const { items: compItems, scores } = compareSpecs(imported, hasMin ? newMin : null, hasRec ? newRec : null, cpuScores, gpuScores);
              setComparison(compItems);
              setHardwareScores(scores);
              setSpecsConfirmed(true);
              setSpecsDirty(false);
              setStep(3);
              setMaxReached(3);
              setImportedFromScanner(false);
            } catch {
              setImportedFromScanner(true);
            }
          } else {
            setImportedFromScanner(true);
          }
        } catch {
          // Token expired/invalid — fall through to normal detection
          setDetecting(false);
        }
      })();
      return;
    }
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/dai/Documents/Codes/Website/DoINeedAnUpgrade && npm run build 2>&1 | tail -20`

---

### Task 4: Bash Scan Script API Route

**Files:**
- Create: `src/app/api/scan/route.ts`

- [ ] **Step 1: Create the bash script endpoint**

```ts
// src/app/api/scan/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "do-i-need-to-upgrade.vercel.app";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  const script = `#!/usr/bin/env bash
set -euo pipefail

# DoINeedAnUpgrade Hardware Scanner
# Usage: curl -s ${baseUrl}/api/scan | bash

errors=()
warn() { errors+=("$1"); }

echo "Scanning hardware..."
echo

# --- OS ---
os=""
if [[ "$(uname)" == "Darwin" ]]; then
  pname=$(sw_vers -productName 2>/dev/null || true)
  pver=$(sw_vers -productVersion 2>/dev/null || true)
  os="$pname $pver"
else
  if [[ -f /etc/os-release ]]; then
    os=$(grep '^PRETTY_NAME=' /etc/os-release 2>/dev/null | cut -d'"' -f2)
  fi
  if [[ -z "$os" ]]; then
    os=$(uname -sr 2>/dev/null || echo "Unknown")
    [[ "$os" == "Unknown" ]] && warn "Could not detect OS"
  fi
fi

# --- CPU ---
cpu=""
if [[ "$(uname)" == "Darwin" ]]; then
  cpu=$(sysctl -n machdep.cpu.brand_string 2>/dev/null || true)
else
  cpu=$(grep -m1 'model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | sed 's/^ //' || true)
fi
# Clean CPU name
cpu=$(echo "$cpu" | sed 's/(R)//g; s/(TM)//g; s/(tm)//g; s/ CPU @ [0-9.]*[GgMm][Hh][Zz]//; s/  */ /g; s/^ //; s/ $//')
if [[ -z "$cpu" ]]; then
  cpu="Unknown"
  warn "Could not detect CPU"
fi

# --- CPU Cores (physical) ---
cpu_cores=0
if [[ "$(uname)" == "Darwin" ]]; then
  cpu_cores=$(sysctl -n hw.physicalcpu 2>/dev/null || echo 0)
else
  # Count unique (physical_id, core_id) pairs in /proc/cpuinfo
  if [[ -f /proc/cpuinfo ]]; then
    cpu_cores=$(awk '/^physical id/ {p=$NF} /^core id/ {print p","$NF}' /proc/cpuinfo | sort -u | wc -l | tr -d ' ')
  fi
  if [[ "$cpu_cores" -eq 0 ]]; then
    cpu_cores=$(nproc 2>/dev/null || echo 0)
    [[ "$cpu_cores" -gt 0 ]] && warn "Core count is logical threads, not physical cores"
  fi
fi

# --- CPU Speed (GHz) ---
cpu_speed=0
if [[ "$(uname)" == "Darwin" ]]; then
  arch=$(uname -m)
  if [[ "$arch" == "arm64" ]]; then
    # Apple Silicon - extract generation and use known/extrapolated speeds
    gen=$(echo "$cpu" | grep -oE 'M[0-9]+' | grep -oE '[0-9]+' || true)
    case "$gen" in
      1) cpu_speed=3.2 ;;
      2) cpu_speed=3.5 ;;
      3) cpu_speed=4.1 ;;
      4) cpu_speed=4.4 ;;
      *)
        if [[ -n "$gen" && "$gen" -gt 4 ]]; then
          # Extrapolate: ~0.3 GHz per generation from M3→M4 trend
          cpu_speed=$(echo "4.4 + ($gen - 4) * 0.3" | bc)
          warn "CPU speed for M$gen is estimated"
        else
          cpu_speed=3.0
          warn "Could not determine Apple Silicon generation"
        fi
        ;;
    esac
  else
    freq=$(sysctl -n hw.cpufrequency_max 2>/dev/null || echo 0)
    if [[ "$freq" -gt 0 ]]; then
      cpu_speed=$(echo "scale=1; $freq / 1000000000" | bc)
    else
      warn "Could not detect CPU speed"
    fi
  fi
else
  # Linux: try max freq first
  if [[ -f /sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq ]]; then
    khz=$(cat /sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq 2>/dev/null || echo 0)
    if [[ "$khz" -gt 0 ]]; then
      cpu_speed=$(echo "scale=1; $khz / 1000000" | bc)
    fi
  fi
  if [[ "$cpu_speed" == "0" || -z "$cpu_speed" ]]; then
    mhz=$(grep -m1 'cpu MHz' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | tr -d ' ' || true)
    if [[ -n "$mhz" ]]; then
      cpu_speed=$(echo "scale=1; $mhz / 1000" | bc)
    else
      warn "Could not detect CPU speed"
    fi
  fi
fi

# --- GPU ---
gpu=""
if [[ "$(uname)" == "Darwin" ]]; then
  arch=$(uname -m)
  if [[ "$arch" == "arm64" ]]; then
    gpu=$(echo "$cpu" | grep -oE 'Apple M[0-9]+( Pro| Max| Ultra)?' || echo "Apple Silicon GPU")
  else
    gpu=$(system_profiler SPDisplaysDataType 2>/dev/null | grep 'Chipset Model' | head -1 | cut -d: -f2 | sed 's/^ //' || true)
  fi
else
  if command -v lspci &>/dev/null; then
    line=$(lspci 2>/dev/null | grep -iE 'vga|3d|display' | head -1 || true)
    if [[ -n "$line" ]]; then
      raw=$(echo "$line" | sed 's/^[^:]*: //')
      # Try bracket extraction: "Intel Corporation Foo [Bar Graphics]" -> extract "Bar Graphics"
      bracket=$(echo "$raw" | grep -oE '\\[.+\\]' | tr -d '[]' || true)
      if [[ -n "$bracket" ]]; then
        vendor=""
        lower=$(echo "$raw" | tr '[:upper:]' '[:lower:]')
        if echo "$lower" | grep -q intel; then vendor="Intel"; fi
        if echo "$lower" | grep -q nvidia; then vendor="NVIDIA"; fi
        if echo "$lower" | grep -qE 'amd|advanced micro'; then vendor="AMD"; fi
        bracket_lower=$(echo "$bracket" | tr '[:upper:]' '[:lower:]')
        if [[ -n "$vendor" ]] && ! echo "$bracket_lower" | grep -qi "$vendor"; then
          gpu="$vendor $bracket"
        else
          gpu="$bracket"
        fi
      else
        gpu=$(echo "$raw" | sed 's/Corporation//; s/Advanced Micro Devices, Inc./AMD/; s/Advanced Micro Devices/AMD/; s/ (rev [0-9a-f]*)//; s/  */ /g; s/^ //; s/ $//')
      fi
    fi
  else
    warn "Could not detect GPU (lspci not found)"
  fi
fi
if [[ -z "$gpu" ]]; then
  gpu="Unknown"
  [[ ! " \${errors[*]} " =~ "GPU" ]] && warn "Could not detect GPU"
fi

# --- RAM (GB) ---
ram_gb=0
if [[ "$(uname)" == "Darwin" ]]; then
  mem_bytes=$(sysctl -n hw.memsize 2>/dev/null || echo 0)
  if [[ "$mem_bytes" -gt 0 ]]; then
    ram_gb=$((mem_bytes / 1073741824))
  else
    warn "Could not detect RAM"
  fi
else
  if [[ -f /proc/meminfo ]]; then
    mem_kb=$(grep '^MemTotal:' /proc/meminfo | awk '{print $2}')
    ram_gb=$(( (mem_kb + 524288) / 1048576 ))
  else
    warn "Could not detect RAM"
  fi
fi

# --- Storage (free GB on root) ---
storage_gb=0
if [[ "$(uname)" == "Darwin" ]]; then
  storage_gb=$(df -g / 2>/dev/null | awk 'NR==2 {print $4}' || echo 0)
else
  storage_gb=$(df -BG / 2>/dev/null | awk 'NR==2 {print $4}' | tr -d 'G' || echo 0)
fi
if [[ "$storage_gb" -eq 0 ]]; then
  warn "Could not detect free storage"
fi

# --- Summary ---
echo "OS:      $os"
echo "CPU:     $cpu ($cpu_cores cores @ \${cpu_speed} GHz)"
echo "GPU:     $gpu"
echo "RAM:     \${ram_gb} GB"
echo "Storage: \${storage_gb} GB free"

if [[ \${#errors[@]} -gt 0 ]]; then
  echo
  echo "Warnings:"
  for e in "\${errors[@]}"; do
    echo "  - $e"
  done
fi

# --- POST to import API ---
echo
echo "Sending specs..."

json=$(cat <<INNEREOF
{
  "os": "$os",
  "cpu": "$cpu",
  "cpuCores": $cpu_cores,
  "cpuSpeedGHz": $cpu_speed,
  "gpu": "$gpu",
  "ramGB": $ram_gb,
  "storageGB": $storage_gb
}
INNEREOF
)

response=$(curl -s -X POST "${baseUrl}/api/import" \\
  -H "Content-Type: application/json" \\
  -d "$json")

token=$(echo "$response" | grep -oE '"token":"[^"]+"' | cut -d'"' -f4)

if [[ -z "$token" ]]; then
  echo "Failed to upload specs. You can use the website manually."
  echo "Error: $response"
  exit 1
fi

# --- Open browser ---
url="${baseUrl}/?import=$token"
echo "Opening browser..."

if [[ "$(uname)" == "Darwin" ]]; then
  open "$url"
else
  if command -v xdg-open &>/dev/null; then
    xdg-open "$url" &>/dev/null &
  else
    echo "Could not open browser. Visit this URL manually:"
    echo "$url"
  fi
fi

echo
echo "Done! Your specs should appear in the browser."
`;

  return new Response(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
`;

  return new Response(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
```

- [ ] **Step 2: Test the endpoint**

Run: `curl -s http://localhost:3000/api/scan | head -5`

Expected: Should show the shebang line and first few lines of the bash script with the correct base URL (localhost:3000).

---

### Task 5: PowerShell Scan Script API Route

**Files:**
- Create: `src/app/api/scan.ps1/route.ts`

- [ ] **Step 1: Create the PowerShell script endpoint**

```ts
// src/app/api/scan.ps1/route.ts
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "do-i-need-to-upgrade.vercel.app";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  const script = `# DoINeedAnUpgrade Hardware Scanner
# Usage: irm ${baseUrl}/api/scan.ps1 | iex

$ErrorActionPreference = "Continue"
$errors = @()

Write-Host "Scanning hardware..."
Write-Host ""

# --- Detect all via single CIM call ---
try {
    $osInfo = Get-CimInstance Win32_OperatingSystem
    $cpuInfo = Get-CimInstance Win32_Processor | Select-Object -First 1
    $gpuInfo = Get-CimInstance Win32_VideoController | Where-Object { $_.Name -notmatch 'Microsoft Basic Display' -and $_.Name -notmatch 'Microsoft Remote' } | Select-Object -First 1
    $ramInfo = Get-CimInstance Win32_ComputerSystem
    $diskInfo = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
} catch {
    Write-Host "Error: Could not query system information. Run as Administrator?"
    exit 1
}

# --- OS ---
$os = ($osInfo.Caption -replace '^Microsoft\\s+', '').Trim()
if (-not $os) {
    $os = "Unknown"
    $errors += "Could not detect OS"
}

# --- CPU ---
$cpu = $cpuInfo.Name
$cpu = $cpu -replace '\\(R\\)', '' -replace '\\(TM\\)', '' -replace '\\(tm\\)', ''
$cpu = $cpu -replace '\\s+CPU\\s+@\\s+[\\d.]+\\s*[GgMm][Hh][Zz]', ''
$cpu = ($cpu -replace '\\s+', ' ').Trim()
if (-not $cpu) {
    $cpu = "Unknown"
    $errors += "Could not detect CPU"
}

$cpuCores = [int]$cpuInfo.NumberOfCores
if ($cpuCores -eq 0) {
    $errors += "Could not detect CPU core count"
}

$cpuSpeedGHz = [math]::Round($cpuInfo.MaxClockSpeed / 1000, 1)
if ($cpuSpeedGHz -eq 0) {
    $errors += "Could not detect CPU speed"
}

# --- GPU ---
$gpu = $gpuInfo.Name
if (-not $gpu) {
    $gpu = "Unknown"
    $errors += "Could not detect GPU"
}

# --- RAM ---
$ramGB = [math]::Round($ramInfo.TotalPhysicalMemory / 1GB)
if ($ramGB -eq 0) {
    $errors += "Could not detect RAM"
}

# --- Storage ---
$storageGB = [math]::Round(($diskInfo | Measure-Object -Property FreeSpace -Sum).Sum / 1GB)
if ($storageGB -eq 0) {
    $errors += "Could not detect free storage"
}

# --- Summary ---
Write-Host "OS:      $os"
Write-Host "CPU:     $cpu ($cpuCores cores @ \${cpuSpeedGHz} GHz)"
Write-Host "GPU:     $gpu"
Write-Host "RAM:     \${ramGB} GB"
Write-Host "Storage: \${storageGB} GB free"

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Warnings:"
    foreach ($e in $errors) {
        Write-Host "  - $e"
    }
}

# --- POST to import API ---
Write-Host ""
Write-Host "Sending specs..."

$body = @{
    os = $os
    cpu = $cpu
    cpuCores = $cpuCores
    cpuSpeedGHz = $cpuSpeedGHz
    gpu = $gpu
    ramGB = $ramGB
    storageGB = $storageGB
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "${baseUrl}/api/import" -Method Post -ContentType "application/json" -Body $body
    $token = $response.token
} catch {
    Write-Host "Failed to upload specs. You can use the website manually."
    Write-Host "Error: $_"
    exit 1
}

if (-not $token) {
    Write-Host "Failed to get import token."
    exit 1
}

# --- Open browser ---
$url = "${baseUrl}/?import=$token"
Write-Host "Opening browser..."
Start-Process $url

Write-Host ""
Write-Host "Done! Your specs should appear in the browser."
`;

  return new Response(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
```

- [ ] **Step 2: Test the endpoint**

Run: `curl -s http://localhost:3000/api/scan.ps1 | head -5`

Expected: Should show the comment header and first few lines of the PowerShell script.

---

### Task 6: Update HardwareScanner UI

**Files:**
- Modify: `src/components/HardwareScanner.tsx`

- [ ] **Step 1: Add terminal command data to platformInfo**

Add a `terminalCommand` field to each platform in the `platformInfo` record. The commands use the current page origin so they work in dev and production.

In `HardwareScanner.tsx`, add a new `terminalCommand` field to the `PlatformInfo` type:

```ts
type PlatformInfo = {
  label: string;
  appFiles: { label: string; file: string }[];
  terminalCommand: { label: string; command: string };
  stepGroups: StepGroup[];
};
```

Update each platform entry:

```ts
// windows:
terminalCommand: { label: "PowerShell", command: "irm {BASE}/api/scan.ps1 | iex" },

// macos:
terminalCommand: { label: "Terminal", command: "curl -s {BASE}/api/scan | bash" },

// linux:
terminalCommand: { label: "Terminal", command: "curl -s {BASE}/api/scan | bash" },
```

The `{BASE}` placeholder is replaced at render time with `typeof window !== "undefined" ? window.location.origin : ""`.

- [ ] **Step 2: Add the terminal command section to the UI**

Inside the `collapse-content` div, add a new section **before** the existing download section. This is the primary/recommended option:

```tsx
{/* Terminal command section (primary) */}
<div className="bg-base-200 rounded-lg p-4">
  <p className="text-sm font-medium mb-3">
    Run in {info.terminalCommand.label}:
  </p>
  <div className="flex items-stretch gap-2">
    <div className="flex-1 bg-base-300 rounded-lg px-4 flex items-center overflow-x-auto">
      <code className="font-mono text-xs whitespace-nowrap">
        {info.terminalCommand.command.replace("{BASE}", typeof window !== "undefined" ? window.location.origin : "")}
      </code>
    </div>
    <button
      className="btn btn-sm btn-primary btn-square shrink-0"
      onClick={async () => {
        const cmd = info.terminalCommand.command.replace("{BASE}", window.location.origin);
        await navigator.clipboard.writeText(cmd);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <HiCheckCircle className="w-5 h-5" /> : <HiClipboardCopy className="w-5 h-5" />}
    </button>
  </div>
  <p className="text-xs text-base-content/60 mt-2">
    Detects your hardware and opens this page with specs imported.
  </p>
</div>

{/* Divider between terminal and download */}
<div className="flex items-center gap-2">
  <div className="flex-1 h-px bg-base-300" />
  <span className="text-xs text-base-content/50">or download the app</span>
  <div className="flex-1 h-px bg-base-300" />
</div>
```

- [ ] **Step 3: Verify it renders**

Run the dev server and open the page. Expand the "Need more accurate detection?" section. Should see the terminal command first, then a divider, then the download buttons.

---

### Task 7: Go Scanner — Deduplicate `cleanCPUName` and Add `DetectionResult`

**Files:**
- Modify: `scanner/main.go`
- Modify: `scanner/detect_darwin.go`
- Modify: `scanner/detect_windows.go`
- Modify: `scanner/detect_linux.go`

- [ ] **Step 1: Add shared `cleanCPUName` and `DetectionResult` to `main.go`**

Add these to `main.go` after the `Specs` struct:

```go
type DetectionResult struct {
	Specs  Specs
	Errors []string
}

// cleanCPUName normalises CPU brand strings for matching.
func cleanCPUName(name string) string {
	name = strings.ReplaceAll(name, "(R)", "")
	name = strings.ReplaceAll(name, "(TM)", "")
	name = strings.ReplaceAll(name, "(tm)", "")
	// Remove "CPU @ X.XGHz" pattern (common in Intel strings)
	re := regexp.MustCompile(`\s+CPU\s+@\s+[\d.]+\s*[GgMm][Hh][Zz]`)
	name = re.ReplaceAllString(name, "")
	// Collapse multiple spaces
	re = regexp.MustCompile(`\s+`)
	name = re.ReplaceAllString(name, " ")
	return strings.TrimSpace(name)
}
```

Add `"regexp"` and `"strings"` to the imports in `main.go`. Also add `"fmt"` if not already there.

Update `runTerminal()` to use `DetectionResult`:

```go
func runTerminal() {
	fmt.Println()
	fmt.Println("=== DoINeedAnUpgrade Hardware Scanner ===")
	fmt.Println()

	result := detectSpecs()

	fmt.Printf("OS:      %s\n", result.Specs.OS)
	fmt.Printf("CPU:     %s (%d cores @ %.1f GHz)\n", result.Specs.CPU, result.Specs.CPUCores, result.Specs.CPUSpeedGHz)
	fmt.Printf("GPU:     %s\n", result.Specs.GPU)
	fmt.Printf("RAM:     %d GB\n", result.Specs.RAMGB)
	fmt.Printf("Storage: %d GB free\n", result.Specs.StorageGB)

	if len(result.Errors) > 0 {
		fmt.Println()
		fmt.Println("Warnings:")
		for _, e := range result.Errors {
			fmt.Printf("  - %s\n", e)
		}
	}

	code := encodeSpecs(result.Specs)

	fmt.Println()
	fmt.Println("Your hardware specs:")
	fmt.Println(code)
	fmt.Println()

	copyToClipboard(code)

	url := getURL(result.Specs)
	fmt.Println()
	fmt.Println("Opening browser...")
	openBrowser(url)

	fmt.Println()
	fmt.Println("Done! Your browser should open with your specs imported.")
	fmt.Println("If it doesn't, you can paste the code manually on the website.")
	fmt.Println()

	waitForEnter()
}
```

- [ ] **Step 2: Update `detect_darwin.go`**

Remove the `cleanCPUName` function. Change `detectSpecs() Specs` to `detectSpecs() DetectionResult`. Collect errors:

```go
func detectSpecs() DetectionResult {
	specs := Specs{}
	var errors []string

	// OS
	productName, err := execCmd("sw_vers", "-productName")
	if err != nil {
		errors = append(errors, "Could not detect OS name")
	}
	productVersion, err := execCmd("sw_vers", "-productVersion")
	if err != nil {
		errors = append(errors, "Could not detect OS version")
	}
	specs.OS = strings.TrimSpace(productName) + " " + strings.TrimSpace(productVersion)

	// CPU
	cpuBrand, err := execCmd("sysctl", "-n", "machdep.cpu.brand_string")
	if err != nil {
		errors = append(errors, "Could not detect CPU")
	}
	specs.CPU = cleanCPUName(strings.TrimSpace(cpuBrand))

	// CPU Cores
	coresStr, err := execCmd("sysctl", "-n", "hw.physicalcpu")
	if err != nil {
		errors = append(errors, "Could not detect CPU core count")
	}
	specs.CPUCores, _ = strconv.Atoi(strings.TrimSpace(coresStr))

	// CPU Speed
	arch, _ := execCmd("uname", "-m")
	isAppleSilicon := strings.TrimSpace(arch) == "arm64"
	if isAppleSilicon {
		speed, warning := getAppleSiliconSpeed(specs.CPU)
		specs.CPUSpeedGHz = speed
		if warning != "" {
			errors = append(errors, warning)
		}
	} else {
		freqStr, err := execCmd("sysctl", "-n", "hw.cpufrequency_max")
		if err != nil {
			errors = append(errors, "Could not detect CPU speed")
		} else if freqHz, err := strconv.ParseInt(strings.TrimSpace(freqStr), 10, 64); err == nil && freqHz > 0 {
			specs.CPUSpeedGHz = float64(freqHz) / 1e9
		}
	}

	// GPU
	if isAppleSilicon {
		re := regexp.MustCompile(`Apple M\d+\s*(Pro|Max|Ultra)?`)
		match := re.FindString(specs.CPU)
		if match != "" {
			specs.GPU = strings.TrimSpace(match)
		} else {
			specs.GPU = "Apple Silicon GPU"
			errors = append(errors, "Could not determine Apple Silicon GPU variant")
		}
	} else {
		gpuInfo, err := execCmd("system_profiler", "SPDisplaysDataType")
		if err != nil {
			errors = append(errors, "Could not detect GPU")
		} else {
			for _, line := range strings.Split(gpuInfo, "\n") {
				if strings.Contains(line, "Chipset Model") {
					parts := strings.SplitN(line, ":", 2)
					if len(parts) == 2 {
						specs.GPU = strings.TrimSpace(parts[1])
						break
					}
				}
			}
		}
	}

	// RAM
	memBytes, err := execCmd("sysctl", "-n", "hw.memsize")
	if err != nil {
		errors = append(errors, "Could not detect RAM")
	} else {
		memBytesInt, _ := strconv.ParseInt(strings.TrimSpace(memBytes), 10, 64)
		specs.RAMGB = int(memBytesInt / 1073741824)
	}

	// Storage
	dfOutput, err := execCmd("df", "-g", "/")
	if err != nil {
		errors = append(errors, "Could not detect free storage")
	} else {
		lines := strings.Split(dfOutput, "\n")
		if len(lines) >= 2 {
			fields := strings.Fields(lines[1])
			if len(fields) >= 4 {
				specs.StorageGB, _ = strconv.Atoi(fields[3])
			}
		}
	}

	return DetectionResult{Specs: specs, Errors: errors}
}
```

- [ ] **Step 3: Update `detect_windows.go`**

Remove the `cleanCPUName` function. Change return type to `DetectionResult`:

```go
func detectSpecs() DetectionResult {
	specs := Specs{}
	var errors []string

	// Run all queries in a single PowerShell call
	script := `
$os = (Get-CimInstance Win32_OperatingSystem).Caption -replace '^Microsoft\s+', ''
$cpuInfo = Get-CimInstance Win32_Processor | Select-Object -First 1
$cpu = $cpuInfo.Name
$cores = $cpuInfo.NumberOfCores
$speed = $cpuInfo.MaxClockSpeed
$gpu = (Get-CimInstance Win32_VideoController | Where-Object { $_.Name -notmatch 'Microsoft Basic Display' -and $_.Name -notmatch 'Microsoft Remote' } | Select-Object -First 1).Name
$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
$storage = [math]::Round((Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Measure-Object -Property FreeSpace -Sum).Sum / 1GB)

@{
    os = $os
    cpu = $cpu
    cores = $cores
    speed = $speed
    gpu = $gpu
    ram = $ram
    storage = $storage
} | ConvertTo-Json
`

	out := powershellHidden(script)

	var result struct {
		OS      string `json:"os"`
		CPU     string `json:"cpu"`
		Cores   int    `json:"cores"`
		Speed   int    `json:"speed"`
		GPU     string `json:"gpu"`
		RAM     int    `json:"ram"`
		Storage int    `json:"storage"`
	}

	if err := json.Unmarshal([]byte(out), &result); err != nil {
		errors = append(errors, "Failed to query system information via PowerShell")
		return DetectionResult{Specs: specs, Errors: errors}
	}

	specs.OS = strings.TrimSpace(result.OS)
	if specs.OS == "" {
		errors = append(errors, "Could not detect OS")
	}

	specs.CPU = cleanCPUName(strings.TrimSpace(result.CPU))
	if specs.CPU == "" {
		errors = append(errors, "Could not detect CPU")
	}

	specs.CPUCores = result.Cores
	if specs.CPUCores == 0 {
		errors = append(errors, "Could not detect CPU core count")
	}

	specs.CPUSpeedGHz = float64(result.Speed) / 1000.0
	if specs.CPUSpeedGHz == 0 {
		errors = append(errors, "Could not detect CPU speed")
	}

	specs.GPU = strings.TrimSpace(result.GPU)
	if specs.GPU == "" {
		errors = append(errors, "Could not detect GPU")
	}

	specs.RAMGB = result.RAM
	if specs.RAMGB == 0 {
		errors = append(errors, "Could not detect RAM")
	}

	specs.StorageGB = result.Storage
	if specs.StorageGB == 0 {
		errors = append(errors, "Could not detect free storage")
	}

	return DetectionResult{Specs: specs, Errors: errors}
}
```

- [ ] **Step 4: Update `detect_linux.go`**

Remove the `cleanCPUName` function. Change return type to `DetectionResult`. Replace `nproc` with physical core counting:

```go
func detectSpecs() DetectionResult {
	specs := Specs{}
	var errors []string

	// OS
	if data, err := os.ReadFile("/etc/os-release"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			if strings.HasPrefix(line, "PRETTY_NAME=") {
				specs.OS = strings.Trim(strings.TrimPrefix(line, "PRETTY_NAME="), `"`)
				break
			}
		}
	}
	if specs.OS == "" {
		out, err := exec.Command("uname", "-sr").Output()
		if err != nil {
			errors = append(errors, "Could not detect OS")
		} else {
			specs.OS = strings.TrimSpace(string(out))
		}
	}

	// CPU
	if data, err := os.ReadFile("/proc/cpuinfo"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			if strings.HasPrefix(line, "model name") {
				parts := strings.SplitN(line, ":", 2)
				if len(parts) == 2 {
					specs.CPU = cleanCPUName(strings.TrimSpace(parts[1]))
					break
				}
			}
		}
	}
	if specs.CPU == "" {
		errors = append(errors, "Could not detect CPU")
	}

	// CPU Cores (physical) — count unique (physical_id, core_id) pairs
	specs.CPUCores = countPhysicalCores()
	if specs.CPUCores == 0 {
		// Fallback to nproc (gives logical threads)
		out, _ := exec.Command("nproc").Output()
		specs.CPUCores, _ = strconv.Atoi(strings.TrimSpace(string(out)))
		if specs.CPUCores > 0 {
			errors = append(errors, "Core count is logical threads, not physical cores (nproc fallback)")
		} else {
			errors = append(errors, "Could not detect CPU core count")
		}
	}

	// CPU Speed
	if data, err := os.ReadFile("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq"); err == nil {
		if kHz, err := strconv.ParseInt(strings.TrimSpace(string(data)), 10, 64); err == nil && kHz > 0 {
			specs.CPUSpeedGHz = float64(kHz) / 1e6
		}
	}
	if specs.CPUSpeedGHz == 0 {
		if data, err := os.ReadFile("/proc/cpuinfo"); err == nil {
			for _, line := range strings.Split(string(data), "\n") {
				if strings.HasPrefix(line, "cpu MHz") {
					parts := strings.SplitN(line, ":", 2)
					if len(parts) == 2 {
						if mhz, err := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64); err == nil {
							specs.CPUSpeedGHz = mhz / 1000.0
							break
						}
					}
				}
			}
		}
	}
	if specs.CPUSpeedGHz == 0 {
		errors = append(errors, "Could not detect CPU speed")
	}

	// GPU
	lspciOut, err := exec.Command("lspci").Output()
	if err != nil {
		errors = append(errors, "Could not detect GPU (lspci not found)")
	} else {
		for _, line := range strings.Split(string(lspciOut), "\n") {
			lower := strings.ToLower(line)
			if strings.Contains(lower, "vga") || strings.Contains(lower, "3d") || strings.Contains(lower, "display") {
				parts := strings.SplitN(line, ": ", 2)
				if len(parts) == 2 {
					specs.GPU = cleanGPUName(strings.TrimSpace(parts[1]))
					break
				}
			}
		}
		if specs.GPU == "" {
			errors = append(errors, "Could not detect GPU from lspci output")
		}
	}

	// RAM
	if data, err := os.ReadFile("/proc/meminfo"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			if strings.HasPrefix(line, "MemTotal:") {
				fields := strings.Fields(line)
				if len(fields) >= 2 {
					kb, _ := strconv.ParseInt(fields[1], 10, 64)
					specs.RAMGB = int((kb + 524288) / 1048576)
				}
				break
			}
		}
	}
	if specs.RAMGB == 0 {
		errors = append(errors, "Could not detect RAM")
	}

	// Storage
	dfOut, _ := exec.Command("df", "-BG", "/").Output()
	lines := strings.Split(string(dfOut), "\n")
	if len(lines) >= 2 {
		fields := strings.Fields(lines[1])
		if len(fields) >= 4 {
			freeStr := strings.TrimSuffix(fields[3], "G")
			specs.StorageGB, _ = strconv.Atoi(freeStr)
		}
	}
	if specs.StorageGB == 0 {
		errors = append(errors, "Could not detect free storage")
	}

	return DetectionResult{Specs: specs, Errors: errors}
}

// countPhysicalCores counts unique (physical_id, core_id) pairs from /proc/cpuinfo.
func countPhysicalCores() int {
	data, err := os.ReadFile("/proc/cpuinfo")
	if err != nil {
		return 0
	}

	type coreKey struct {
		physicalID string
		coreID     string
	}
	seen := make(map[coreKey]bool)
	var currentPhysicalID, currentCoreID string

	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "physical id") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				currentPhysicalID = strings.TrimSpace(parts[1])
			}
		} else if strings.HasPrefix(line, "core id") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				currentCoreID = strings.TrimSpace(parts[1])
				seen[coreKey{currentPhysicalID, currentCoreID}] = true
			}
		}
	}

	return len(seen)
}
```

- [ ] **Step 5: Verify Go builds**

Run: `cd /Users/dai/Documents/Codes/Website/DoINeedAnUpgrade/scanner && go build -o /dev/null .`

Fix any compilation errors. Note: This will only work on macOS since darwin build tags are active. For cross-compilation checks:
```bash
GOOS=linux GOARCH=amd64 go build -o /dev/null .
GOOS=windows GOARCH=amd64 go build -o /dev/null .
```

---

### Task 8: Go Scanner — Future-Proof Apple Silicon Speeds

**Files:**
- Modify: `scanner/detect_darwin.go`

- [ ] **Step 1: Replace the speed function with extrapolation**

Replace the `getAppleSiliconSpeed` function:

```go
// getAppleSiliconSpeed returns known max performance core speeds for Apple Silicon chips.
// For unknown future generations, it extrapolates from the M3→M4 trend (~0.3 GHz/gen).
func getAppleSiliconSpeed(cpuName string) (float64, string) {
	knownSpeeds := map[int]float64{
		1: 3.2,
		2: 3.5,
		3: 4.1,
		4: 4.4,
	}

	// Extract generation number from "Apple M4 Pro" etc.
	re := regexp.MustCompile(`M(\d+)`)
	match := re.FindStringSubmatch(cpuName)
	if len(match) < 2 {
		return 3.0, "Could not determine Apple Silicon generation, using 3.0 GHz fallback"
	}

	gen, err := strconv.Atoi(match[1])
	if err != nil || gen < 1 {
		return 3.0, "Could not parse Apple Silicon generation number"
	}

	if speed, ok := knownSpeeds[gen]; ok {
		return speed, ""
	}

	// Extrapolate for unknown future generations
	// Use M3→M4 increment (0.3 GHz) as the trend
	extrapolated := 4.4 + float64(gen-4)*0.3
	return extrapolated, fmt.Sprintf("CPU speed for M%d is estimated (%.1f GHz)", gen, extrapolated)
}
```

Add `"fmt"` to the imports if not already there.

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/dai/Documents/Codes/Website/DoINeedAnUpgrade/scanner && go build -o /dev/null .`

---

### Task 9: Go Scanner — Update GUI Files for Error Display

**Files:**
- Modify: `scanner/gui_windows.go`
- Modify: `scanner/gui_linux.go`
- Modify: `scanner/gui_darwin.go`

- [ ] **Step 1: Update `gui_windows.go`**

```go
func runGUI() {
	result := detectSpecs()

	code := encodeSpecs(result.Specs)
	copyToClipboard(code)

	url := getURL(result.Specs)
	openBrowser(url)

	msg := "Hardware scan complete!\n\nYour specs have been copied to clipboard and the browser is opening."
	if len(result.Errors) > 0 {
		msg += "\n\nWarnings:"
		for _, e := range result.Errors {
			msg += "\n- " + e
		}
	}
	showMessage("DoINeedAnUpgrade", msg)
}
```

- [ ] **Step 2: Update `gui_linux.go`**

Update every function that calls `detectSpecs()` to use `DetectionResult`. The pattern is the same for each: replace `specs := detectSpecs()` with `result := detectSpecs()` and use `result.Specs` where `specs` was used.

```go
func runGUI() {
	if !hasDisplay() {
		result := detectSpecs()
		code := encodeSpecs(result.Specs)
		fmt.Println(code)
		if len(result.Errors) > 0 {
			fmt.Println("\nWarnings:")
			for _, e := range result.Errors {
				fmt.Printf("  - %s\n", e)
			}
		}
		return
	}

	switch {
	case hasCommand("zenity"):
		runWithZenity()
	case hasCommand("kdialog"):
		runWithKdialog()
	case hasCommand("notify-send"):
		runWithNotifySend()
	default:
		runSilent()
	}
}

func runWithZenity() {
	progress := exec.Command("zenity", "--progress", "--pulsate", "--no-cancel",
		"--title=DoINeedAnUpgrade", "--text=Scanning your hardware...", "--auto-close")
	progress.Start()

	result := detectSpecs()
	code := encodeSpecs(result.Specs)
	copyToClipboard(code)

	url := getURL(result.Specs)
	openBrowser(url)

	if progress.Process != nil {
		progress.Process.Kill()
	}

	msg := "Hardware scan complete!\n\nYour specs have been copied to clipboard and the browser is opening."
	if len(result.Errors) > 0 {
		msg += "\n\nWarnings:"
		for _, e := range result.Errors {
			msg += "\n- " + e
		}
	}
	exec.Command("zenity", "--info",
		"--title=DoINeedAnUpgrade",
		"--text="+msg,
		"--timeout=5").Run()
}

func runWithKdialog() {
	exec.Command("kdialog", "--passivepopup", "Scanning your hardware...", "3").Start()

	result := detectSpecs()
	code := encodeSpecs(result.Specs)
	copyToClipboard(code)

	url := getURL(result.Specs)
	openBrowser(url)

	msg := "Hardware scan complete!\n\nYour specs have been copied to clipboard and the browser is opening."
	if len(result.Errors) > 0 {
		msg += "\n\nWarnings:"
		for _, e := range result.Errors {
			msg += "\n- " + e
		}
	}
	exec.Command("kdialog", "--msgbox", msg).Run()
}

func runWithNotifySend() {
	exec.Command("notify-send", "DoINeedAnUpgrade", "Scanning your hardware...").Run()

	result := detectSpecs()
	code := encodeSpecs(result.Specs)
	copyToClipboard(code)

	url := getURL(result.Specs)
	openBrowser(url)

	msg := "Hardware scan complete! Your browser is opening."
	if len(result.Errors) > 0 {
		msg += " (with warnings)"
	}
	exec.Command("notify-send", "DoINeedAnUpgrade", msg).Run()
}

func runSilent() {
	result := detectSpecs()
	code := encodeSpecs(result.Specs)
	copyToClipboard(code)

	url := getURL(result.Specs)
	openBrowser(url)
}
```

- [ ] **Step 3: Update `gui_darwin.go`**

No changes needed — it just calls `runTerminal()` which is already updated in Task 7.

- [ ] **Step 4: Verify all platforms compile**

```bash
cd /Users/dai/Documents/Codes/Website/DoINeedAnUpgrade/scanner
go build -o /dev/null .
GOOS=linux GOARCH=amd64 go build -o /dev/null .
GOOS=windows GOARCH=amd64 go build -o /dev/null .
```

---

### Task 10: Update Swift macOS GUI — Apple Silicon Speeds

**Files:**
- Modify: `scanner/macos-gui/Scanner.swift`

- [ ] **Step 1: Add `cpuSpeedGHz` to the Swift `Specs` struct**

The Swift `Specs` struct currently lacks `cpuSpeedGHz`. Add it:

```swift
struct Specs: Codable {
    let os: String
    let cpu: String
    let cpuCores: Int
    let cpuSpeedGHz: Double
    let gpu: String
    let ramGB: Int
    let storageGB: Int
}
```

- [ ] **Step 2: Add Apple Silicon speed detection to `detectSpecs()`**

Add speed detection after the CPU cores section and before the GPU section in `Scanner.detectSpecs()`:

```swift
        // CPU Speed
        let arch = execCmd("/usr/bin/uname", ["-m"]).trimmingCharacters(in: .whitespacesAndNewlines)
        var cpuSpeedGHz: Double = 0.0
        if arch == "arm64" {
            cpuSpeedGHz = getAppleSiliconSpeed(cpu)
        } else {
            let freqStr = execCmd("/usr/sbin/sysctl", ["-n", "hw.cpufrequency_max"]).trimmingCharacters(in: .whitespacesAndNewlines)
            if let freqHz = Int64(freqStr), freqHz > 0 {
                cpuSpeedGHz = Double(freqHz) / 1_000_000_000.0
            }
        }
```

Update the return statement to include `cpuSpeedGHz`:

```swift
        return Specs(os: os, cpu: cpu, cpuCores: cpuCores, cpuSpeedGHz: cpuSpeedGHz, gpu: gpu, ramGB: ramGB, storageGB: storageGB)
```

- [ ] **Step 3: Add the `getAppleSiliconSpeed` helper**

Add as a private static method in the `Scanner` class:

```swift
    private static func getAppleSiliconSpeed(_ cpuName: String) -> Double {
        let knownSpeeds: [Int: Double] = [
            1: 3.2, 2: 3.5, 3: 4.1, 4: 4.4
        ]

        // Extract generation number from "Apple M4 Pro" etc.
        guard let match = cpuName.range(of: #"M(\d+)"#, options: .regularExpression),
              let genStr = cpuName[match].dropFirst().first.flatMap({ Int(String($0)) }) else {
            return 3.0
        }

        // Try multi-digit parse
        let numStr = String(cpuName[match].dropFirst())
        let gen = Int(numStr) ?? genStr

        if let speed = knownSpeeds[gen] {
            return speed
        }

        // Extrapolate for future generations
        return 4.4 + Double(gen - 4) * 0.3
    }
```

- [ ] **Step 4: Verify Swift compiles**

Run: `cd /Users/dai/Documents/Codes/Website/DoINeedAnUpgrade/scanner && swiftc -parse macos-gui/main.swift macos-gui/Scanner.swift`

---

### Task 11: Final Integration Verification

- [ ] **Step 1: Build the Next.js app**

Run: `cd /Users/dai/Documents/Codes/Website/DoINeedAnUpgrade && npm run build`

Verify no TypeScript errors.

- [ ] **Step 2: Build the Go scanner for all platforms**

```bash
cd /Users/dai/Documents/Codes/Website/DoINeedAnUpgrade/scanner
go build -o /dev/null .
GOOS=linux GOARCH=amd64 go build -o /dev/null .
GOOS=windows GOARCH=amd64 go build -o /dev/null .
```

- [ ] **Step 3: Manual end-to-end test**

Start dev server (`npm run dev`), then:

1. Test bash script: `curl -s http://localhost:3000/api/scan | bash`
   — Should detect hardware, POST to import, and open browser with specs loaded

2. Test import API directly:
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:3000/api/import -H "Content-Type: application/json" -d '{"os":"Test OS","cpu":"Test CPU","gpu":"Test GPU","ramGB":16,"storageGB":100,"cpuCores":8,"cpuSpeedGHz":3.5}' | grep -oE '"token":"[^"]+"' | cut -d'"' -f4)
   curl -s "http://localhost:3000/api/import?token=$TOKEN"
   ```
   — Should return specs on first call, 404 on second

3. Open `http://localhost:3000/?import=<token>` in browser
   — Should show imported specs toast and enter scanner mode

4. Verify HardwareScanner UI shows terminal command section with copy button
