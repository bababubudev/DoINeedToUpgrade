# DoINeedToUpgrade

A web application that helps users check if their system meets the requirements to run a specific game.

## Features

- **Game Search** — Find any game and view its requirements
- **Hardware Detection** — Automatic or manual hardware spec input
- **Requirements Comparison** — See exactly what you're missing (if anything)
- **Cross-Platform** — Works on Windows, macOS, and Linux

## Tech Stack

- **Frontend** — Next.js + TypeScript + React + Tailwind CSS
- **Hardware Scanner** — Go (Windows/macOS/Linux)
- **Deployment** — Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- Go 1.21+ (for building the hardware scanner)

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build Scanner

See [scanner/README.md](scanner/README.md) for hardware scanner build instructions.

## Project Structure

- `src/` — Next.js app (pages, components, API routes)
- `scanner/` — Go hardware detection tool
- `public/` — Static files and scanner downloads
- `public/downloads/` — Pre-built scanner executables