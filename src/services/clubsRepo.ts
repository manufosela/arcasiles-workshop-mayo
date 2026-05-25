import type { Club, Modality, ModalityPreference } from "../types";
import data from "../data/clubs.json";

export interface ClubFilters {
  modality?: Modality;
  theme?: string;
  city?: string;
  preferredGenres?: string[];
  modalityPreference?: ModalityPreference;
}

const ALL = data as Club[];

export const clubsRepo = {
  listAll(): Club[] {
    return ALL;
  },
  getById(id: string): Club | undefined {
    return ALL.find((c) => c.id === id);
  },
  filter(criteria: ClubFilters): Club[] {
    return ALL.filter((c) => {
      if (criteria.modality && c.modality !== criteria.modality) return false;

      if (criteria.theme) {
        const needle = criteria.theme.toLowerCase();
        if (!c.themes.some((t) => t.toLowerCase().includes(needle)))
          return false;
      }

      if (criteria.city) {
        if (!c.city || c.city.toLowerCase() !== criteria.city.toLowerCase())
          return false;
      }

      if (
        criteria.modalityPreference &&
        criteria.modalityPreference !== "ambos"
      ) {
        if (
          criteria.modalityPreference === "online" &&
          c.modality === "presencial"
        )
          return false;
        if (
          criteria.modalityPreference === "presencial" &&
          c.modality === "online"
        )
          return false;
      }

      if (criteria.preferredGenres?.length) {
        const match = c.themes.some((t) =>
          criteria.preferredGenres!.some((g) =>
            t.toLowerCase().includes(g.toLowerCase()),
          ),
        );
        if (!match) return false;
      }

      return true;
    });
  },
  allThemes(): string[] {
    const set = new Set<string>();
    for (const c of ALL) for (const t of c.themes) set.add(t);
    return Array.from(set).sort();
  },
  allCities(): string[] {
    const set = new Set<string>();
    for (const c of ALL) if (c.city) set.add(c.city);
    return Array.from(set).sort();
  },
};
