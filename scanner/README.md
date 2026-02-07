# DoINeedAnUpgrade Hardware Scanner

Cross-platform hardware detection tool written in Go that detects CPU, GPU, RAM, storage, and opens the browser with specs auto-imported.

## Quick Start

```bash
go mod download
make all  # Builds for Windows, macOS, and Linux
```

Outputs go to `../public/downloads/`:
- `DoINeedAnUpgrade.exe` — Windows
- `DoINeedAnUpgrade-Mac-Intel.app` — macOS Intel
- `DoINeedAnUpgrade-Mac-AppleSilicon.app` — macOS Apple Silicon (arm64)
- `DoINeedAnUpgrade-Linux` — Linux (self-extracting script)

## Usage

**Windows/macOS:** Download and double-click the executable.

**Linux:** Download and right-click → "Run as Program" (or `chmod +x` then double-click).

## Build Commands

- `make all` — Build all platforms
- `make windows` — Windows only
- `make mac` — macOS only (or `make mac-intel`/`make mac-arm`)
- `make linux` — Linux only
- `make zip` — Create distribution zips for macOS apps
- `make clean` — Remove build artifacts
