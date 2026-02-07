//go:build !linux

package main

import (
	"fmt"

	"golang.design/x/clipboard"
)

func copyToClipboard(code string) {
	if err := clipboard.Init(); err == nil {
		clipboard.Write(clipboard.FmtText, []byte(code))
		fmt.Println("[OK] Copied to clipboard!")
	} else {
		fmt.Println("[!] Could not copy to clipboard")
	}
}
