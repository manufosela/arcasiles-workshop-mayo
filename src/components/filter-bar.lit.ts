import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { clubsRepo, type ClubFilters } from "../services/clubsRepo";
import { userRepo } from "../services/userRepo";
import type { Club, Modality } from "../types";

@customElement("filter-bar")
export class FilterBar extends LitElement {
  @property({ type: Array }) clubs: Club[] = [];

  @state() private modality: Modality | "" = "";
  @state() private theme = "";
  @state() private city = "";
  @state() private applyProfile = true;

  static styles = css`
    :host {
      display: block;
      background: rgba(216, 205, 190, 0.25);
      border: 1px solid var(--dust, #d8cdbe);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }
    .row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.85rem;
      align-items: end;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: var(--ink-soft, #5c4f47);
      font-weight: 500;
    }
    select,
    input {
      font: inherit;
      font-size: 0.95rem;
      padding: 0.5rem 0.65rem;
      border: 1px solid var(--dust, #d8cdbe);
      border-radius: 8px;
      background: var(--paper, #f5efe6);
      color: var(--ink, #2a1f1a);
    }
    select:focus,
    input:focus {
      outline: none;
      border-color: var(--reading, #3d7d5c);
      box-shadow: 0 0 0 3px rgba(61, 125, 92, 0.15);
    }
    .toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--ink-soft, #5c4f47);
      cursor: pointer;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.85rem;
      flex-wrap: wrap;
      align-items: center;
    }
    button {
      font: inherit;
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid var(--dust, #d8cdbe);
      background: transparent;
      color: var(--ink, #2a1f1a);
      transition: all 0.15s ease;
    }
    button:hover {
      border-color: var(--reading, #3d7d5c);
      color: var(--reading, #3d7d5c);
    }
    .count {
      margin-left: auto;
      font-size: 0.85rem;
      color: var(--ink-soft, #5c4f47);
    }
    .count strong {
      color: var(--reading, #3d7d5c);
      font-size: 1rem;
    }
  `;

  private fireFilters() {
    const user = userRepo.getCurrent();
    const criteria: ClubFilters = {};
    if (this.modality) criteria.modality = this.modality;
    if (this.theme) criteria.theme = this.theme;
    if (this.city) criteria.city = this.city;
    if (this.applyProfile) {
      criteria.modalityPreference = user.modalityPreference;
      criteria.preferredGenres = user.preferredGenres;
    }
    const filtered = clubsRepo.filter(criteria);
    this.dispatchEvent(
      new CustomEvent("filters-changed", {
        detail: { clubs: filtered, criteria },
        bubbles: true,
        composed: true,
      }),
    );
  }

  connectedCallback(): void {
    super.connectedCallback();
    queueMicrotask(() => this.fireFilters());
  }

  protected updated(changed: Map<string, unknown>): void {
    if (
      changed.has("modality") ||
      changed.has("theme") ||
      changed.has("city") ||
      changed.has("applyProfile")
    ) {
      this.fireFilters();
    }
  }

  private clear() {
    this.modality = "";
    this.theme = "";
    this.city = "";
  }

  render() {
    const themes = clubsRepo.allThemes();
    const cities = clubsRepo.allCities();
    return html`
      <div class="row">
        <label>
          Modalidad
          <select
            @change=${(e: Event) =>
              (this.modality = (e.target as HTMLSelectElement).value as
                | Modality
                | "")}
          >
            <option value="">Todas</option>
            <option value="online" ?selected=${this.modality === "online"}>
              Online
            </option>
            <option
              value="presencial"
              ?selected=${this.modality === "presencial"}
            >
              Presencial
            </option>
            <option value="hibrido" ?selected=${this.modality === "hibrido"}>
              Híbrido
            </option>
          </select>
        </label>
        <label>
          Temática
          <select
            @change=${(e: Event) =>
              (this.theme = (e.target as HTMLSelectElement).value)}
          >
            <option value="">Cualquiera</option>
            ${themes.map(
              (t) =>
                html`<option value=${t} ?selected=${this.theme === t}>
                  ${t}
                </option>`,
            )}
          </select>
        </label>
        <label>
          Ciudad
          <select
            @change=${(e: Event) =>
              (this.city = (e.target as HTMLSelectElement).value)}
          >
            <option value="">Cualquiera</option>
            ${cities.map(
              (c) =>
                html`<option value=${c} ?selected=${this.city === c}>
                  ${c}
                </option>`,
            )}
          </select>
        </label>
      </div>
      <div class="actions">
        <label class="toggle">
          <input
            type="checkbox"
            .checked=${this.applyProfile}
            @change=${(e: Event) =>
              (this.applyProfile = (e.target as HTMLInputElement).checked)}
          />
          Aplicar mis preferencias del perfil
        </label>
        <button @click=${this.clear}>Limpiar filtros</button>
        <span class="count"
          >Mostrando <strong id="count-out"></strong> de
          ${this.clubs.length}</span
        >
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "filter-bar": FilterBar;
  }
}
