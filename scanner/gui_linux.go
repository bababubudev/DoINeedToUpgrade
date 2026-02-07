//go:build linux

package main

import (
	"fmt"
	"os"
	"os/exec"
)

func hasDisplay() bool {
	return os.Getenv("DISPLAY") != "" || os.Getenv("WAYLAND_DISPLAY") != ""
}

func hasCommand(name string) bool {
	_, err := exec.LookPath(name)
	return err == nil
}

func runGUI() {
	if !hasDisplay() {
		// No display server — just detect, print specs code, and exit
		specs := detectSpecs()
		code := encodeSpecs(specs)
		fmt.Println(code)
		return
	}

	// Determine which GUI toolkit is available
	switch {
	case hasCommand("zenity"):
		runWithZenity()
	case hasCommand("kdialog"):
		runWithKdialog()
	case hasCommand("notify-send"):
		runWithNotifySend()
	default:
		runSilent()
	}
}

func runWithZenity() {
	// Show progress dialog
	progress := exec.Command("zenity", "--progress", "--pulsate", "--no-cancel",
		"--title=DoINeedAnUpgrade", "--text=Scanning your hardware...", "--auto-close")
	progress.Start()

	specs := detectSpecs()
	code := encodeSpecs(specs)
	copyToClipboard(code)

	url := getURL(specs)
	openBrowser(url)

	if progress.Process != nil {
		progress.Process.Kill()
	}

	exec.Command("zenity", "--info",
		"--title=DoINeedAnUpgrade",
		"--text=Hardware scan complete!\n\nYour specs have been copied to clipboard and the browser is opening.",
		"--timeout=3").Run()
}

func runWithKdialog() {
	// Show passive popup as progress indicator
	exec.Command("kdialog", "--passivepopup", "Scanning your hardware...", "3").Start()

	specs := detectSpecs()
	code := encodeSpecs(specs)
	copyToClipboard(code)

	url := getURL(specs)
	openBrowser(url)

	exec.Command("kdialog", "--msgbox",
		"Hardware scan complete!\n\nYour specs have been copied to clipboard and the browser is opening.").Run()
}

func runWithNotifySend() {
	exec.Command("notify-send", "DoINeedAnUpgrade", "Scanning your hardware...").Run()

	specs := detectSpecs()
	code := encodeSpecs(specs)
	copyToClipboard(code)

	url := getURL(specs)
	openBrowser(url)

	exec.Command("notify-send", "DoINeedAnUpgrade",
		"Hardware scan complete! Your browser is opening.").Run()
}

func runSilent() {
	specs := detectSpecs()
	code := encodeSpecs(specs)
	copyToClipboard(code)

	url := getURL(specs)
	openBrowser(url)
}
