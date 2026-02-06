//go:build darwin

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
	productName, _ := execCmd("sw_vers", "-productName")
	productVersion, _ := execCmd("sw_vers", "-productVersion")
	specs.OS = strings.TrimSpace(productName) + " " + strings.TrimSpace(productVersion)

	// CPU
	cpuBrand, _ := execCmd("sysctl", "-n", "machdep.cpu.brand_string")
	specs.CPU = cleanCPUName(strings.TrimSpace(cpuBrand))

	// CPU Cores
	coresStr, _ := execCmd("sysctl", "-n", "hw.physicalcpu")
	specs.CPUCores, _ = strconv.Atoi(strings.TrimSpace(coresStr))

	// GPU - Apple Silicon uses chip name as GPU
	arch, _ := execCmd("uname", "-m")
	if strings.TrimSpace(arch) == "arm64" {
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
		gpuInfo, _ := execCmd("system_profiler", "SPDisplaysDataType")
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

	// RAM
	memBytes, _ := execCmd("sysctl", "-n", "hw.memsize")
	memBytesInt, _ := strconv.ParseInt(strings.TrimSpace(memBytes), 10, 64)
	specs.RAMGB = int(memBytesInt / 1073741824)

	// Storage (free space on root)
	dfOutput, _ := execCmd("df", "-g", "/")
	lines := strings.Split(dfOutput, "\n")
	if len(lines) >= 2 {
		fields := strings.Fields(lines[1])
		if len(fields) >= 4 {
			specs.StorageGB, _ = strconv.Atoi(fields[3])
		}
	}

	return specs
}

func execCmd(name string, args ...string) (string, error) {
	out, err := exec.Command(name, args...).Output()
	return string(out), err
}

func cleanCPUName(name string) string {
	name = strings.ReplaceAll(name, "(R)", "")
	name = strings.ReplaceAll(name, "(TM)", "")
	name = strings.ReplaceAll(name, "(tm)", "")
	// Collapse multiple spaces
	re := regexp.MustCompile(`\s+`)
	name = re.ReplaceAllString(name, " ")
	return strings.TrimSpace(name)
}
