export type ModalityPreference = "online" | "presencial" | "ambos";

export interface User {
  id: string;
  name: string;
  preferredGenres: string[];
  modalityPreference: ModalityPreference;
  city?: string;
}
