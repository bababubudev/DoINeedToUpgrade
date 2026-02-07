# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DoINeedAnUpgrade is a web application that compares user hardware specs against video game system requirements. It fetches game requirements from Steam and uses fuzzy matching with performance scores to determine compatibility.

## Commands

### Web Application (Next.js)
```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
```

### Hardware Scanner (Go)
The scanner is a separate Go application in `/scanner/` that detects hardware and opens the browser with specs auto-imported.

```bash
cd scanner
go mod download
make all         # Build for Windows, macOS (Intel + ARM), and Linux
make windows     # Windows only
make mac         # macOS only (both architectures)
make linux       # Linux only
make clean       # Remove build artifacts
```

Outputs go to `/public/downloads/`.

## Architecture

### Data Flow
1. **Hardware Detection**: Three sources with priority order:
   - URL params (`?specs=...`) - base64 from hardware scanner
   - localStorage (`savedSpecs`) - previously saved specs
   - Browser detection (`detectClientSpecs`) - WebGL GPU, navigator APIs

2. **Game Requirements**: Fetched from Steam API via `/api/game?appid=` route, parsed by `parseRequirements.ts`

3. **Comparison**: `compareSpecs.ts` uses fuzzy matching + performance scores from `hardwareData.ts`

### Key Modules

**`src/lib/hardwareData.ts`** - Static lists of known CPUs, GPUs, and OS versions with relative performance scores (10-100 scale). The fuzzy matcher uses these as candidates.

**`src/lib/fuzzyMatch.ts`** - Token-based fuzzy matching for hardware names. Strips spec patterns (clock speed, core count) before matching. Requires 60% token overlap. Special handling for "series" requirements (e.g., "GTX 600 series" matches 650, 660).

**`src/lib/compareSpecs.ts`** - Compares user specs against requirements:
- OS: Platform check first (cross-platform = warn), then version ordering
- CPU/GPU: Fuzzy match to known hardware, compare performance scores
- RAM/Storage: Direct numeric comparison

**`scanner/`** - Cross-platform Go scanner with platform-specific detection:
- `detect_darwin.go` - macOS (sysctl commands)
- `detect_windows.go` - Windows (PowerShell + WMI)
- `detect_linux.go` - Linux (/proc/cpuinfo, lspci)
- macOS uses Swift GUI (`macos-gui/`), Windows/Linux use Go GUI

### Wizard Flow
Two modes based on entry point:
- **Normal mode** (direct visit): Game Select → System Specs → Results
- **Scanner mode** (URL with `?specs=`): System Specs → Game Select → Results

The `importedFromScanner` flag in `page.tsx` controls which flow is active.

## API Routes

- `/api/search?q=` - Search Steam games
- `/api/game?appid=` - Get game details and requirements
- `/api/detect` - Server-side hardware detection (systeminformation package)
- `/api/benchmarks` - Returns hardware lists and scores from `hardwareData.ts`

## Tech Stack
- Next.js 16 with App Router
- React 18, TypeScript
- Tailwind CSS + DaisyUI
- Go (hardware scanner)
- Swift (macOS scanner GUI)
