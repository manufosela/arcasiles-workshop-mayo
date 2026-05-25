import type { Book } from "../types";
import data from "../data/books.json";

const ALL = data as Book[];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export const booksRepo = {
  getById(id: string): Book | undefined {
    return ALL.find((b) => b.id === id);
  },
  getMany(ids: string[]): Book[] {
    return ids
      .map((id) => this.getById(id))
      .filter((b): b is Book => Boolean(b));
  },
  averageRating(bookId: string): number {
    const seed = hash(bookId);
    return 3 + (seed % 200) / 100;
  },
};
