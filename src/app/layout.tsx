import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import NavButtons from "@/components/NavButtons";
import SettingsDropdown from "@/components/SettingsDropdown";
import Logo from "@/components/Logo";
import { StructuredData } from "@/components/StructuredData";
import GeometricBackground from "@/components/GeometricBackground";
import PerformanceHint from "@/components/PerformanceHint";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://doineedtoupgrade.com"),
  title: {
    default: "Do I Need To Upgrade",
    template: "%s | Do I Need To Upgrade",
  },
  description: "Check if your PC can run any Steam game. Compare your CPU, GPU, RAM and storage against game requirements instantly.",
  keywords: ["PC upgrade", "system requirements", "can I run it", "Steam games", "PC specs", "hardware check", "GPU comparison", "CPU benchmark"],
  authors: [{ name: "Do I Need To Upgrade" }],
  creator: "Do I Need To Upgrade",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Do I Need To Upgrade",
    title: "Do I Need To Upgrade",
    description: "Check if your PC can run any Steam game. Compare your hardware against game requirements instantly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Do I Need To Upgrade",
    description: "Check if your PC can run any Steam game. Compare your hardware against game requirements instantly.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  verification: {
    google: "gqGgjLe8m4yTdxE4FxpwnwdTOSG4pvZhfAHhg7IVGJ4",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" data-reduce-motion="false" className="h-full overflow-hidden">
      <head>
        <StructuredData />
      </head>
      <body className={`${montserrat.className} h-full overflow-hidden flex flex-col bg-base-200`}>
        <GeometricBackground />
        <div className="navbar bg-base-100/80 backdrop-blur-sm border-b border-base-300 px-4 relative z-20 flex-none">
          <div className="flex-1">
            <Logo />
          </div>
          <div className="flex-none flex items-center gap-1">
            <NavButtons />
            <SettingsDropdown />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto relative z-10">
          <div className="container mx-auto px-4 py-6 max-w-5xl">
            {children}
          </div>
        </main>
        <PerformanceHint />
        <Analytics />
      </body>
    </html>
  );
}
