//go:build linux

package main

import (
	"os"
	"os/exec"

	"golang.design/x/clipboard"
)

func hasZenity() bool {
	_, err := exec.LookPath("zenity")
	return err == nil
}

func hasDisplay() bool {
	return os.Getenv("DISPLAY") != "" || os.Getenv("WAYLAND_DISPLAY") != ""
}

func runGUI() {
	if !hasDisplay() || !hasZenity() {
		// Fall back to terminal mode
		runTerminal()
		return
	}

	// Show progress dialog
	zenityProgress := exec.Command("zenity", "--progress", "--pulsate", "--no-cancel",
		"--title=DoINeedAnUpgrade", "--text=Scanning your hardware...", "--auto-close")
	zenityProgress.Start()

	// Detect specs
	specs := detectSpecs()

	// Encode and copy to clipboard (GUI version - no console output)
	code := encodeSpecs(specs)
	if err := clipboard.Init(); err == nil {
		clipboard.Write(clipboard.FmtText, []byte(code))
	}

	// Open browser
	url := getURL(specs)
	openBrowser(url)

	// Close progress and show completion
	if zenityProgress.Process != nil {
		zenityProgress.Process.Kill()
	}

	exec.Command("zenity", "--info",
		"--title=DoINeedAnUpgrade",
		"--text=Hardware scan complete!\n\nYour specs have been copied to clipboard and the browser is opening.",
		"--timeout=3").Run()
}
