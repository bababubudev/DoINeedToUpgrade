package main

import (
	"bufio"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"runtime"
	"strings"
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

type DetectionResult struct {
	Specs  Specs
	Errors []string
}

// cleanCPUName normalises CPU brand strings for matching.
func cleanCPUName(name string) string {
	name = strings.ReplaceAll(name, "(R)", "")
	name = strings.ReplaceAll(name, "(TM)", "")
	name = strings.ReplaceAll(name, "(tm)", "")
	// Remove "CPU @ X.XGHz" pattern (common in Intel strings)
	re := regexp.MustCompile(`\s+CPU\s+@\s+[\d.]+\s*[GgMm][Hh][Zz]`)
	name = re.ReplaceAllString(name, "")
	// Collapse multiple spaces
	re = regexp.MustCompile(`\s+`)
	name = re.ReplaceAllString(name, " ")
	return strings.TrimSpace(name)
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

	result := detectSpecs()

	fmt.Printf("OS:      %s\n", result.Specs.OS)
	fmt.Printf("CPU:     %s (%d cores @ %.1f GHz)\n", result.Specs.CPU, result.Specs.CPUCores, result.Specs.CPUSpeedGHz)
	fmt.Printf("GPU:     %s\n", result.Specs.GPU)
	fmt.Printf("RAM:     %d GB\n", result.Specs.RAMGB)
	fmt.Printf("Storage: %d GB free\n", result.Specs.StorageGB)

	if len(result.Errors) > 0 {
		fmt.Println()
		fmt.Println("Warnings:")
		for _, e := range result.Errors {
			fmt.Printf("  - %s\n", e)
		}
	}

	code := encodeSpecs(result.Specs)

	fmt.Println()
	fmt.Println("Your hardware specs:")
	fmt.Println(code)
	fmt.Println()

	// Copy to clipboard
	copyToClipboard(code)

	// Open browser
	url := getURL(result.Specs)
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
