import type { MembershipRequest, RequestStatus } from "../types";

const STORAGE_KEY = "memberships:current";

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function loadAll(): MembershipRequest[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as MembershipRequest[]) : [];
}

function saveAll(items: MembershipRequest[]): void {
  if (isBrowser())
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const membershipRepo = {
  requestJoin(clubId: string, userId: string): MembershipRequest {
    const all = loadAll();
    const existing = all.find(
      (r) => r.clubId === clubId && r.userId === userId,
    );
    if (existing) return existing;
    const req: MembershipRequest = {
      clubId,
      userId,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };
    saveAll([...all, req]);
    return req;
  },
  getStatus(clubId: string, userId: string): RequestStatus {
    const all = loadAll();
    return (
      all.find((r) => r.clubId === clubId && r.userId === userId)?.status ??
      "none"
    );
  },
  resolve(
    clubId: string,
    userId: string,
    status: "accepted" | "rejected",
  ): MembershipRequest | undefined {
    const all = loadAll();
    const idx = all.findIndex(
      (r) => r.clubId === clubId && r.userId === userId,
    );
    if (idx < 0) return undefined;
    all[idx] = { ...all[idx], status };
    saveAll(all);
    return all[idx];
  },
};
