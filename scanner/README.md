# DoINeedAnUpgrade Hardware Scanner

A simple cross-platform hardware detection tool written in Go.

## Building

### Prerequisites
- Go 1.21 or later: https://go.dev/dl/

### Install dependencies
```bash
go mod download
```

### Build for all platforms
```bash
make all
```

This creates executables in `../public/downloads/`:
- `DoINeedAnUpgrade.exe` (Windows)
- `DoINeedAnUpgrade-Mac-Intel.app` (macOS Intel - bundled app)
- `DoINeedAnUpgrade-Mac-AppleSilicon.app` (macOS Apple Silicon - bundled app)
- `DoINeedAnUpgrade-Linux` (Linux)

### Create zip files for distribution
```bash
make zip
```
Creates `.zip` files for the macOS `.app` bundles.

### Build for specific platform
```bash
make windows
make mac
make linux
```

## Usage

### Windows
Download and run `DoINeedAnUpgrade.exe`.

### macOS
1. Download the `.zip` file for your Mac (Intel or Apple Silicon)
2. Extract the zip file
3. Right-click the `.app` file and select "Open"
4. Click "Open" in the security dialog (first time only)
5. Terminal will open and run the scanner

### Linux
```bash
chmod +x DoINeedAnUpgrade-Linux
./DoINeedAnUpgrade-Linux
```

## What it does
1. Detects hardware specs (OS, CPU, GPU, RAM, Storage)
2. Copies a code to clipboard
3. Opens the browser with specs auto-imported
