//go:build linux

package main

import (
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
)

func detectSpecs() DetectionResult {
	specs := Specs{}
	var errors []string

	// OS
	if data, err := os.ReadFile("/etc/os-release"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			if strings.HasPrefix(line, "PRETTY_NAME=") {
				specs.OS = strings.Trim(strings.TrimPrefix(line, "PRETTY_NAME="), `"`)
				break
			}
		}
	}
	if specs.OS == "" {
		out, err := exec.Command("uname", "-sr").Output()
		if err != nil {
			errors = append(errors, "Could not detect OS version")
		} else {
			specs.OS = strings.TrimSpace(string(out))
		}
	}

	// CPU
	if data, err := os.ReadFile("/proc/cpuinfo"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			if strings.HasPrefix(line, "model name") {
				parts := strings.SplitN(line, ":", 2)
				if len(parts) == 2 {
					specs.CPU = cleanCPUName(strings.TrimSpace(parts[1]))
					break
				}
			}
		}
	}
	if specs.CPU == "" {
		errors = append(errors, "Could not detect CPU name")
	}

	// CPU Cores (physical) — count unique (physical_id, core_id) pairs
	specs.CPUCores = countPhysicalCores()
	if specs.CPUCores == 0 {
		// Fallback to nproc (gives logical threads)
		out, _ := exec.Command("nproc").Output()
		specs.CPUCores, _ = strconv.Atoi(strings.TrimSpace(string(out)))
		if specs.CPUCores > 0 {
			errors = append(errors, "Core count is logical threads, not physical cores (nproc fallback)")
		} else {
			errors = append(errors, "Could not detect CPU core count")
		}
	}

	// CPU Speed - try max frequency first, fall back to current
	if data, err := os.ReadFile("/sys/devices/system/cpu/cpu0/cpufreq/cpuinfo_max_freq"); err == nil {
		if kHz, err := strconv.ParseInt(strings.TrimSpace(string(data)), 10, 64); err == nil && kHz > 0 {
			specs.CPUSpeedGHz = float64(kHz) / 1e6 // kHz to GHz
		}
	}
	if specs.CPUSpeedGHz == 0 {
		// Fallback: parse from /proc/cpuinfo
		if data, err := os.ReadFile("/proc/cpuinfo"); err == nil {
			for _, line := range strings.Split(string(data), "\n") {
				if strings.HasPrefix(line, "cpu MHz") {
					parts := strings.SplitN(line, ":", 2)
					if len(parts) == 2 {
						if mhz, err := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64); err == nil {
							specs.CPUSpeedGHz = mhz / 1000.0
							break
						}
					}
				}
			}
		}
	}
	if specs.CPUSpeedGHz == 0 {
		errors = append(errors, "Could not detect CPU speed")
	}

	// GPU
	lspciOut, err := exec.Command("lspci").Output()
	if err != nil {
		errors = append(errors, "Could not detect GPU (lspci failed)")
	} else {
		for _, line := range strings.Split(string(lspciOut), "\n") {
			lower := strings.ToLower(line)
			if strings.Contains(lower, "vga") || strings.Contains(lower, "3d") || strings.Contains(lower, "display") {
				// lspci format: "SLOT CLASS: VENDOR DEVICE (rev XX)"
				// Split on ": " to skip the slot+class prefix (slot uses ":" without space)
				parts := strings.SplitN(line, ": ", 2)
				if len(parts) == 2 {
					specs.GPU = cleanGPUName(strings.TrimSpace(parts[1]))
					break
				}
			}
		}
		if specs.GPU == "" {
			errors = append(errors, "Could not detect GPU name from lspci output")
		}
	}

	// RAM
	if data, err := os.ReadFile("/proc/meminfo"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			if strings.HasPrefix(line, "MemTotal:") {
				fields := strings.Fields(line)
				if len(fields) >= 2 {
					kb, _ := strconv.ParseInt(fields[1], 10, 64)
					specs.RAMGB = int((kb + 524288) / 1048576) // Round to nearest GB
				}
				break
			}
		}
	}
	if specs.RAMGB == 0 {
		errors = append(errors, "Could not detect RAM size")
	}

	// Storage (free space on root)
	dfOut, err := exec.Command("df", "-BG", "/").Output()
	if err != nil {
		errors = append(errors, "Could not detect storage free space")
	} else {
		lines := strings.Split(string(dfOut), "\n")
		if len(lines) >= 2 {
			fields := strings.Fields(lines[1])
			if len(fields) >= 4 {
				freeStr := strings.TrimSuffix(fields[3], "G")
				specs.StorageGB, _ = strconv.Atoi(freeStr)
			}
		}
		if specs.StorageGB == 0 {
			errors = append(errors, "Could not parse storage free space")
		}
	}

	return DetectionResult{Specs: specs, Errors: errors}
}

// countPhysicalCores counts unique (physical_id, core_id) pairs from /proc/cpuinfo.
func countPhysicalCores() int {
	data, err := os.ReadFile("/proc/cpuinfo")
	if err != nil {
		return 0
	}

	type coreKey struct {
		physicalID string
		coreID     string
	}
	seen := make(map[coreKey]bool)
	var currentPhysicalID, currentCoreID string

	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "physical id") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				currentPhysicalID = strings.TrimSpace(parts[1])
			}
		} else if strings.HasPrefix(line, "core id") {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				currentCoreID = strings.TrimSpace(parts[1])
				seen[coreKey{currentPhysicalID, currentCoreID}] = true
			}
		}
	}

	return len(seen)
}

// cleanGPUName normalises lspci GPU output into a form that matches our database.
// Input example: "Intel Corporation Raptor Lake-P [UHD Graphics] (rev 04)"
// Output:        "Intel UHD Graphics"
func cleanGPUName(name string) string {
	// Strip "(rev XX)" suffix
	name = regexp.MustCompile(`\(rev\s+[0-9a-fA-F]+\)`).ReplaceAllString(name, "")

	// If there's a bracket portion like [UHD Graphics], use it as the device name
	// combined with the vendor prefix
	if bracketRe := regexp.MustCompile(`\[(.+?)\]`); bracketRe.MatchString(name) {
		deviceName := bracketRe.FindStringSubmatch(name)[1]
		vendor := ""
		lower := strings.ToLower(name)
		switch {
		case strings.Contains(lower, "intel"):
			vendor = "Intel"
		case strings.Contains(lower, "nvidia"):
			vendor = "NVIDIA"
		case strings.Contains(lower, "amd") || strings.Contains(lower, "advanced micro"):
			vendor = "AMD"
		}
		if vendor != "" {
			// Avoid "Intel Intel HD Graphics" if bracket already contains vendor
			if !strings.Contains(strings.ToLower(deviceName), strings.ToLower(vendor)) {
				name = vendor + " " + deviceName
			} else {
				name = deviceName
			}
		} else {
			name = deviceName
		}
	} else {
		// No bracket — strip common noise words
		name = strings.ReplaceAll(name, "Corporation", "")
		name = strings.ReplaceAll(name, "Advanced Micro Devices, Inc.", "AMD")
		name = strings.ReplaceAll(name, "Advanced Micro Devices", "AMD")
	}

	// Collapse whitespace
	name = regexp.MustCompile(`\s+`).ReplaceAllString(name, " ")
	return strings.TrimSpace(name)
}
