//go:build windows

package main

import (
	"os/exec"
	"regexp"
	"strconv"
	"strings"
)

func detectSpecs() Specs {
	specs := Specs{}

	// OS
	osOutput := powershell(`(Get-CimInstance Win32_OperatingSystem).Caption -replace '^Microsoft\s+', ''`)
	specs.OS = strings.TrimSpace(osOutput)

	// CPU
	cpuOutput := powershell(`(Get-CimInstance Win32_Processor | Select-Object -First 1).Name`)
	specs.CPU = cleanCPUName(strings.TrimSpace(cpuOutput))

	// CPU Cores
	coresOutput := powershell(`(Get-CimInstance Win32_Processor | Select-Object -First 1).NumberOfCores`)
	specs.CPUCores, _ = strconv.Atoi(strings.TrimSpace(coresOutput))

	// GPU
	gpuOutput := powershell(`(Get-CimInstance Win32_VideoController | Where-Object { $_.Name -notmatch 'Microsoft Basic Display' -and $_.Name -notmatch 'Microsoft Remote' } | Select-Object -First 1).Name`)
	specs.GPU = strings.TrimSpace(gpuOutput)

	// RAM
	ramOutput := powershell(`[math]::Round((Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB)`)
	specs.RAMGB, _ = strconv.Atoi(strings.TrimSpace(ramOutput))

	// Storage (free space on fixed drives)
	storageOutput := powershell(`[math]::Round((Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Measure-Object -Property FreeSpace -Sum).Sum / 1GB)`)
	specs.StorageGB, _ = strconv.Atoi(strings.TrimSpace(storageOutput))

	return specs
}

func powershell(script string) string {
	out, _ := exec.Command("powershell", "-NoProfile", "-Command", script).Output()
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
