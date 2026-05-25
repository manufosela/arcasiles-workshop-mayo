import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { booksRepo } from "../services/booksRepo";

@customElement("book-history")
export class BookHistory extends LitElement {
  @property({ attribute: "bookids" }) bookIds = "";

  static styles = css`
    :host {
      display: block;
    }
    .shelf {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }
    .book {
      background: var(--paper, #f5efe6);
      border: 1px solid var(--dust, #d8cdbe);
      border-radius: 10px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition:
        transform 0.15s ease,
        border-color 0.15s ease;
    }
    .book:hover {
      transform: translateY(-2px);
      border-color: var(--reading, #3d7d5c);
    }
    .cover {
      aspect-ratio: 2 / 3;
      background: linear-gradient(
        135deg,
        var(--reading-dark, #2d5d44),
        var(--reading, #3d7d5c)
      );
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: var(--font-serif, ui-serif, Georgia, serif);
      font-size: 2.5rem;
      opacity: 0.85;
    }
    .title {
      font-family: var(--font-serif, ui-serif, Georgia, serif);
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.25;
      color: var(--ink, #2a1f1a);
    }
    .author {
      font-size: 0.8rem;
      color: var(--ink-soft, #5c4f47);
    }
    .rating {
      display: flex;
      gap: 0.15rem;
      align-items: center;
      font-size: 0.85rem;
      color: var(--accent, #c98a3d);
    }
    .rating .value {
      color: var(--ink-soft, #5c4f47);
      margin-left: 0.3rem;
      font-size: 0.75rem;
    }
    .empty {
      color: var(--ink-soft, #5c4f47);
      font-style: italic;
      padding: 1rem 0;
    }
  `;

  private renderStars(rating: number) {
    const full = Math.floor(rating);
    const empty = 5 - full;
    return html`
      ${Array.from({ length: full }, () => "★").join("")}${Array.from(
        { length: empty },
        () => "☆",
      ).join("")}
      <span class="value">${rating.toFixed(1)}</span>
    `;
  }

  private getInitial(title: string): string {
    return title.trim().charAt(0).toUpperCase() || "·";
  }

  render() {
    const ids = this.bookIds.split(",").filter(Boolean);
    const books = booksRepo.getMany(ids);

    if (!books.length) {
      return html`<p class="empty">
        Este club aún no tiene historial de lecturas.
      </p>`;
    }

    return html`
      <div class="shelf">
        ${books.map(
          (b) => html`
            <div class="book">
              <div class="cover">${this.getInitial(b.title)}</div>
              <div class="title">${b.title}</div>
              <div class="author">
                ${b.author}${b.year ? ` · ${b.year}` : ""}
              </div>
              <div class="rating">
                ${this.renderStars(booksRepo.averageRating(b.id))}
              </div>
            </div>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "book-history": BookHistory;
  }
}
