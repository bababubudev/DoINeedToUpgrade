//go:build linux

package main

import (
	"fmt"
	"os/exec"
	"strings"
)

func copyToClipboard(code string) {
	// Try common clipboard CLI tools (no CGO needed)
	tools := []struct {
		name string
		args []string
	}{
		{"wl-copy", nil},                            // Wayland
		{"xclip", []string{"-selection", "clipboard"}}, // X11
		{"xsel", []string{"--clipboard", "--input"}},   // X11 alternative
	}

	for _, tool := range tools {
		path, err := exec.LookPath(tool.name)
		if err != nil {
			continue
		}
		cmd := exec.Command(path, tool.args...)
		cmd.Stdin = strings.NewReader(code)
		if err := cmd.Run(); err == nil {
			fmt.Println("[OK] Copied to clipboard!")
			return
		}
	}

	fmt.Println("[!] Could not copy to clipboard (install xclip, xsel, or wl-copy)")
}
