#!/bin/bash
DIR="$(cd "$(dirname "$0")/../Resources" && pwd)"
osascript -e "tell application \"Terminal\"" \
    -e "activate" \
    -e "do script \"\\\"$DIR/scanner\\\"\"" \
    -e "end tell"
