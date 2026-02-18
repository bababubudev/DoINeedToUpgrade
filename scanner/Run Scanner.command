#!/bin/bash
# Removes macOS quarantine flag and launches the scanner app
DIR="$(cd "$(dirname "$0")" && pwd)"
xattr -cr "$DIR"/DoINeedAnUpgrade-Mac-*.app 2>/dev/null
open "$DIR"/DoINeedAnUpgrade-Mac-*.app
