import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { userRepo } from "../services/userRepo";
import { clubsRepo } from "../services/clubsRepo";
import type { ModalityPreference } from "../types";

@customElement("profile-form")
export class ProfileForm extends LitElement {
  @state() private name = "";
  @state() private genres: string[] = [];
  @state() private modality: ModalityPreference = "ambos";
  @state() private city = "";
  @state() private saved = false;

  static styles = css`
    :host {
      display: block;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-width: 560px;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--ink, #2a1f1a);
    }
    input[type="text"] {
      font: inherit;
      padding: 0.55rem 0.75rem;
      border: 1px solid var(--dust, #d8cdbe);
      border-radius: 8px;
      background: var(--paper, #f5efe6);
      color: var(--ink, #2a1f1a);
    }
    input:focus {
      outline: none;
      border-color: var(--reading, #3d7d5c);
      box-shadow: 0 0 0 3px rgba(61, 125, 92, 0.15);
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .chip {
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      border: 1px solid var(--dust, #d8cdbe);
      cursor: pointer;
      font-size: 0.85rem;
      background: transparent;
      color: var(--ink-soft, #5c4f47);
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .chip[aria-pressed="true"] {
      background: var(--reading, #3d7d5c);
      color: white;
      border-color: var(--reading, #3d7d5c);
    }
    .radios {
      display: flex;
      gap: 1.2rem;
      flex-wrap: wrap;
      font-weight: normal;
    }
    .radios label {
      flex-direction: row;
      align-items: center;
      gap: 0.4rem;
      font-weight: normal;
    }
    button[type="submit"] {
      align-self: flex-start;
      background: var(--reading, #3d7d5c);
      color: white;
      border: none;
      padding: 0.7rem 1.4rem;
      border-radius: 8px;
      cursor: pointer;
      font: inherit;
      font-weight: 500;
      transition: background 0.15s ease;
    }
    button[type="submit"]:hover {
      background: var(--reading-dark, #2d5d44);
    }
    .toast {
      background: #e6f0ec;
      color: var(--reading-dark, #2d5d44);
      padding: 0.6rem 0.9rem;
      border-radius: 8px;
      font-size: 0.9rem;
      border: 1px solid var(--reading, #3d7d5c);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    const u = userRepo.getCurrent();
    this.name = u.name;
    this.genres = [...u.preferredGenres];
    this.modality = u.modalityPreference;
    this.city = u.city ?? "";
  }

  private toggleGenre(g: string) {
    this.genres = this.genres.includes(g)
      ? this.genres.filter((x) => x !== g)
      : [...this.genres, g];
  }

  private save(e: Event) {
    e.preventDefault();
    userRepo.updatePreferences({
      name: this.name.trim() || "Usuario",
      preferredGenres: this.genres,
      modalityPreference: this.modality,
      city: this.city.trim() || undefined,
    });
    this.saved = true;
    setTimeout(() => (this.saved = false), 3000);
    this.dispatchEvent(
      new CustomEvent("profile-saved", { bubbles: true, composed: true }),
    );
  }

  render() {
    const allGenres = clubsRepo.allThemes();
    return html`
      <form @submit=${this.save}>
        <label>
          Nombre
          <input
            type="text"
            .value=${this.name}
            @input=${(e: Event) =>
              (this.name = (e.target as HTMLInputElement).value)}
          />
        </label>
        <label>
          Géneros que te interesan
          <div class="chips">
            ${allGenres.map(
              (g) => html`
                <button
                  type="button"
                  class="chip"
                  aria-pressed=${this.genres.includes(g) ? "true" : "false"}
                  @click=${() => this.toggleGenre(g)}
                >
                  ${g}
                </button>
              `,
            )}
          </div>
        </label>
        <label>
          Modalidad preferida
          <div class="radios">
            ${(["online", "presencial", "ambos"] as ModalityPreference[]).map(
              (m) => html`
                <label>
                  <input
                    type="radio"
                    name="modality"
                    value=${m}
                    .checked=${this.modality === m}
                    @change=${() => (this.modality = m)}
                  />
                  ${m}
                </label>
              `,
            )}
          </div>
        </label>
        <label>
          Ciudad (opcional)
          <input
            type="text"
            .value=${this.city}
            @input=${(e: Event) =>
              (this.city = (e.target as HTMLInputElement).value)}
          />
        </label>
        <button type="submit">Guardar preferencias</button>
        ${this.saved
          ? html`<div class="toast">
              ✓ Preferencias guardadas. Vuelve al directorio para ver el feed
              ajustado.
            </div>`
          : ""}
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "profile-form": ProfileForm;
  }
}
