//go:build windows

package main

import (
	"syscall"
	"unsafe"
)

var (
	user32          = syscall.NewLazyDLL("user32.dll")
	procMessageBoxW = user32.NewProc("MessageBoxW")
)

const (
	MB_OK              = 0x00000000
	MB_ICONINFORMATION = 0x00000040
)

func showMessage(title, message string) {
	titlePtr, _ := syscall.UTF16PtrFromString(title)
	messagePtr, _ := syscall.UTF16PtrFromString(message)
	procMessageBoxW.Call(
		0,
		uintptr(unsafe.Pointer(messagePtr)),
		uintptr(unsafe.Pointer(titlePtr)),
		MB_OK|MB_ICONINFORMATION,
	)
}

func runGUI() {
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
	showMessage("DoINeedAnUpgrade", msg)
}
