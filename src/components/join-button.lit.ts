import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { membershipRepo } from "../services/membershipRepo";
import { userRepo } from "../services/userRepo";
import type { RequestStatus } from "../types";

@customElement("join-button")
export class JoinButton extends LitElement {
  @property({ attribute: "clubid" }) clubId = "";
  @state() private status: RequestStatus = "none";

  static styles = css`
    :host {
      display: inline-flex;
    }
    button {
      background: var(--reading, #3d7d5c);
      color: white;
      border: none;
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      font: inherit;
      font-weight: 500;
      font-size: 0.95rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: background 0.15s ease;
    }
    button:hover:not(:disabled) {
      background: var(--reading-dark, #2d5d44);
    }
    button:disabled {
      cursor: default;
    }
    button.pending {
      background: var(--accent, #c98a3d);
    }
    button.accepted {
      background: #4a8a5e;
    }
    button.rejected {
      background: var(--error, #b85c5c);
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 1.4s infinite;
    }
    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.35;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    const me = userRepo.getCurrent();
    this.status = membershipRepo.getStatus(this.clubId, me.id);
  }

  private request() {
    const me = userRepo.getCurrent();
    membershipRepo.requestJoin(this.clubId, me.id);
    this.status = "pending";
    setTimeout(() => {
      const decision: "accepted" | "rejected" =
        Math.random() < 0.75 ? "accepted" : "rejected";
      membershipRepo.resolve(this.clubId, me.id, decision);
      this.status = decision;
    }, 3000);
  }

  render() {
    switch (this.status) {
      case "pending":
        return html`<button class="pending" disabled>
          <span class="dot"></span>Solicitud enviada…
        </button>`;
      case "accepted":
        return html`<button class="accepted" disabled>
          ✓ ¡Eres miembro!
        </button>`;
      case "rejected":
        return html`<button class="rejected" disabled>
          Solicitud rechazada
        </button>`;
      default:
        return html`<button @click=${this.request}>
          ✋ Solicitar unirme
        </button>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "join-button": JoinButton;
  }
}
