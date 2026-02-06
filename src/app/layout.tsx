import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import NavButtons from "@/components/NavButtons";
import Logo from "@/components/Logo";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Do I Need An Upgrade",
    template: "%s | Do I Need An Upgrade",
  },
  description: "Check if your PC can run any Steam game. Compare your CPU, GPU, RAM and storage against game requirements instantly.",
  keywords: ["PC upgrade", "system requirements", "can I run it", "Steam games", "PC specs", "hardware check", "GPU comparison", "CPU benchmark"],
  authors: [{ name: "Do I Need An Upgrade" }],
  creator: "Do I Need An Upgrade",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Do I Need An Upgrade",
    title: "Do I Need An Upgrade",
    description: "Check if your PC can run any Steam game. Compare your hardware against game requirements instantly.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Do I Need An Upgrade",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Do I Need An Upgrade",
    description: "Check if your PC can run any Steam game. Compare your hardware against game requirements instantly.",
    images: ["/icon-512.png"],
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${montserrat.className} min-h-screen bg-base-200`}>
        <div className="navbar bg-base-100 border-b border-base-300 px-4">
          <div className="flex-1">
            <Logo />
          </div>
          <div className="flex-none flex items-center gap-1">
            <NavButtons />
            <ThemeToggle />
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {children}
        </div>
      </body>
    </html>
  );
}
