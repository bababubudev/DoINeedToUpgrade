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
    <html lang="en" data-theme="light">
      <body className="min-h-screen bg-base-200">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex justify-end mb-2">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold text-center mb-2">
            Do I Need To Upgrade?
          </h1>
          <p className="text-center text-base-content/60 mb-8">
            Find out if your PC needs an upgrade to run any Steam game
          </p>
          {children}
        </div>
      </body>
    </html>
  );
}
