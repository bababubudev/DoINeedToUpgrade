//go:build windows

package main

import (
	"encoding/json"
	"os/exec"
	"strings"
	"syscall"
)

// CREATE_NO_WINDOW prevents console window from appearing
const CREATE_NO_WINDOW = 0x08000000

func detectSpecs() DetectionResult {
	specs := Specs{}
	var errors []string

	// Run all queries in a single PowerShell call to avoid multiple window flashes
	script := `
$os = (Get-CimInstance Win32_OperatingSystem).Caption -replace '^Microsoft\s+', ''
$cpuInfo = Get-CimInstance Win32_Processor | Select-Object -First 1
$cpu = $cpuInfo.Name
$cores = $cpuInfo.NumberOfCores
$speed = $cpuInfo.MaxClockSpeed
$gpu = (Get-CimInstance Win32_VideoController | Where-Object { $_.Name -notmatch 'Microsoft Basic Display' -and $_.Name -notmatch 'Microsoft Remote' } | Select-Object -First 1).Name
$ram = [math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)
$storage = [math]::Round((Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Measure-Object -Property FreeSpace -Sum).Sum / 1GB)

@{
    os = $os
    cpu = $cpu
    cores = $cores
    speed = $speed
    gpu = $gpu
    ram = $ram
    storage = $storage
} | ConvertTo-Json
`

	out := powershellHidden(script)

	// Parse JSON response
	var result struct {
		OS      string `json:"os"`
		CPU     string `json:"cpu"`
		Cores   int    `json:"cores"`
		Speed   int    `json:"speed"` // MHz
		GPU     string `json:"gpu"`
		RAM     int    `json:"ram"`
		Storage int    `json:"storage"`
	}

	if err := json.Unmarshal([]byte(out), &result); err != nil {
		errors = append(errors, "Failed to parse hardware information from PowerShell: "+err.Error())
		return DetectionResult{Specs: specs, Errors: errors}
	}

	specs.OS = strings.TrimSpace(result.OS)
	if specs.OS == "" {
		errors = append(errors, "Could not detect OS version")
	}

	specs.CPU = cleanCPUName(strings.TrimSpace(result.CPU))
	if specs.CPU == "" {
		errors = append(errors, "Could not detect CPU name")
	}

	specs.CPUCores = result.Cores
	if specs.CPUCores == 0 {
		errors = append(errors, "Could not detect CPU core count")
	}

	specs.CPUSpeedGHz = float64(result.Speed) / 1000.0 // MHz to GHz
	if specs.CPUSpeedGHz == 0 {
		errors = append(errors, "Could not detect CPU speed")
	}

	specs.GPU = strings.TrimSpace(result.GPU)
	if specs.GPU == "" {
		errors = append(errors, "Could not detect GPU name")
	}

	specs.RAMGB = result.RAM
	if specs.RAMGB == 0 {
		errors = append(errors, "Could not detect RAM size")
	}

	specs.StorageGB = result.Storage
	if specs.StorageGB == 0 {
		errors = append(errors, "Could not detect storage free space")
	}

	return DetectionResult{Specs: specs, Errors: errors}
}

func powershellHidden(script string) string {
	cmd := exec.Command("powershell", "-NoProfile", "-Command", script)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: CREATE_NO_WINDOW,
	}
	out, _ := cmd.Output()
	return string(out)
}
