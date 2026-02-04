# DoINeedAnUpgrade - Hardware Detection Script (Windows)
# Run: powershell -ExecutionPolicy Bypass -File detect-specs.ps1

Write-Host ""
Write-Host "=== DoINeedAnUpgrade Hardware Scanner ===" -ForegroundColor Cyan
Write-Host ""

# OS
$osInfo = Get-CimInstance -ClassName Win32_OperatingSystem
$osName = $osInfo.Caption -replace "^Microsoft\s+", ""
Write-Host "OS:      $osName"

# CPU
$cpuInfo = Get-CimInstance -ClassName Win32_Processor | Select-Object -First 1
$cpuName = $cpuInfo.Name
$cpuName = $cpuName -replace "\(R\)", "" -replace "\(TM\)", "" -replace "\(tm\)", ""
$cpuName = $cpuName -replace "\s+CPU\s+@\s+[\d.]+\s*[GgMm][Hh][Zz]", ""
$cpuName = $cpuName -replace "\s+", " "
$cpuName = $cpuName.Trim()
$cpuCores = $cpuInfo.NumberOfCores
Write-Host "CPU:     $cpuName ($cpuCores cores)"

# GPU
$gpuList = Get-CimInstance -ClassName Win32_VideoController |
    Where-Object { $_.Name -notmatch "Microsoft Basic Display" -and $_.Name -notmatch "Microsoft Remote" } |
    Select-Object -First 1
$gpuName = if ($gpuList) { $gpuList.Name } else { "" }
Write-Host "GPU:     $gpuName"

# RAM
$cs = Get-CimInstance -ClassName Win32_ComputerSystem
$ramGB = [math]::Round($cs.TotalPhysicalMemory / 1GB)
Write-Host "RAM:     ${ramGB} GB"

# Storage (free space on fixed drives)
$storageGB = [math]::Round(
    (Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DriveType=3" |
        Measure-Object -Property FreeSpace -Sum).Sum / 1GB
)
Write-Host "Storage: ${storageGB} GB free"

# Build JSON and encode
$payload = @{
    os        = $osName
    cpu       = $cpuName
    cpuCores  = $cpuCores
    gpu       = $gpuName
    ramGB     = $ramGB
    storageGB = $storageGB
} | ConvertTo-Json -Compress

$encoded = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($payload))

Write-Host ""
Write-Host "Copy the code below and paste it into DoINeedAnUpgrade:" -ForegroundColor Yellow
Write-Host ""
Write-Host "DINAU:$encoded" -ForegroundColor Green
Write-Host ""
