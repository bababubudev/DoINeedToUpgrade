# Scanner Improvements Design Spec

## Overview

Improve the hardware scanner by adding copy-paste shell scripts as a low-friction alternative to the downloadable app, switching to POST-based spec import with short-lived tokens, fixing detection bugs, and cleaning up the Go codebase.

## 1. Copy-Paste Shell Scripts (API Routes)

### `GET /api/scan` (Bash — macOS/Linux)

Returns `text/plain` bash script. Detection logic mirrors the Go scanner:

**macOS detection:**
- OS: `sw_vers -productName` + `sw_vers -productVersion`
- CPU: `sysctl -n machdep.cpu.brand_string` (cleaned of `(R)`, `(TM)`)
- CPU cores: `sysctl -n hw.physicalcpu`
- CPU speed: Hardcoded Apple Silicon table (M1=3.2, M2=3.5, M3=4.1, M4=4.4, extrapolate for M5+), Intel via `sysctl -n hw.cpufrequency_max`
- GPU: Apple Silicon extracts chip name from CPU string; Intel uses `system_profiler SPDisplaysDataType`
- RAM: `sysctl -n hw.memsize` (bytes → GB)
- Storage: `df -g /` (free space column)

**Linux detection:**
- OS: `PRETTY_NAME` from `/etc/os-release`, fallback `uname -sr`
- CPU: `model name` from `/proc/cpuinfo` (cleaned)
- CPU cores: Count unique `core id` per `physical id` in `/proc/cpuinfo`
- CPU speed: `/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq` (kHz → GHz), fallback `/proc/cpuinfo` `cpu MHz`
- GPU: Parse `lspci` for VGA/3D/display entries, clean vendor names
- RAM: `MemTotal` from `/proc/meminfo` (KB → GB, rounded)
- Storage: `df -BG /` (free space column)

**Script flow:**
1. Detect all specs
2. Build JSON object
3. POST to `BASE_URL/api/import`
4. Extract token from response
5. Open `BASE_URL/?import=TOKEN` via `open` (macOS) or `xdg-open` (Linux)
6. Print summary + errors to terminal

The `BASE_URL` is embedded in the script response dynamically using the request's host header.

### `GET /api/scan.ps1` (PowerShell — Windows)

Returns `text/plain` PowerShell script. Same WMI queries as Go scanner:

- OS: `(Get-CimInstance Win32_OperatingSystem).Caption` (strip `Microsoft `)
- CPU: `Win32_Processor.Name` (cleaned), `.NumberOfCores`, `.MaxClockSpeed` (MHz → GHz)
- GPU: `Win32_VideoController` (first non-basic), `.Name`
- RAM: `Win32_ComputerSystem.TotalPhysicalMemory` (→ GB, rounded)
- Storage: `Win32_LogicalDisk` where `DriveType=3`, sum `FreeSpace` (→ GB)

**Script flow:** Same as bash — detect, POST, extract token, open browser via `Start-Process`.

### Error handling in scripts

Each detection step is wrapped in a try/catch (PowerShell) or conditional check (bash). Failed detections produce `"Unknown"` or `0`/`null` values. Errors are collected in an array and printed at the end. The script still POSTs and opens the browser even with partial detection — the web app handles missing fields gracefully.

## 2. POST-Based Spec Import

### `POST /api/import` (new route)

**Request body (JSON):**
```json
{
  "os": "Windows 11 Home",
  "cpu": "Intel Core i7-13700K",
  "cpuCores": 16,
  "cpuSpeedGHz": 5.4,
  "gpu": "NVIDIA GeForce RTX 4070",
  "ramGB": 32,
  "storageGB": 450
}
```

**Validation:**
- `os` and `cpu` must be non-empty strings
- `gpu` must be a string (can be empty)
- `cpuCores`, `cpuSpeedGHz`, `ramGB`, `storageGB` must be numbers if present (nullable)
- Reject payloads > 4KB

**Token storage:** Module-level `Map<string, { specs: object, createdAt: number }>`. On each POST, delete entries older than 5 minutes before inserting.

**Response:** `{ "token": "<uuid>" }` using `crypto.randomUUID()`.

### `GET /api/import?token=TOKEN` (same route file)

- Look up token in the Map
- If found and not expired: return specs JSON, delete the token (single-use)
- If missing or expired: return `404 { error: "Token not found or expired" }`

### Web app changes (`page.tsx`)

Add handling for `?import=` search param alongside existing `?specs=`:

```
const importToken = searchParams.get("import");
if (importToken) {
  // Fetch specs from /api/import?token=...
  // On success: feed into same flow as ?specs= (setSpecs, localStorage, toast, etc.)
  // On failure: show error toast, continue to normal flow
  // Clean up URL param
}
```

This goes in the existing `useEffect` at priority 1, checked before `?specs=`. The `?specs=` flow remains for the downloadable scanner.

## 3. HardwareScanner UI Changes

Add a new tab/section in the `HardwareScanner.tsx` collapsible for "Quick Terminal Command" alongside the existing download section. Platform-detected:

- **Windows:** Show `irm .../api/scan.ps1 | iex` with copy button
- **macOS/Linux:** Show `curl -s .../api/scan | bash` with copy button

Structure: Two options presented as tabs or a divider — "Run in Terminal" (new, primary) and "Download App" (existing, secondary). The terminal option is simpler and more prominent since it's lower friction.

## 4. Go Scanner Fixes

### Deduplicate `cleanCPUName`

Move the single canonical `cleanCPUName` function to `main.go`. Remove copies from `detect_darwin.go`, `detect_windows.go`, `detect_linux.go`. The Windows version has extra logic to strip `CPU @ X.X GHz` — merge that into the shared version. Linux `cleanGPUName` stays in `detect_linux.go`.

### Fix Linux physical core count

Replace:
```go
out, _ := exec.Command("nproc").Output()
specs.CPUCores, _ = strconv.Atoi(strings.TrimSpace(string(out)))
```

With: Parse `/proc/cpuinfo` for unique `core id` values per `physical id`:
```go
// Count unique (physical_id, core_id) pairs
// This gives physical cores, not logical threads
```

Fallback to `nproc` if `/proc/cpuinfo` parsing fails.

### Future-proof Apple Silicon speeds

Replace the hardcoded switch/case with generation-based extrapolation:

```go
func getAppleSiliconSpeed(cpuName string) float64 {
    // Known speeds
    knownSpeeds := map[int]float64{
        1: 3.2, 2: 3.5, 3: 4.1, 4: 4.4,
    }
    // Extract generation number from "M1", "M2", etc.
    // If known, return exact speed
    // If unknown (M5+), extrapolate from last two known values
    // Average increment: ~0.3-0.4 GHz per generation
}
```

### Error collection and reporting

Add an `errors []string` slice that detection functions populate:

```go
type DetectionResult struct {
    Specs  Specs
    Errors []string
}
```

Each detection step appends to errors on failure instead of silently discarding. The GUI/terminal output shows warnings like:
- "Could not detect GPU (lspci not found)"
- "CPU speed detection failed, using fallback"

The errors are informational — detection proceeds with best-effort values.

Update `detectSpecs()` signature across all platforms to return `DetectionResult`.

## 5. Files Changed

### New files
- `src/app/api/scan/route.ts` — Bash script endpoint
- `src/app/api/scan.ps1/route.ts` — PowerShell script endpoint (Next.js handles the `.ps1` in the path)
- `src/app/api/import/route.ts` — POST (store specs) + GET (retrieve by token)

### Modified files
- `src/app/page.tsx` — Add `?import=` token handling
- `src/components/HardwareScanner.tsx` — Add terminal command option
- `scanner/main.go` — Move `cleanCPUName` here, add `DetectionResult` type, update `runTerminal`/`runGUI` to show errors
- `scanner/detect_darwin.go` — Remove `cleanCPUName`, update to return `DetectionResult`, update Apple Silicon speed table
- `scanner/detect_windows.go` — Remove `cleanCPUName`, update to return `DetectionResult`
- `scanner/detect_linux.go` — Remove `cleanCPUName`, fix physical core count, update to return `DetectionResult`
- `scanner/gui_windows.go` — Show errors in message box
- `scanner/gui_linux.go` — Show errors in dialog
- `scanner/macos-gui/Scanner.swift` — Update Apple Silicon speed table to match Go changes
