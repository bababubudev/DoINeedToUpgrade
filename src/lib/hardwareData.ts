export const cpuList: string[] = [
  // Intel 6th Gen
  "Intel Core i3-6100",
  "Intel Core i5-6400",
  "Intel Core i5-6500",
  "Intel Core i5-6600K",
  "Intel Core i7-6700",
  "Intel Core i7-6700K",
  // Intel 7th Gen
  "Intel Core i3-7100",
  "Intel Core i5-7400",
  "Intel Core i5-7500",
  "Intel Core i5-7600K",
  "Intel Core i7-7700",
  "Intel Core i7-7700K",
  // Intel 8th Gen
  "Intel Core i3-8100",
  "Intel Core i5-8400",
  "Intel Core i5-8600K",
  "Intel Core i7-8700",
  "Intel Core i7-8700K",
  // Intel 9th Gen
  "Intel Core i5-9400F",
  "Intel Core i5-9600K",
  "Intel Core i7-9700K",
  "Intel Core i9-9900K",
  // Intel 10th Gen
  "Intel Core i5-10400",
  "Intel Core i5-10600K",
  "Intel Core i7-10700K",
  "Intel Core i9-10900K",
  // Intel 11th Gen
  "Intel Core i5-11400",
  "Intel Core i5-11600K",
  "Intel Core i7-11700K",
  "Intel Core i9-11900K",
  // Intel 12th Gen
  "Intel Core i5-12400",
  "Intel Core i5-12600K",
  "Intel Core i7-12700K",
  "Intel Core i9-12900K",
  // Intel 13th Gen
  "Intel Core i5-13400",
  "Intel Core i5-13600K",
  "Intel Core i7-13700K",
  "Intel Core i9-13900K",
  // Intel 14th Gen
  "Intel Core i5-14400",
  "Intel Core i5-14600K",
  "Intel Core i7-14700K",
  "Intel Core i9-14900K",
  // AMD Ryzen 1000
  "AMD Ryzen 3 1200",
  "AMD Ryzen 5 1400",
  "AMD Ryzen 5 1600",
  "AMD Ryzen 7 1700",
  "AMD Ryzen 7 1800X",
  // AMD Ryzen 2000
  "AMD Ryzen 5 2600",
  "AMD Ryzen 7 2700X",
  // AMD Ryzen 3000
  "AMD Ryzen 5 3600",
  "AMD Ryzen 7 3700X",
  "AMD Ryzen 9 3900X",
  // AMD Ryzen 5000
  "AMD Ryzen 5 5600X",
  "AMD Ryzen 7 5800X",
  "AMD Ryzen 9 5900X",
  "AMD Ryzen 9 5950X",
  // AMD Ryzen 7000
  "AMD Ryzen 5 7600X",
  "AMD Ryzen 7 7700X",
  "AMD Ryzen 9 7900X",
  "AMD Ryzen 9 7950X",
];

export const gpuList: string[] = [
  // NVIDIA GTX 1000 series
  "NVIDIA GeForce GTX 1050",
  "NVIDIA GeForce GTX 1050 Ti",
  "NVIDIA GeForce GTX 1060 3GB",
  "NVIDIA GeForce GTX 1060 6GB",
  "NVIDIA GeForce GTX 1070",
  "NVIDIA GeForce GTX 1070 Ti",
  "NVIDIA GeForce GTX 1080",
  "NVIDIA GeForce GTX 1080 Ti",
  // NVIDIA GTX 1600 series
  "NVIDIA GeForce GTX 1650",
  "NVIDIA GeForce GTX 1650 Super",
  "NVIDIA GeForce GTX 1660",
  "NVIDIA GeForce GTX 1660 Super",
  "NVIDIA GeForce GTX 1660 Ti",
  // NVIDIA RTX 2000 series
  "NVIDIA GeForce RTX 2060",
  "NVIDIA GeForce RTX 2060 Super",
  "NVIDIA GeForce RTX 2070",
  "NVIDIA GeForce RTX 2070 Super",
  "NVIDIA GeForce RTX 2080",
  "NVIDIA GeForce RTX 2080 Super",
  "NVIDIA GeForce RTX 2080 Ti",
  // NVIDIA RTX 3000 series
  "NVIDIA GeForce RTX 3050",
  "NVIDIA GeForce RTX 3060",
  "NVIDIA GeForce RTX 3060 Ti",
  "NVIDIA GeForce RTX 3070",
  "NVIDIA GeForce RTX 3070 Ti",
  "NVIDIA GeForce RTX 3080",
  "NVIDIA GeForce RTX 3080 Ti",
  "NVIDIA GeForce RTX 3090",
  "NVIDIA GeForce RTX 3090 Ti",
  // NVIDIA RTX 4000 series
  "NVIDIA GeForce RTX 4060",
  "NVIDIA GeForce RTX 4060 Ti",
  "NVIDIA GeForce RTX 4070",
  "NVIDIA GeForce RTX 4070 Super",
  "NVIDIA GeForce RTX 4070 Ti",
  "NVIDIA GeForce RTX 4070 Ti Super",
  "NVIDIA GeForce RTX 4080",
  "NVIDIA GeForce RTX 4080 Super",
  "NVIDIA GeForce RTX 4090",
  // AMD RX 5000 series
  "AMD Radeon RX 5500 XT",
  "AMD Radeon RX 5600 XT",
  "AMD Radeon RX 5700",
  "AMD Radeon RX 5700 XT",
  // AMD RX 6000 series
  "AMD Radeon RX 6600",
  "AMD Radeon RX 6600 XT",
  "AMD Radeon RX 6700 XT",
  "AMD Radeon RX 6800",
  "AMD Radeon RX 6800 XT",
  "AMD Radeon RX 6900 XT",
  // AMD RX 7000 series
  "AMD Radeon RX 7600",
  "AMD Radeon RX 7700 XT",
  "AMD Radeon RX 7800 XT",
  "AMD Radeon RX 7900 XT",
  "AMD Radeon RX 7900 XTX",
];

// Relative performance scores (~10-100 scale, not real benchmarks)
export const cpuScores: Record<string, number> = {
  // Intel 6th Gen
  "Intel Core i3-6100": 20,
  "Intel Core i5-6400": 25,
  "Intel Core i5-6500": 27,
  "Intel Core i5-6600K": 30,
  "Intel Core i7-6700": 33,
  "Intel Core i7-6700K": 35,
  // Intel 7th Gen
  "Intel Core i3-7100": 22,
  "Intel Core i5-7400": 27,
  "Intel Core i5-7500": 29,
  "Intel Core i5-7600K": 32,
  "Intel Core i7-7700": 35,
  "Intel Core i7-7700K": 38,
  // Intel 8th Gen
  "Intel Core i3-8100": 28,
  "Intel Core i5-8400": 35,
  "Intel Core i5-8600K": 40,
  "Intel Core i7-8700": 43,
  "Intel Core i7-8700K": 46,
  // Intel 9th Gen
  "Intel Core i5-9400F": 37,
  "Intel Core i5-9600K": 42,
  "Intel Core i7-9700K": 50,
  "Intel Core i9-9900K": 55,
  // Intel 10th Gen
  "Intel Core i5-10400": 42,
  "Intel Core i5-10600K": 48,
  "Intel Core i7-10700K": 55,
  "Intel Core i9-10900K": 60,
  // Intel 11th Gen
  "Intel Core i5-11400": 47,
  "Intel Core i5-11600K": 52,
  "Intel Core i7-11700K": 58,
  "Intel Core i9-11900K": 60,
  // Intel 12th Gen
  "Intel Core i5-12400": 55,
  "Intel Core i5-12600K": 65,
  "Intel Core i7-12700K": 75,
  "Intel Core i9-12900K": 82,
  // Intel 13th Gen
  "Intel Core i5-13400": 58,
  "Intel Core i5-13600K": 72,
  "Intel Core i7-13700K": 82,
  "Intel Core i9-13900K": 90,
  // Intel 14th Gen
  "Intel Core i5-14400": 60,
  "Intel Core i5-14600K": 74,
  "Intel Core i7-14700K": 85,
  "Intel Core i9-14900K": 95,
  // AMD Ryzen 1000
  "AMD Ryzen 3 1200": 18,
  "AMD Ryzen 5 1400": 22,
  "AMD Ryzen 5 1600": 28,
  "AMD Ryzen 7 1700": 32,
  "AMD Ryzen 7 1800X": 35,
  // AMD Ryzen 2000
  "AMD Ryzen 5 2600": 33,
  "AMD Ryzen 7 2700X": 40,
  // AMD Ryzen 3000
  "AMD Ryzen 5 3600": 45,
  "AMD Ryzen 7 3700X": 52,
  "AMD Ryzen 9 3900X": 60,
  // AMD Ryzen 5000
  "AMD Ryzen 5 5600X": 62,
  "AMD Ryzen 7 5800X": 70,
  "AMD Ryzen 9 5900X": 80,
  "AMD Ryzen 9 5950X": 85,
  // AMD Ryzen 7000
  "AMD Ryzen 5 7600X": 75,
  "AMD Ryzen 7 7700X": 82,
  "AMD Ryzen 9 7900X": 90,
  "AMD Ryzen 9 7950X": 100,
};

export const gpuScores: Record<string, number> = {
  // NVIDIA GTX 1000 series
  "NVIDIA GeForce GTX 1050": 15,
  "NVIDIA GeForce GTX 1050 Ti": 18,
  "NVIDIA GeForce GTX 1060 3GB": 25,
  "NVIDIA GeForce GTX 1060 6GB": 28,
  "NVIDIA GeForce GTX 1070": 35,
  "NVIDIA GeForce GTX 1070 Ti": 38,
  "NVIDIA GeForce GTX 1080": 42,
  "NVIDIA GeForce GTX 1080 Ti": 50,
  // NVIDIA GTX 1600 series
  "NVIDIA GeForce GTX 1650": 20,
  "NVIDIA GeForce GTX 1650 Super": 25,
  "NVIDIA GeForce GTX 1660": 28,
  "NVIDIA GeForce GTX 1660 Super": 32,
  "NVIDIA GeForce GTX 1660 Ti": 33,
  // NVIDIA RTX 2000 series
  "NVIDIA GeForce RTX 2060": 38,
  "NVIDIA GeForce RTX 2060 Super": 42,
  "NVIDIA GeForce RTX 2070": 45,
  "NVIDIA GeForce RTX 2070 Super": 50,
  "NVIDIA GeForce RTX 2080": 53,
  "NVIDIA GeForce RTX 2080 Super": 56,
  "NVIDIA GeForce RTX 2080 Ti": 60,
  // NVIDIA RTX 3000 series
  "NVIDIA GeForce RTX 3050": 32,
  "NVIDIA GeForce RTX 3060": 42,
  "NVIDIA GeForce RTX 3060 Ti": 50,
  "NVIDIA GeForce RTX 3070": 55,
  "NVIDIA GeForce RTX 3070 Ti": 58,
  "NVIDIA GeForce RTX 3080": 68,
  "NVIDIA GeForce RTX 3080 Ti": 72,
  "NVIDIA GeForce RTX 3090": 75,
  "NVIDIA GeForce RTX 3090 Ti": 78,
  // NVIDIA RTX 4000 series
  "NVIDIA GeForce RTX 4060": 52,
  "NVIDIA GeForce RTX 4060 Ti": 58,
  "NVIDIA GeForce RTX 4070": 65,
  "NVIDIA GeForce RTX 4070 Super": 70,
  "NVIDIA GeForce RTX 4070 Ti": 72,
  "NVIDIA GeForce RTX 4070 Ti Super": 76,
  "NVIDIA GeForce RTX 4080": 82,
  "NVIDIA GeForce RTX 4080 Super": 85,
  "NVIDIA GeForce RTX 4090": 100,
  // AMD RX 5000 series
  "AMD Radeon RX 5500 XT": 22,
  "AMD Radeon RX 5600 XT": 32,
  "AMD Radeon RX 5700": 38,
  "AMD Radeon RX 5700 XT": 42,
  // AMD RX 6000 series
  "AMD Radeon RX 6600": 38,
  "AMD Radeon RX 6600 XT": 42,
  "AMD Radeon RX 6700 XT": 50,
  "AMD Radeon RX 6800": 58,
  "AMD Radeon RX 6800 XT": 65,
  "AMD Radeon RX 6900 XT": 72,
  // AMD RX 7000 series
  "AMD Radeon RX 7600": 45,
  "AMD Radeon RX 7700 XT": 58,
  "AMD Radeon RX 7800 XT": 65,
  "AMD Radeon RX 7900 XT": 80,
  "AMD Radeon RX 7900 XTX": 88,
};

export const osList: string[] = [
  "Windows 7",
  "Windows 8",
  "Windows 8.1",
  "Windows 10",
  "Windows 11",
  "macOS Monterey",
  "macOS Ventura",
  "macOS Sonoma",
  "macOS Sequoia",
  "Ubuntu 22.04",
  "Ubuntu 24.04",
  "Linux Mint",
  "Fedora",
  "Arch Linux",
  "SteamOS",
];
