//go:build linux

package main

import (
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
)

func detectSpecs() Specs {
	specs := Specs{}

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
		out, _ := exec.Command("uname", "-sr").Output()
		specs.OS = strings.TrimSpace(string(out))
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

	// CPU Cores
	out, _ := exec.Command("nproc").Output()
	specs.CPUCores, _ = strconv.Atoi(strings.TrimSpace(string(out)))

	// GPU
	lspciOut, err := exec.Command("lspci").Output()
	if err == nil {
		for _, line := range strings.Split(string(lspciOut), "\n") {
			lower := strings.ToLower(line)
			if strings.Contains(lower, "vga") || strings.Contains(lower, "3d") || strings.Contains(lower, "display") {
				parts := strings.SplitN(line, ":", 2)
				if len(parts) == 2 {
					specs.GPU = strings.TrimSpace(parts[1])
					break
				}
			}
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

	// Storage (free space on root)
	dfOut, _ := exec.Command("df", "-BG", "/").Output()
	lines := strings.Split(string(dfOut), "\n")
	if len(lines) >= 2 {
		fields := strings.Fields(lines[1])
		if len(fields) >= 4 {
			freeStr := strings.TrimSuffix(fields[3], "G")
			specs.StorageGB, _ = strconv.Atoi(freeStr)
		}
	}

	return specs
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
