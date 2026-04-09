import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "do-i-need-to-upgrade.vercel.app";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  const script = generatePowerShellScript(baseUrl);

  return new Response(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function generatePowerShellScript(baseUrl: string): string {
  return `# DoINeedAnUpgrade Hardware Scanner
# Usage: irm ${baseUrl}/api/scan.ps1 | iex

\$ErrorActionPreference = "Continue"
\$errors = @()

Write-Host "Scanning hardware..."
Write-Host ""

# --- Detect all via CIM ---
try {
    \$osInfo = Get-CimInstance Win32_OperatingSystem
    \$cpuInfo = Get-CimInstance Win32_Processor | Select-Object -First 1
    \$gpuInfo = Get-CimInstance Win32_VideoController | Where-Object { \$_.Name -notmatch 'Microsoft Basic Display' -and \$_.Name -notmatch 'Microsoft Remote' } | Select-Object -First 1
    \$ramInfo = Get-CimInstance Win32_ComputerSystem
    \$diskInfo = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3"
} catch {
    Write-Host "Error: Could not query system information. Run as Administrator?"
    exit 1
}

# --- OS ---
\$os = (\$osInfo.Caption -replace '^Microsoft\\s+', '').Trim()
if (-not \$os) {
    \$os = "Unknown"
    \$errors += "Could not detect OS"
}

# --- CPU ---
\$cpu = \$cpuInfo.Name
\$cpu = \$cpu -replace '\\(R\\)', '' -replace '\\(TM\\)', '' -replace '\\(tm\\)', ''
\$cpu = \$cpu -replace '\\s+CPU\\s+@\\s+[\\d.]+\\s*[GgMm][Hh][Zz]', ''
\$cpu = (\$cpu -replace '\\s+', ' ').Trim()
if (-not \$cpu) {
    \$cpu = "Unknown"
    \$errors += "Could not detect CPU"
}

\$cpuCores = [int]\$cpuInfo.NumberOfCores
if (\$cpuCores -eq 0) {
    \$errors += "Could not detect CPU core count"
}

\$cpuSpeedGHz = [math]::Round(\$cpuInfo.MaxClockSpeed / 1000, 1)
if (\$cpuSpeedGHz -eq 0) {
    \$errors += "Could not detect CPU speed"
}

# --- GPU ---
\$gpu = \$gpuInfo.Name
if (-not \$gpu) {
    \$gpu = "Unknown"
    \$errors += "Could not detect GPU"
}

# --- RAM ---
\$ramGB = [math]::Round(\$ramInfo.TotalPhysicalMemory / 1GB)
if (\$ramGB -eq 0) {
    \$errors += "Could not detect RAM"
}

# --- Storage ---
\$storageGB = [math]::Round((\$diskInfo | Measure-Object -Property FreeSpace -Sum).Sum / 1GB)
if (\$storageGB -eq 0) {
    \$errors += "Could not detect free storage"
}

# --- Summary ---
Write-Host "OS:      \$os"
Write-Host "CPU:     \$cpu (\$cpuCores cores @ \${cpuSpeedGHz} GHz)"
Write-Host "GPU:     \$gpu"
Write-Host "RAM:     \${ramGB} GB"
Write-Host "Storage: \${storageGB} GB free"

if (\$errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Warnings:"
    foreach (\$e in \$errors) {
        Write-Host "  - \$e"
    }
}

# --- POST to import API ---
Write-Host ""
Write-Host "Sending specs..."

\$body = @{
    os = \$os
    cpu = \$cpu
    cpuCores = \$cpuCores
    cpuSpeedGHz = \$cpuSpeedGHz
    gpu = \$gpu
    ramGB = \$ramGB
    storageGB = \$storageGB
} | ConvertTo-Json

try {
    \$response = Invoke-RestMethod -Uri "${baseUrl}/api/import" -Method Post -ContentType "application/json" -Body \$body
    \$token = \$response.token
} catch {
    Write-Host "Failed to upload specs. You can use the website manually."
    Write-Host "Error: \$_"
    exit 1
}

if (-not \$token) {
    Write-Host "Failed to get import token."
    exit 1
}

# --- Open browser ---
\$url = "${baseUrl}/?import=\$token"
Write-Host "Opening browser..."
Start-Process \$url

Write-Host ""
Write-Host "Done! Your specs should appear in the browser."
`;
}
