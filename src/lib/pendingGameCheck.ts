import { Platform } from "@/types";

const STORAGE_KEY = "pendingGameCheck";
const EXPIRATION_DAYS = 7;

interface PendingGame {
  appid: number;
  platform: Platform;
  gameName: string;
  savedAt: string;
}

export function savePendingGame(appid: number, platform: Platform, gameName: string): void {
  const data: PendingGame = {
    appid,
    platform,
    gameName,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getPendingGame(): PendingGame | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data: PendingGame = JSON.parse(raw);

    // Check expiration
    const savedDate = new Date(data.savedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > EXPIRATION_DAYS) {
      clearPendingGame();
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function clearPendingGame(): void {
  localStorage.removeItem(STORAGE_KEY);
}
