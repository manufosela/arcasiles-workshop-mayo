import type { Suggestion } from "../types";
import data from "../data/suggestions.json";

type SuggestionMap = Record<string, Suggestion[]>;
const ALL = data as SuggestionMap;

export const suggestionsRepo = {
  getForUser(userId: string): Suggestion[] {
    return ALL[userId] ?? [];
  },
};
