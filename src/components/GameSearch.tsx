"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiArrowRight, HiGlobe } from "react-icons/hi";
import { FaSteam } from "react-icons/fa";
import { GameSearchResult, GameSource } from "@/types";

interface Props {
  onSelect: (id: number, source: GameSource) => void;
  igdbRemaining: number;
  igdbLimit: number;
  initialSource?: GameSource;
}

export default function GameSearch({ onSelect, igdbRemaining, igdbLimit, initialSource = "steam" }: Props) {
  const isMac = useMemo(() => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform), []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [source, setSource] = useState<GameSource>(initialSource);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const igdbExhausted = igdbRemaining <= 0;

  const search = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}&source=${source}`);
      const data = await res.json();
      const items = data.items || [];
      setResults(items);
      setSelectedIndex(items.length > 0 ? 0 : -1);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, search, source]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          const game = results[selectedIndex];
          setQuery(game.name);
          setIsOpen(false);
          setSelectedIndex(-1);
          onSelect(game.id, game.source || source);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="card-title">Search for a Game</h2>
          <div className="join join-horizontal">
            <button
              className={`join-item btn btn-xs ${source === "steam" ? "text-white border-[#2a475e] bg-[#2a475e] hover:bg-[#1b2838]" : "btn-ghost border border-base-300"}`}
              onClick={() => { setSource("steam"); setResults([]); }}
            >
              <FaSteam className="w-3.5 h-3.5" /> Steam
            </button>
            <div className={igdbRemaining < igdbLimit && source === "igdb" ? "indicator" : ""}>
              {igdbRemaining < igdbLimit && source === "igdb" && (
                <span className={`indicator-item badge badge-sm aspect-square rounded-full p-0 text-xs font-bold ring-2 ring-base-100 text-white ${igdbExhausted ? "badge-error" : "bg-[#9146FF] border-[#9146FF]"}`}>
                  {igdbRemaining}
                </span>
              )}
              <button
                className={`join-item btn btn-xs ${source === "igdb" ? "text-white border-[#9146FF] bg-[#9146FF] hover:bg-[#7c3ae6]" : "btn-ghost border border-base-300"}`}
                onClick={() => { if (!igdbExhausted) { setSource("igdb"); setResults([]); } }}
                disabled={igdbExhausted}
              >
                <HiGlobe className="w-3.5 h-3.5" /> All Games
              </button>
            </div>
          </div>
        </div>
        <div ref={wrapperRef} className="relative">
          <input
            id="game-search-input"
            type="text"
            className="input input-bordered w-full"
            placeholder="Type a game name (e.g., Cyberpunk 2077)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { setIsFocused(true); results.length > 0 && setIsOpen(true); }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-activedescendant={selectedIndex >= 0 ? `game-option-${selectedIndex}` : undefined}
          />
          {loading ? (
            <span className="loading loading-spinner loading-sm absolute right-3 top-3" />
          ) : !query && !isFocused && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none flex items-center gap-0.5 text-xs">
              <kbd className="kbd kbd-xs">{isMac ? "⌘" : "ctrl"}</kbd>
              <span>+</span>
              <kbd className="kbd kbd-xs">k</kbd>
            </span>
          )}

          {isOpen && results.length > 0 && (
            <div className="bg-base-100 border border-base-300 rounded-box absolute z-50 w-full mt-1 shadow-lg overflow-hidden">
              <ul
                ref={listRef}
                className="flex flex-col max-h-64 overflow-y-auto"
                role="listbox"
              >
                {results.map((game, index) => (
                  <li key={game.id} id={`game-option-${index}`} role="option" aria-selected={index === selectedIndex}>
                    <button
                      className={`flex items-center gap-3 w-full px-3 py-2 text-left transition-colors ${index === selectedIndex ? "bg-primary/20" : "hover:bg-base-200"
                        }`}
                      onClick={() => {
                        setQuery(game.name);
                        setIsOpen(false);
                        setSelectedIndex(-1);
                        onSelect(game.id, game.source || source);
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {game.tiny_image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={game.tiny_image}
                          alt={game.name}
                          className="w-12 h-8 object-contain rounded shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-8 rounded shrink-0 bg-base-300 flex items-center justify-center text-base-content/30 text-xs">?</div>
                      )}
                      <span className="truncate">{game.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-base-content/60 border-t border-base-300 bg-base-200/50">
                <kbd className="kbd kbd-xs">Enter</kbd>
                <HiArrowRight className="w-3 h-3" />
                <span>Select &amp; continue</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
