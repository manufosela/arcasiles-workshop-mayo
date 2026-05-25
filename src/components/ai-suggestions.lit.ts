import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import { suggestionsRepo } from "../services/suggestionsRepo";
import { userRepo } from "../services/userRepo";
import { clubsRepo } from "../services/clubsRepo";

@customElement("ai-suggestions")
export class AISuggestions extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: linear-gradient(135deg, #f4e8d8 0%, #e9e3f4 100%);
      border: 1px solid var(--dust, #d8cdbe);
      border-radius: 12px;
      padding: 1.25rem;
    }
    header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.85rem;
    }
    h3 {
      font-family: var(--font-serif, ui-serif, Georgia, serif);
      margin: 0;
      font-size: 1.1rem;
      color: var(--ink, #2a1f1a);
    }
    .badge {
      font-size: 0.7rem;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: rgba(94, 74, 138, 0.15);
      color: #5e4a8a;
      font-weight: 500;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    li a {
      display: block;
      background: rgba(255, 255, 255, 0.55);
      border: 1px solid rgba(216, 205, 190, 0.6);
      border-radius: 10px;
      padding: 0.7rem 0.9rem;
      text-decoration: none;
      color: inherit;
      transition: all 0.15s ease;
    }
    li a:hover {
      background: white;
      border-color: var(--reading, #3d7d5c);
      transform: translateX(2px);
    }
    .club-name {
      font-family: var(--font-serif, ui-serif, Georgia, serif);
      font-weight: 600;
      color: var(--ink, #2a1f1a);
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem;
    }
    .confidence {
      font-size: 0.75rem;
      color: var(--ink-soft, #5c4f47);
      font-weight: normal;
    }
    .reason {
      font-size: 0.85rem;
      font-style: italic;
      color: var(--ink-soft, #5c4f47);
      margin-top: 0.3rem;
      line-height: 1.45;
    }
    .empty {
      color: var(--ink-soft, #5c4f47);
      font-size: 0.9rem;
    }
  `;

  render() {
    const me = userRepo.getCurrent();
    const suggestions = suggestionsRepo.getForUser(me.id);

    if (!suggestions.length) {
      return html`
        <header>
          <span>✨</span>
          <h3>Sugerencias para ti</h3>
          <span class="badge">Sugerido por IA</span>
        </header>
        <p class="empty">
          Configura tu perfil para recibir sugerencias personalizadas.
        </p>
      `;
    }

    return html`
      <header>
        <span>✨</span>
        <h3>Sugerencias para ti</h3>
        <span class="badge">Sugerido por IA</span>
      </header>
      <ul>
        ${suggestions.map((s) => {
          const club = clubsRepo.getById(s.clubId);
          if (!club) return html``;
          return html`
            <li>
              <a href=${`/clubs/${club.id}`}>
                <div class="club-name">
                  <span>${club.name}</span>
                  <span class="confidence"
                    >${Math.round(s.confidence * 100)}% match</span
                  >
                </div>
                <div class="reason">"${s.reason}"</div>
              </a>
            </li>
          `;
        })}
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ai-suggestions": AISuggestions;
  }
}
