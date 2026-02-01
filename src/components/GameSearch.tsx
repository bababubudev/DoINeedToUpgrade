"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameSearchResult } from "@/types";

interface Props {
  onSelect: (appid: number) => void;
}

export default function GameSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      setResults(data.items || []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Search for a Game</h2>
        <div ref={wrapperRef} className="relative">
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="Type a game name (e.g., Cyberpunk 2077)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
          />
          {loading && (
            <span className="loading loading-spinner loading-sm absolute right-3 top-3" />
          )}

          {isOpen && results.length > 0 && (
            <ul className="menu bg-base-300 rounded-box absolute z-50 w-full mt-1 max-h-72 overflow-y-auto shadow-lg">
              {results.map((game) => (
                <li key={game.id}>
                  <button
                    className="flex items-center gap-3"
                    onClick={() => {
                      setQuery(game.name);
                      setIsOpen(false);
                      onSelect(game.id);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={game.tiny_image}
                      alt={game.name}
                      className="w-12 h-auto rounded"
                    />
                    <span>{game.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
