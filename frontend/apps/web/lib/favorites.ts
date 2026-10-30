"use client";

import { useSyncExternalStore } from "react";

/**
 * Rooms and buildings the visitor hearted, kept in this browser so it works without signing in.
 * Keys look like "room:<id>" or "project:<id>", newest first.
 */
const STORAGE_KEY = "tthome:favorites:v1";
const EMPTY: string[] = [];

const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: string[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private windows may refuse storage; the hearts still work until the tab closes.
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changed the list.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cache = null;
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export { favoriteKey } from "./favorite-key";

export function toggleFavorite(key: string) {
  const list = read();
  write(list.includes(key) ? list.filter((k) => k !== key) : [key, ...list]);
}

export function removeFavorite(key: string) {
  write(read().filter((k) => k !== key));
}

/** Every saved key; empty on the server and until the page has loaded in the browser. */
export function useFavorites(): string[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useIsFavorite(key: string): boolean {
  return useFavorites().includes(key);
}

/** For tests: forget the cached list so the next read comes from storage. */
export function resetFavoritesCache() {
  cache = null;
}
