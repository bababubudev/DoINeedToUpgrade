import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "do-i-need-to-upgrade.vercel.app";
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;

  const script = generateBashScript(baseUrl);

  return new Response(script, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function generateBashScript(baseUrl: string): string {
  return `#!/usr/bin/env bash
set -euo pipefail

# DoINeedAnUpgrade Hardware Scanner
# Usage: curl -s ${baseUrl}/api/scan | bash

errors=()
warn() { errors+=("\$1"); }

echo "Scanning hardware..."
echo

# --- OS ---
os=""
if [[ "\$(uname)" == "Darwin" ]]; then
  pname=\$(sw_vers -productName 2>/dev/null || true)
  pver=\$(sw_vers -productVersion 2>/dev/null || true)
  os="\$pname \$pver"
else
  if [[ -f /etc/os-release ]]; then
    os=\$(grep '^PRETTY_NAME=' /etc/os-release 2>/dev/null | cut -d'"' -f2)
  fi
  if [[ -z "\$os" ]]; then
    os=\$(uname -sr 2>/dev/null || echo "Unknown")
    [[ "\$os" == "Unknown" ]] && warn "Could not detect OS"
  fi
fi

# --- CPU ---
cpu=""
if [[ "\$(uname)" == "Darwin" ]]; then
  cpu=\$(sysctl -n machdep.cpu.brand_string 2>/dev/null || true)
else
  cpu=\$(grep -m1 'model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | sed 's/^ //' || true)
fi
cpu=\$(echo "\$cpu" | sed 's/(R)//g; s/(TM)//g; s/(tm)//g; s/ CPU @ [0-9.]*[GgMm][Hh][Zz]//; s/  */ /g; s/^ //; s/ \$//')
if [[ -z "\$cpu" ]]; then
  cpu="Unknown"
  warn "Could not detect CPU"
fi

# --- CPU Cores (physical) ---
cpu_cores=0
if [[ "\$(uname)" == "Darwin" ]]; then
  cpu_cores=\$(sysctl -n hw.physicalcpu 2>/dev/null || echo 0)
else
  if [[ -f /proc/cpuinfo ]]; then
    cpu_cores=\$(awk '/^physical id/ {p=\$NF} /^core id/ {print p","\$NF}' /proc/cpuinfo | sort -u | wc -l | tr -d ' ')
  fi
  if [[ "\$cpu_cores" -eq 0 ]]; then
    cpu_cores=\$(nproc 2>/dev/null || echo 0)
    [[ "\$cpu_cores" -gt 0 ]] && warn "Core count is logical threads, not physical cores"
  fi
fi

# --- CPU Speed (GHz) ---
cpu_speed=0
if [[ "\$(uname)" == "Darwin" ]]; then
  arch=\$(uname -m)
  if [[ "\$arch" == "arm64" ]]; then
    gen=\$(echo "\$cpu" | grep -oE 'M[0-9]+' | grep -oE '[0-9]+' || true)
    case "\$gen" in
      1) cpu_speed=3.2 ;;
      2) cpu_speed=3.5 ;;
      3) cpu_speed=4.1 ;;
      4) cpu_speed=4.4 ;;
      *)
        if [[ -n "\$gen" && "\$gen" -gt 4 ]]; then
          cpu_speed=\$(echo "4.4 + (\$gen - 4) * 0.3" | bc)
          warn "CPU speed for M\${gen} is estimated"
        else
          cpu_speed=3.0
          warn "Could not determine Apple Silicon generation"
        fi
        ;;
    esac
  else
    freq=\$(sysctl -n hw.cpufrequency_max 2>/dev/null || echo 0)
    if [[ "\$freq" -gt 0 ]]; then
      cpu_speed=\$(echo "scale=1; \$freq / 1000000000" | bc)
    else
      warn "Could not detect CPU speed"
    fi
  fi
else
  if [[ -f /sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq ]]; then
    khz=\$(cat /sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq 2>/dev/null || echo 0)
    if [[ "\$khz" -gt 0 ]]; then
      cpu_speed=\$(echo "scale=1; \$khz / 1000000" | bc)
    fi
  fi
  if [[ "\$cpu_speed" == "0" || -z "\$cpu_speed" ]]; then
    mhz=\$(grep -m1 'cpu MHz' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | tr -d ' ' || true)
    if [[ -n "\$mhz" ]]; then
      cpu_speed=\$(echo "scale=1; \$mhz / 1000" | bc)
    else
      warn "Could not detect CPU speed"
    fi
  fi
fi

# --- GPU ---
gpu=""
if [[ "\$(uname)" == "Darwin" ]]; then
  arch=\$(uname -m)
  if [[ "\$arch" == "arm64" ]]; then
    gpu=\$(echo "\$cpu" | grep -oE 'Apple M[0-9]+( Pro| Max| Ultra)?' || echo "Apple Silicon GPU")
  else
    gpu=\$(system_profiler SPDisplaysDataType 2>/dev/null | grep 'Chipset Model' | head -1 | cut -d: -f2 | sed 's/^ //' || true)
  fi
else
  if command -v lspci &>/dev/null; then
    line=\$(lspci 2>/dev/null | grep -iE 'vga|3d|display' | head -1 || true)
    if [[ -n "\$line" ]]; then
      raw=\$(echo "\$line" | sed 's/^[^:]*: //')
      bracket=\$(echo "\$raw" | grep -oE '\\[.+\\]' | tr -d '[]' || true)
      if [[ -n "\$bracket" ]]; then
        vendor=""
        lower=\$(echo "\$raw" | tr '[:upper:]' '[:lower:]')
        if echo "\$lower" | grep -q intel; then vendor="Intel"; fi
        if echo "\$lower" | grep -q nvidia; then vendor="NVIDIA"; fi
        if echo "\$lower" | grep -qE 'amd|advanced micro'; then vendor="AMD"; fi
        bracket_lower=\$(echo "\$bracket" | tr '[:upper:]' '[:lower:]')
        if [[ -n "\$vendor" ]] && ! echo "\$bracket_lower" | grep -qi "\$vendor"; then
          gpu="\$vendor \$bracket"
        else
          gpu="\$bracket"
        fi
      else
        gpu=\$(echo "\$raw" | sed 's/Corporation//; s/Advanced Micro Devices, Inc./AMD/; s/Advanced Micro Devices/AMD/; s/ (rev [0-9a-f]*)//; s/  */ /g; s/^ //; s/ \$//')
      fi
    fi
  else
    warn "Could not detect GPU (lspci not found)"
  fi
fi
if [[ -z "\$gpu" ]]; then
  gpu="Unknown"
  warn "Could not detect GPU"
fi

# --- RAM (GB) ---
ram_gb=0
if [[ "\$(uname)" == "Darwin" ]]; then
  mem_bytes=\$(sysctl -n hw.memsize 2>/dev/null || echo 0)
  if [[ "\$mem_bytes" -gt 0 ]]; then
    ram_gb=\$((\$mem_bytes / 1073741824))
  else
    warn "Could not detect RAM"
  fi
else
  if [[ -f /proc/meminfo ]]; then
    mem_kb=\$(grep '^MemTotal:' /proc/meminfo | awk '{print \$2}')
    ram_gb=\$(( (\$mem_kb + 524288) / 1048576 ))
  else
    warn "Could not detect RAM"
  fi
fi

# --- Storage (free GB on root) ---
storage_gb=0
if [[ "\$(uname)" == "Darwin" ]]; then
  storage_gb=\$(df -g / 2>/dev/null | awk 'NR==2 {print \$4}' || echo 0)
else
  storage_gb=\$(df -BG / 2>/dev/null | awk 'NR==2 {print \$4}' | tr -d 'G' || echo 0)
fi
if [[ "\$storage_gb" -eq 0 ]]; then
  warn "Could not detect free storage"
fi

# --- Summary ---
echo "OS:      \$os"
echo "CPU:     \$cpu (\$cpu_cores cores @ \${cpu_speed} GHz)"
echo "GPU:     \$gpu"
echo "RAM:     \${ram_gb} GB"
echo "Storage: \${storage_gb} GB free"

if [[ \${#errors[@]} -gt 0 ]]; then
  echo
  echo "Warnings:"
  for e in "\${errors[@]}"; do
    echo "  - \$e"
  done
fi

# --- POST to import API ---
echo
echo "Sending specs..."

json=\$(cat <<INNEREOF
{
  "os": "\$os",
  "cpu": "\$cpu",
  "cpuCores": \$cpu_cores,
  "cpuSpeedGHz": \$cpu_speed,
  "gpu": "\$gpu",
  "ramGB": \$ram_gb,
  "storageGB": \$storage_gb
}
INNEREOF
)

response=\$(curl -s -X POST "${baseUrl}/api/import" \\
  -H "Content-Type: application/json" \\
  -d "\$json")

token=\$(echo "\$response" | grep -oE '"token":"[^"]+"' | cut -d'"' -f4)

if [[ -z "\$token" ]]; then
  echo "Failed to upload specs. You can use the website manually."
  echo "Error: \$response"
  exit 1
fi

# --- Open browser ---
url="${baseUrl}/?import=\$token"
echo "Opening browser..."

if [[ "\$(uname)" == "Darwin" ]]; then
  open "\$url"
else
  if command -v xdg-open &>/dev/null; then
    xdg-open "\$url" &>/dev/null &
  else
    echo "Could not open browser. Visit this URL manually:"
    echo "\$url"
  fi
fi

echo
echo "Done! Your specs should appear in the browser."
`;
}
