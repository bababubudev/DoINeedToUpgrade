"use client";

export default function Logo() {
  return (
    <button
      onClick={() => window.location.href = '/'}
      className="text-lg sm:text-xl font-extrabold tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
      aria-label="Do I Need To Upgrade?"
    >
      <span className="sm:hidden">Upgrade?</span>
      <span className="hidden sm:inline">Do I Need To Upgrade?</span>
    </button>
  );
}
