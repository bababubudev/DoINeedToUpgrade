//go:build darwin

package main

// On macOS, we use the Swift GUI app instead of the Go binary.
// This stub exists only for build compatibility if someone tries to build
// the Go version on macOS.

func runGUI() {
	// Fall back to terminal mode on macOS Go build
	// The actual GUI is the Swift app in macos-gui/
	runTerminal()
}
