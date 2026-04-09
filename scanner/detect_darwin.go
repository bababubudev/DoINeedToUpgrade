//go:build darwin

package main

import (
	"fmt"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
)

func detectSpecs() DetectionResult {
	specs := Specs{}
	var errors []string

	// OS
	productName, err := execCmd("sw_vers", "-productName")
	if err != nil {
		errors = append(errors, "Could not detect OS product name")
	}
	productVersion, err := execCmd("sw_vers", "-productVersion")
	if err != nil {
		errors = append(errors, "Could not detect OS version")
	}
	specs.OS = strings.TrimSpace(productName) + " " + strings.TrimSpace(productVersion)

	// CPU
	cpuBrand, err := execCmd("sysctl", "-n", "machdep.cpu.brand_string")
	if err != nil {
		errors = append(errors, "Could not detect CPU brand")
	}
	specs.CPU = cleanCPUName(strings.TrimSpace(cpuBrand))

	// CPU Cores
	coresStr, err := execCmd("sysctl", "-n", "hw.physicalcpu")
	if err != nil {
		errors = append(errors, "Could not detect CPU core count")
	}
	specs.CPUCores, _ = strconv.Atoi(strings.TrimSpace(coresStr))

	// CPU Speed
	arch, err := execCmd("uname", "-m")
	if err != nil {
		errors = append(errors, "Could not detect CPU architecture")
	}
	isAppleSilicon := strings.TrimSpace(arch) == "arm64"
	if isAppleSilicon {
		// Apple Silicon - use known max performance core speeds
		speed, warning := getAppleSiliconSpeed(specs.CPU)
		specs.CPUSpeedGHz = speed
		if warning != "" {
			errors = append(errors, warning)
		}
	} else {
		// Intel Mac - get frequency from sysctl
		freqStr, err := execCmd("sysctl", "-n", "hw.cpufrequency_max")
		if err != nil {
			errors = append(errors, "Could not detect CPU frequency")
		} else {
			if freqHz, err := strconv.ParseInt(strings.TrimSpace(freqStr), 10, 64); err == nil && freqHz > 0 {
				specs.CPUSpeedGHz = float64(freqHz) / 1e9
			}
		}
	}

	// GPU - Apple Silicon uses chip name as GPU
	if isAppleSilicon {
		// Extract Apple chip name
		re := regexp.MustCompile(`Apple M\d+\s*(Pro|Max|Ultra)?`)
		match := re.FindString(specs.CPU)
		if match != "" {
			specs.GPU = strings.TrimSpace(match)
		} else {
			specs.GPU = "Apple Silicon GPU"
		}
	} else {
		// Intel Mac - get discrete/integrated GPU
		gpuInfo, err := execCmd("system_profiler", "SPDisplaysDataType")
		if err != nil {
			errors = append(errors, "Could not detect GPU information")
		} else {
			for _, line := range strings.Split(gpuInfo, "\n") {
				if strings.Contains(line, "Chipset Model") {
					parts := strings.SplitN(line, ":", 2)
					if len(parts) == 2 {
						specs.GPU = strings.TrimSpace(parts[1])
						break
					}
				}
			}
		}
	}

	// RAM
	memBytes, err := execCmd("sysctl", "-n", "hw.memsize")
	if err != nil {
		errors = append(errors, "Could not detect RAM size")
	}
	memBytesInt, _ := strconv.ParseInt(strings.TrimSpace(memBytes), 10, 64)
	specs.RAMGB = int(memBytesInt / 1073741824)

	// Storage (free space on root)
	dfOutput, err := execCmd("df", "-g", "/")
	if err != nil {
		errors = append(errors, "Could not detect storage free space")
	} else {
		lines := strings.Split(dfOutput, "\n")
		if len(lines) >= 2 {
			fields := strings.Fields(lines[1])
			if len(fields) >= 4 {
				specs.StorageGB, _ = strconv.Atoi(fields[3])
			}
		}
	}

	return DetectionResult{Specs: specs, Errors: errors}
}

func execCmd(name string, args ...string) (string, error) {
	out, err := exec.Command(name, args...).Output()
	return string(out), err
}

// getAppleSiliconSpeed returns known max performance core speeds for Apple Silicon chips.
// For unknown future generations, it extrapolates from the M3→M4 trend (~0.3 GHz/gen).
func getAppleSiliconSpeed(cpuName string) (float64, string) {
	knownSpeeds := map[int]float64{
		1: 3.2,
		2: 3.5,
		3: 4.1,
		4: 4.4,
	}

	// Extract generation number from "Apple M4 Pro" etc.
	re := regexp.MustCompile(`M(\d+)`)
	match := re.FindStringSubmatch(cpuName)
	if len(match) < 2 {
		return 3.0, "Could not determine Apple Silicon generation, using 3.0 GHz fallback"
	}

	gen, err := strconv.Atoi(match[1])
	if err != nil || gen < 1 {
		return 3.0, "Could not parse Apple Silicon generation number"
	}

	if speed, ok := knownSpeeds[gen]; ok {
		return speed, ""
	}

	// Extrapolate for unknown future generations
	extrapolated := 4.4 + float64(gen-4)*0.3
	return extrapolated, fmt.Sprintf("CPU speed for M%d is estimated (%.1f GHz)", gen, extrapolated)
}
