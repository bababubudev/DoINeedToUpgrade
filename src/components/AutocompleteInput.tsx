"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export default function AutocompleteInput({
  value,
  onChange,
  options,
  placeholder,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = (() => {
    if (!value.trim()) return [];
    const tokens = value.toLowerCase().split(/\s+/).filter(Boolean);
    return options
      .filter((opt) => {
        const lower = opt.toLowerCase();
        return tokens.every((t) => lower.includes(t));
      })
      .slice(0, 10);
  })();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => filtered.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
      />
      {isOpen && filtered.length > 0 && (
        <ul className="menu bg-base-300 rounded-box absolute z-50 w-full mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filtered.map((item) => (
            <li key={item}>
              <button
                onClick={() => {
                  onChange(item);
                  setIsOpen(false);
                }}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
