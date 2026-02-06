import Foundation

struct Specs: Codable {
    let os: String
    let cpu: String
    let cpuCores: Int
    let gpu: String
    let ramGB: Int
    let storageGB: Int
}

class Scanner {
    static func detectSpecs() -> Specs {
        // OS
        let productName = execCmd("/usr/bin/sw_vers", ["-productName"]).trimmingCharacters(in: .whitespacesAndNewlines)
        let productVersion = execCmd("/usr/bin/sw_vers", ["-productVersion"]).trimmingCharacters(in: .whitespacesAndNewlines)
        let os = "\(productName) \(productVersion)"

        // CPU
        let cpuBrand = execCmd("/usr/sbin/sysctl", ["-n", "machdep.cpu.brand_string"]).trimmingCharacters(in: .whitespacesAndNewlines)
        let cpu = cleanCPUName(cpuBrand)

        // CPU Cores
        let coresStr = execCmd("/usr/sbin/sysctl", ["-n", "hw.physicalcpu"]).trimmingCharacters(in: .whitespacesAndNewlines)
        let cpuCores = Int(coresStr) ?? 0

        // GPU - Apple Silicon uses chip name as GPU
        let arch = execCmd("/usr/bin/uname", ["-m"]).trimmingCharacters(in: .whitespacesAndNewlines)
        var gpu = ""
        if arch == "arm64" {
            // Extract Apple chip name from CPU
            if let range = cpu.range(of: #"Apple M\d+\s*(Pro|Max|Ultra)?"#, options: .regularExpression) {
                gpu = String(cpu[range]).trimmingCharacters(in: .whitespaces)
            } else {
                gpu = "Apple Silicon GPU"
            }
        } else {
            // Intel Mac - get discrete/integrated GPU
            let gpuInfo = execCmd("/usr/sbin/system_profiler", ["SPDisplaysDataType"])
            for line in gpuInfo.split(separator: "\n") {
                if line.contains("Chipset Model") {
                    let parts = line.split(separator: ":", maxSplits: 1)
                    if parts.count == 2 {
                        gpu = String(parts[1]).trimmingCharacters(in: .whitespaces)
                        break
                    }
                }
            }
        }

        // RAM
        let memBytes = execCmd("/usr/sbin/sysctl", ["-n", "hw.memsize"]).trimmingCharacters(in: .whitespacesAndNewlines)
        let memBytesInt = Int64(memBytes) ?? 0
        let ramGB = Int(memBytesInt / 1073741824)

        // Storage (free space on root)
        var storageGB = 0
        let dfOutput = execCmd("/bin/df", ["-g", "/"])
        let lines = dfOutput.split(separator: "\n")
        if lines.count >= 2 {
            let fields = lines[1].split(separator: " ", omittingEmptySubsequences: true)
            if fields.count >= 4 {
                storageGB = Int(fields[3]) ?? 0
            }
        }

        return Specs(os: os, cpu: cpu, cpuCores: cpuCores, gpu: gpu, ramGB: ramGB, storageGB: storageGB)
    }

    static func encodeSpecs(_ specs: Specs) -> String? {
        let encoder = JSONEncoder()
        guard let jsonData = try? encoder.encode(specs) else { return nil }
        let base64 = jsonData.base64EncodedString()
        return "DINAU:" + base64
    }

    static func getURL(_ specs: Specs) -> String {
        let encoder = JSONEncoder()
        guard let jsonData = try? encoder.encode(specs) else { return "http://localhost:3000" }
        let base64 = jsonData.base64EncodedString()
        return "http://localhost:3000?specs=" + base64
    }

    private static func execCmd(_ path: String, _ args: [String]) -> String {
        let process = Process()
        let pipe = Pipe()

        process.executableURL = URL(fileURLWithPath: path)
        process.arguments = args
        process.standardOutput = pipe
        process.standardError = FileHandle.nullDevice

        do {
            try process.run()
            process.waitUntilExit()
        } catch {
            return ""
        }

        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        return String(data: data, encoding: .utf8) ?? ""
    }

    private static func cleanCPUName(_ name: String) -> String {
        var result = name
        result = result.replacingOccurrences(of: "(R)", with: "")
        result = result.replacingOccurrences(of: "(TM)", with: "")
        result = result.replacingOccurrences(of: "(tm)", with: "")
        // Collapse multiple spaces
        while result.contains("  ") {
            result = result.replacingOccurrences(of: "  ", with: " ")
        }
        return result.trimmingCharacters(in: .whitespaces)
    }
}
