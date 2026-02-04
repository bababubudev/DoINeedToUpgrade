#!/bin/sh
# DoINeedAnUpgrade - Hardware Detection Script (macOS / Linux)
# Run: chmod +x detect-specs.sh && ./detect-specs.sh

set -e

echo ""
echo "=== DoINeedAnUpgrade Hardware Scanner ==="
echo ""

OS_TYPE=$(uname -s)

if [ "$OS_TYPE" = "Darwin" ]; then
  # --- macOS ---
  OS_NAME="$(sw_vers -productName) $(sw_vers -productVersion)"

  CPU_NAME=$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "")
  CPU_NAME=$(echo "$CPU_NAME" | sed 's/(R)//g; s/(TM)//g; s/(tm)//g; s/  */ /g' | xargs)

  CPU_CORES=$(sysctl -n hw.physicalcpu 2>/dev/null || echo "0")

  # GPU: Apple Silicon uses integrated GPU named after the chip
  ARCH=$(uname -m)
  if [ "$ARCH" = "arm64" ]; then
    # Extract Apple chip name from CPU for GPU
    GPU_NAME=$(echo "$CPU_NAME" | grep -o 'Apple M[^ ]*' || echo "")
    if [ -z "$GPU_NAME" ]; then
      GPU_NAME="Apple Silicon GPU"
    fi
  else
    GPU_NAME=$(system_profiler SPDisplaysDataType 2>/dev/null | grep 'Chipset Model' | head -1 | sed 's/.*: //' | xargs)
    if [ -z "$GPU_NAME" ]; then
      GPU_NAME=""
    fi
  fi

  RAM_BYTES=$(sysctl -n hw.memsize 2>/dev/null || echo "0")
  RAM_GB=$((RAM_BYTES / 1073741824))

  STORAGE_FREE=$(df -g / 2>/dev/null | tail -1 | awk '{print $4}')
  if [ -z "$STORAGE_FREE" ]; then
    STORAGE_FREE=0
  fi

else
  # --- Linux ---
  if [ -f /etc/os-release ]; then
    OS_NAME=$(. /etc/os-release && echo "$PRETTY_NAME")
  else
    OS_NAME=$(uname -sr)
  fi

  CPU_NAME=$(lscpu 2>/dev/null | grep 'Model name' | sed 's/.*:\s*//' | xargs || \
    grep 'model name' /proc/cpuinfo 2>/dev/null | head -1 | sed 's/.*: //' | xargs || \
    echo "")
  CPU_NAME=$(echo "$CPU_NAME" | sed 's/(R)//g; s/(TM)//g; s/(tm)//g; s/  */ /g' | xargs)

  CPU_CORES=$(nproc 2>/dev/null || echo "0")

  if command -v lspci >/dev/null 2>&1; then
    GPU_NAME=$(lspci 2>/dev/null | grep -iE 'vga|3d|display' | head -1 | sed 's/.*: //' | xargs)
  else
    GPU_NAME=""
  fi

  RAM_KB=$(grep 'MemTotal' /proc/meminfo 2>/dev/null | awk '{print $2}')
  if [ -n "$RAM_KB" ]; then
    RAM_GB=$(( (RAM_KB + 524288) / 1048576 ))
  else
    RAM_GB=0
  fi

  STORAGE_FREE=$(df -BG / 2>/dev/null | tail -1 | awk '{gsub(/G/,"",$4); print $4}')
  if [ -z "$STORAGE_FREE" ]; then
    STORAGE_FREE=0
  fi
fi

echo "OS:      $OS_NAME"
echo "CPU:     $CPU_NAME ($CPU_CORES cores)"
echo "GPU:     $GPU_NAME"
echo "RAM:     ${RAM_GB} GB"
echo "Storage: ${STORAGE_FREE} GB free"

# Build JSON
JSON="{\"os\":\"${OS_NAME}\",\"cpu\":\"${CPU_NAME}\",\"cpuCores\":${CPU_CORES},\"gpu\":\"${GPU_NAME}\",\"ramGB\":${RAM_GB},\"storageGB\":${STORAGE_FREE}}"

# Base64 encode (macOS vs Linux)
if [ "$OS_TYPE" = "Darwin" ]; then
  ENCODED=$(printf '%s' "$JSON" | base64)
else
  ENCODED=$(printf '%s' "$JSON" | base64 -w 0)
fi

echo ""
echo "Copy the code below and paste it into DoINeedAnUpgrade:"
echo ""
echo "DINAU:${ENCODED}"
echo ""
