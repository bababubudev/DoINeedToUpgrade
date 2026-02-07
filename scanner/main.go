package main

import (
	"bufio"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

const baseURL = "https://do-i-need-to-upgrade.vercel.app"

type Specs struct {
	OS          string  `json:"os"`
	CPU         string  `json:"cpu"`
	CPUCores    int     `json:"cpuCores"`
	CPUSpeedGHz float64 `json:"cpuSpeedGHz"`
	GPU         string  `json:"gpu"`
	RAMGB       int     `json:"ramGB"`
	StorageGB   int     `json:"storageGB"`
}

func main() {
	// Use GUI mode by default (terminal mode available via --terminal flag)
	if len(os.Args) > 1 && os.Args[1] == "--terminal" {
		runTerminal()
	} else {
		runGUI()
	}
}

func runTerminal() {
	fmt.Println()
	fmt.Println("=== DoINeedAnUpgrade Hardware Scanner ===")
	fmt.Println()

	specs := detectSpecs()

	fmt.Printf("OS:      %s\n", specs.OS)
	fmt.Printf("CPU:     %s (%d cores @ %.1f GHz)\n", specs.CPU, specs.CPUCores, specs.CPUSpeedGHz)
	fmt.Printf("GPU:     %s\n", specs.GPU)
	fmt.Printf("RAM:     %d GB\n", specs.RAMGB)
	fmt.Printf("Storage: %d GB free\n", specs.StorageGB)

	code := encodeSpecs(specs)

	fmt.Println()
	fmt.Println("Your hardware specs:")
	fmt.Println(code)
	fmt.Println()

	// Copy to clipboard
	copyToClipboard(code)

	// Open browser
	url := getURL(specs)
	fmt.Println()
	fmt.Println("Opening browser...")
	openBrowser(url)

	fmt.Println()
	fmt.Println("Done! Your browser should open with your specs imported.")
	fmt.Println("If it doesn't, you can paste the code manually on the website.")
	fmt.Println()

	waitForEnter()
}

func encodeSpecs(specs Specs) string {
	jsonData, err := json.Marshal(specs)
	if err != nil {
		return ""
	}
	encoded := base64.StdEncoding.EncodeToString(jsonData)
	return "DINAU:" + encoded
}

func getURL(specs Specs) string {
	jsonData, err := json.Marshal(specs)
	if err != nil {
		return baseURL
	}
	encoded := base64.StdEncoding.EncodeToString(jsonData)
	return baseURL + "?specs=" + encoded
}

func waitForEnter() {
	fmt.Print("Press Enter to close...")
	bufio.NewReader(os.Stdin).ReadBytes('\n')
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default: // linux, freebsd, etc.
		cmd = exec.Command("xdg-open", url)
	}
	cmd.Start()
}
