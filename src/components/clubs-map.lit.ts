import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { clubsRepo } from "../services/clubsRepo";
import type { Club } from "../types";

@customElement("clubs-map")
export class ClubsMap extends LitElement {
  @property({ type: Array }) clubs: Club[] = [];

  private mapRef?: HTMLDivElement;
  private map?: any;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 520px;
      border: 1px solid var(--dust, #d8cdbe);
      border-radius: 12px;
      overflow: hidden;
    }
    .map {
      width: 100%;
      height: 100%;
    }
    .empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--ink-soft, #5c4f47);
      padding: 2rem;
      text-align: center;
    }
  `;

  firstUpdated() {
    this.initMap();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("clubs") && this.map) {
      this.refreshMarkers();
    }
  }

  private async initMap() {
    const L = await import("leaflet");
    await import("leaflet/dist/leaflet.css");

    const root = this.renderRoot.querySelector(".map") as HTMLDivElement;
    if (!root) return;
    this.mapRef = root;

    this.map = L.map(root).setView([40.4168, -3.7038], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(this.map);

    this.refreshMarkers();
  }

  private refreshMarkers() {
    if (!this.map) return;
    const L = (window as any).L;
    if (!L) return;

    this.map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) this.map.removeLayer(layer);
    });

    const source = this.clubs.length ? this.clubs : clubsRepo.listAll();
    const withCoords = source.filter((c) => c.coords);

    if (!withCoords.length) return;

    const bounds: [number, number][] = [];
    for (const c of withCoords) {
      const m = L.marker([c.coords!.lat, c.coords!.lng]).addTo(this.map);
      m.bindPopup(
        `<strong>${c.name}</strong><br/>${c.city ?? ""}${c.neighborhood ? ` · ${c.neighborhood}` : ""}<br/><a href="/clubs/${c.id}">Ver detalle →</a>`,
      );
      bounds.push([c.coords!.lat, c.coords!.lng]);
    }

    if (bounds.length > 1) {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      this.map.setView(bounds[0], 13);
    }
  }

  render() {
    return html`<div class="map"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "clubs-map": ClubsMap;
  }
}
