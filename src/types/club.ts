export type Modality = "online" | "presencial" | "hibrido";

export interface Club {
  id: string;
  name: string;
  modality: Modality;
  themes: string[];
  city?: string;
  neighborhood?: string;
  meetingFrequency: string;
  memberCount: number;
  description: string;
  currentBookId?: string;
  pastBookIds: string[];
  activeMemberIds: string[];
  coords?: { lat: number; lng: number };
}
