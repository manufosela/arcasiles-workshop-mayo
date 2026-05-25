import type { User } from "../types";
import seed from "../data/users.json";

const STORAGE_KEY = "user:current";

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export const userRepo = {
  getCurrent(): User {
    const fallback = (seed as User[])[0];
    if (!isBrowser()) return fallback;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return fallback;
    }
  },
  updatePreferences(patch: Partial<User>): User {
    const current = this.getCurrent();
    const next: User = { ...current, ...patch };
    if (isBrowser()) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return next;
  },
  reset(): void {
    if (isBrowser()) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },
};
