import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Do I Need To Upgrade",
  description: "Find out if your PC needs an upgrade to run any Steam game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-screen bg-base-200">
        <div className="navbar bg-base-100 border-b border-base-300 px-4">
          <div className="flex-1">
            <span className="text-lg font-bold">Do I Need To Upgrade?</span>
          </div>
          <div className="flex-none">
            <ThemeToggle />
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          {children}
        </div>
      </body>
    </html>
  );
}
