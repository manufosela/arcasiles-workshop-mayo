import { LitElement, html, css, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { Club } from "../types";

@customElement("club-card")
export class ClubCard extends LitElement {
  @property({ type: Object }) club!: Club;

  static styles = css`
    :host {
      display: block;
      background: var(--paper, #f5efe6);
      border: 1px solid var(--dust, #d8cdbe);
      border-radius: 12px;
      padding: 1.25rem;
      transition:
        transform 0.15s ease,
        box-shadow 0.15s ease,
        border-color 0.15s ease;
      cursor: pointer;
      height: 100%;
      box-sizing: border-box;
    }
    :host(:hover) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(42, 31, 26, 0.08);
      border-color: var(--reading, #3d7d5c);
    }
    a {
      color: inherit;
      text-decoration: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      height: 100%;
    }
    h3 {
      font-family: var(--font-serif, ui-serif, Georgia, serif);
      font-size: 1.25rem;
      margin: 0;
      line-height: 1.25;
      color: var(--ink, #2a1f1a);
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-weight: 500;
      letter-spacing: 0.01em;
    }
    .badge.online {
      background: #e6f0ec;
      color: var(--reading-dark, #2d5d44);
    }
    .badge.presencial {
      background: #f4e8d8;
      color: var(--accent, #c98a3d);
    }
    .badge.hibrido {
      background: #e9e3f4;
      color: #5e4a8a;
    }
    .theme {
      background: transparent;
      border: 1px solid var(--dust, #d8cdbe);
      color: var(--ink-soft, #5c4f47);
    }
    .meta {
      font-size: 0.85rem;
      color: var(--ink-soft, #5c4f47);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-top: auto;
    }
    .description {
      font-size: 0.9rem;
      color: var(--ink-soft, #5c4f47);
      line-height: 1.45;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `;

  private modalityLabel(m: string): string {
    return m === "online"
      ? "💻 online"
      : m === "presencial"
        ? "📍 presencial"
        : "🔄 híbrido";
  }

  render() {
    const c = this.club;
    if (!c) return nothing;
    return html`
      <a href=${`/clubs/${c.id}`}>
        <h3>${c.name}</h3>
        <div class="badges">
          <span class="badge ${c.modality}"
            >${this.modalityLabel(c.modality)}</span
          >
          ${c.themes
            .slice(0, 2)
            .map((t) => html`<span class="badge theme">${t}</span>`)}
        </div>
        <p class="description">${c.description}</p>
        <div class="meta">
          ${c.city
            ? html`<span
                >📌
                ${c.city}${c.neighborhood ? ` · ${c.neighborhood}` : ""}</span
              >`
            : nothing}
          <span>🗓 ${c.meetingFrequency} · 👥 ${c.memberCount} miembros</span>
        </div>
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "club-card": ClubCard;
  }
}
