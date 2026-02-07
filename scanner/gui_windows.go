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
	// Detect specs
	specs := detectSpecs()

	// Encode and copy to clipboard
	code := encodeSpecs(specs)
	copyToClipboard(code)

	// Open browser
	url := getURL(specs)
	openBrowser(url)

	// Show completion message
	showMessage("DoINeedAnUpgrade", "Hardware scan complete!\n\nYour specs have been copied to clipboard and the browser is opening.")
}
