//go:build windows

package main

import (
	"encoding/json"
	"os/exec"
	"regexp"
	"strings"
	"syscall"
)

// CREATE_NO_WINDOW prevents console window from appearing
const CREATE_NO_WINDOW = 0x08000000

func detectSpecs() Specs {
	specs := Specs{}

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

	if err := json.Unmarshal([]byte(out), &result); err == nil {
		specs.OS = strings.TrimSpace(result.OS)
		specs.CPU = cleanCPUName(strings.TrimSpace(result.CPU))
		specs.CPUCores = result.Cores
		specs.CPUSpeedGHz = float64(result.Speed) / 1000.0 // MHz to GHz
		specs.GPU = strings.TrimSpace(result.GPU)
		specs.RAMGB = result.RAM
		specs.StorageGB = result.Storage
	}

	return specs
}

func powershellHidden(script string) string {
	cmd := exec.Command("powershell", "-NoProfile", "-Command", script)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		CreationFlags: CREATE_NO_WINDOW,
	}
	out, _ := cmd.Output()
	return string(out)
}

func cleanCPUName(name string) string {
	name = strings.ReplaceAll(name, "(R)", "")
	name = strings.ReplaceAll(name, "(TM)", "")
	name = strings.ReplaceAll(name, "(tm)", "")
	// Remove CPU @ frequency pattern
	re := regexp.MustCompile(`\s+CPU\s+@\s+[\d.]+\s*[GgMm][Hh][Zz]`)
	name = re.ReplaceAllString(name, "")
	// Collapse multiple spaces
	re = regexp.MustCompile(`\s+`)
	name = re.ReplaceAllString(name, " ")
	return strings.TrimSpace(name)
}
