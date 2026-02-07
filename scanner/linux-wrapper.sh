#!/bin/bash

# DoINeedAnUpgrade - Hardware Scanner for Linux
# This script runs the hardware detection tool with a GUI dialog

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BINARY="$SCRIPT_DIR/DoINeedAnUpgrade-Linux-bin"

# Check if binary exists
if [ ! -f "$BINARY" ]; then
    # If binary doesn't exist in script dir, try system path
    if ! command -v DoINeedAnUpgrade-Linux-bin &> /dev/null; then
        echo "Error: DoINeedAnUpgrade binary not found"
        exit 1
    fi
    BINARY="DoINeedAnUpgrade-Linux-bin"
fi

# Execute the binary
exec "$BINARY"
