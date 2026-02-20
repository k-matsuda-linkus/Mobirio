const RECENT_KEY = "vendor-recent-pages";
const PINNED_KEY = "vendor-pinned-pages";
const MAX_RECENT = 5;

export function getRecentPages(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function addRecentPage(path: string): void {
  if (typeof window === "undefined") return;
  try {
    const pages = getRecentPages().filter((p) => p !== path);
    pages.unshift(path);
    localStorage.setItem(RECENT_KEY, JSON.stringify(pages.slice(0, MAX_RECENT)));
  } catch {
    // localStorage unavailable
  }
}

export function getPinnedPages(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function togglePinPage(path: string): void {
  if (typeof window === "undefined") return;
  try {
    const pages = getPinnedPages();
    const idx = pages.indexOf(path);
    if (idx >= 0) {
      pages.splice(idx, 1);
    } else {
      pages.push(path);
    }
    localStorage.setItem(PINNED_KEY, JSON.stringify(pages));
  } catch {
    // localStorage unavailable
  }
}
