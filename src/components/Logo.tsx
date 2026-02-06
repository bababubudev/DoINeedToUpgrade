"use client";

export default function Logo() {
  return (
    <button
      onClick={() => window.location.href = '/'}
      className="text-xl font-extrabold tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
    >
      Do I Need An Upgrade?
    </button>
  );
}
