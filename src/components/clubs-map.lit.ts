import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { clubsRepo } from "../services/clubsRepo";
import type { Club } from "../types";

@customElement("clubs-map")
export class ClubsMap extends LitElement {
  @property({ type: Array }) clubs: Club[] = [];

  private map?: any;
  private L?: any;
  private markers: any[] = [];

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 520px;
      border: 1px solid var(--dust, #d8cdbe);
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }
    .map {
      width: 100%;
      height: 100%;
    }
    .loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--ink-soft, #5c4f47);
      font-size: 0.9rem;
      background: var(--paper, #f5efe6);
      z-index: 1;
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
    // Dynamic imports (client-only — Leaflet uses window)
    const leafletModule = await import("leaflet");
    const L = leafletModule.default ?? leafletModule;
    this.L = L;

    // Inline Leaflet CSS into shadow DOM via constructable stylesheet
    const cssText = (await import("leaflet/dist/leaflet.css?inline")).default;
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssText);
    (this.renderRoot as ShadowRoot).adoptedStyleSheets = [
      ...(this.renderRoot as ShadowRoot).adoptedStyleSheets,
      sheet,
    ];

    // Vite-resolved icon URLs (default markers break otherwise)
    const iconUrl = (await import("leaflet/dist/images/marker-icon.png"))
      .default;
    const iconRetinaUrl = (
      await import("leaflet/dist/images/marker-icon-2x.png")
    ).default;
    const shadowUrl = (await import("leaflet/dist/images/marker-shadow.png"))
      .default;

    // @ts-expect-error — Leaflet default icon path override
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl,
      iconRetinaUrl,
      shadowUrl,
    });

    const root = this.renderRoot.querySelector(".map") as HTMLDivElement;
    if (!root) return;

    this.map = L.map(root).setView([40.4168, -3.7038], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(this.map);

    // Hide loading once map is ready
    const loading = this.renderRoot.querySelector(
      ".loading",
    ) as HTMLElement | null;
    if (loading) loading.style.display = "none";

    this.refreshMarkers();

    // Force resize after init (shadow DOM sometimes confuses Leaflet's size detection)
    requestAnimationFrame(() => this.map?.invalidateSize());
  }

  // Public — call from outside when the container becomes visible
  invalidateSize() {
    requestAnimationFrame(() => {
      this.map?.invalidateSize();
      if (this.markers.length > 1) {
        const bounds = this.markers.map((m: any) => m.getLatLng());
        this.map?.fitBounds(bounds, { padding: [40, 40] });
      }
    });
  }

  private refreshMarkers() {
    if (!this.map || !this.L) return;
    const L = this.L;

    // Remove previous markers
    for (const m of this.markers) {
      this.map.removeLayer(m);
    }
    this.markers = [];

    const source = this.clubs.length ? this.clubs : clubsRepo.listAll();
    const withCoords = source.filter((c) => c.coords);

    if (!withCoords.length) return;

    const bounds: [number, number][] = [];
    for (const c of withCoords) {
      const m = L.marker([c.coords!.lat, c.coords!.lng]).addTo(this.map);
      m.bindPopup(
        `<strong>${c.name}</strong><br/>${c.city ?? ""}${c.neighborhood ? ` · ${c.neighborhood}` : ""}<br/><a href="/clubs/${c.id}">Ver detalle →</a>`,
      );
      this.markers.push(m);
      bounds.push([c.coords!.lat, c.coords!.lng]);
    }

    if (bounds.length > 1) {
      this.map.fitBounds(bounds, { padding: [40, 40] });
    } else if (bounds.length === 1) {
      this.map.setView(bounds[0], 13);
    }
  }

  render() {
    return html`
      <div class="map"></div>
      <div class="loading">Cargando mapa…</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "clubs-map": ClubsMap;
  }
}
