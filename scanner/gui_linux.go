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
		result := detectSpecs()
		code := encodeSpecs(result.Specs)
		fmt.Println(code)
		if len(result.Errors) > 0 {
			for _, e := range result.Errors {
				fmt.Printf("warning: %s\n", e)
			}
		}
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

	result := detectSpecs()
	code := encodeSpecs(result.Specs)
	copyToClipboard(code)

	url := getURL(result.Specs)
	openBrowser(url)

	if progress.Process != nil {
		progress.Process.Kill()
	}

	msg := "Hardware scan complete!\n\nYour specs have been copied to clipboard and the browser is opening."
	if len(result.Errors) > 0 {
		msg += "\n\nWarnings:"
		for _, e := range result.Errors {
			msg += "\n- " + e
		}
	}
	exec.Command("zenity", "--info",
		"--title=DoINeedAnUpgrade",
		"--text="+msg,
		"--timeout=3").Run()
}

func runWithKdialog() {
	// Show passive popup as progress indicator
	exec.Command("kdialog", "--passivepopup", "Scanning your hardware...", "3").Start()

	result := detectSpecs()
	code := encodeSpecs(result.Specs)
	copyToClipboard(code)

	url := getURL(result.Specs)
	openBrowser(url)

	msg := "Hardware scan complete!\n\nYour specs have been copied to clipboard and the browser is opening."
	if len(result.Errors) > 0 {
		msg += "\n\nWarnings:"
		for _, e := range result.Errors {
			msg += "\n- " + e
		}
	}
	exec.Command("kdialog", "--msgbox", msg).Run()
}

func runWithNotifySend() {
	exec.Command("notify-send", "DoINeedAnUpgrade", "Scanning your hardware...").Run()

	result := detectSpecs()
	code := encodeSpecs(result.Specs)
	copyToClipboard(code)

	url := getURL(result.Specs)
	openBrowser(url)

	notifyMsg := "Hardware scan complete! Your browser is opening."
	if len(result.Errors) > 0 {
		notifyMsg += " (with warnings)"
	}
	exec.Command("notify-send", "DoINeedAnUpgrade", notifyMsg).Run()
}

func runSilent() {
	result := detectSpecs()
	code := encodeSpecs(result.Specs)
	copyToClipboard(code)

	url := getURL(result.Specs)
	openBrowser(url)
}
