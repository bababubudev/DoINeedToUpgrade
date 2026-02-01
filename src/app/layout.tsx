import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "System Requirements Checker",
  description: "Check if your system meets the requirements of any Steam game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="min-h-screen bg-base-200">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <h1 className="text-4xl font-bold text-center mb-2">
            System Requirements Checker
          </h1>
          <p className="text-center text-base-content/60 mb-8">
            Check if your PC can run any Steam game
          </p>
          {children}
        </div>
      </body>
    </html>
  );
}
