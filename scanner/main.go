package main

import (
	"bufio"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"runtime"

	"golang.design/x/clipboard"
)

const baseURL = "https://do-i-need-to-upgrade.vercel.app"

type Specs struct {
	OS        string `json:"os"`
	CPU       string `json:"cpu"`
	CPUCores  int    `json:"cpuCores"`
	GPU       string `json:"gpu"`
	RAMGB     int    `json:"ramGB"`
	StorageGB int    `json:"storageGB"`
}

func main() {
	fmt.Println()
	fmt.Println("=== DoINeedAnUpgrade Hardware Scanner ===")
	fmt.Println()

	specs := detectSpecs()

	fmt.Printf("OS:      %s\n", specs.OS)
	fmt.Printf("CPU:     %s (%d cores)\n", specs.CPU, specs.CPUCores)
	fmt.Printf("GPU:     %s\n", specs.GPU)
	fmt.Printf("RAM:     %d GB\n", specs.RAMGB)
	fmt.Printf("Storage: %d GB free\n", specs.StorageGB)

	// Build JSON and encode
	jsonData, err := json.Marshal(specs)
	if err != nil {
		fmt.Println("[!] Error encoding specs")
		waitForEnter()
		return
	}

	encoded := base64.StdEncoding.EncodeToString(jsonData)
	code := "DINAU:" + encoded

	fmt.Println()
	fmt.Println("Your hardware specs:")
	fmt.Println(code)
	fmt.Println()

	// Copy to clipboard
	if err := clipboard.Init(); err == nil {
		clipboard.Write(clipboard.FmtText, []byte(code))
		fmt.Println("[OK] Copied to clipboard!")
	} else {
		fmt.Println("[!] Could not copy to clipboard")
	}

	// Open browser
	url := baseURL + "?specs=" + encoded
	fmt.Println()
	fmt.Println("Opening browser...")
	openBrowser(url)

	fmt.Println()
	fmt.Println("Done! Your browser should open with your specs imported.")
	fmt.Println("If it doesn't, you can paste the code manually on the website.")
	fmt.Println()

	waitForEnter()
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
