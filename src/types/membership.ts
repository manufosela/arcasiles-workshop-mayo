export type RequestStatus = "none" | "pending" | "accepted" | "rejected";

export interface MembershipRequest {
  clubId: string;
  userId: string;
  status: RequestStatus;
  requestedAt?: string;
}
