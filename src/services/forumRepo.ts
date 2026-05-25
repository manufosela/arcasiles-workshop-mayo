import type { Message } from "../types";
import seed from "../data/messages.json";

const STORAGE_KEY = (clubId: string) => `forum:${clubId}`;

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export const forumRepo = {
  getMessages(clubId: string): Message[] {
    const fromSeed = (seed as Message[]).filter((m) => m.clubId === clubId);
    if (!isBrowser()) return fromSeed;
    const raw = window.localStorage.getItem(STORAGE_KEY(clubId));
    const local: Message[] = raw ? JSON.parse(raw) : [];
    return [...fromSeed, ...local].sort((a, b) =>
      a.postedAt.localeCompare(b.postedAt),
    );
  },
  postMessage(clubId: string, authorName: string, body: string): Message {
    const msg: Message = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clubId,
      authorName,
      body,
      postedAt: new Date().toISOString(),
    };
    if (isBrowser()) {
      const raw = window.localStorage.getItem(STORAGE_KEY(clubId));
      const arr: Message[] = raw ? JSON.parse(raw) : [];
      arr.push(msg);
      window.localStorage.setItem(STORAGE_KEY(clubId), JSON.stringify(arr));
    }
    return msg;
  },
};
