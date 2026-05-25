import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { forumRepo } from "../services/forumRepo";
import { userRepo } from "../services/userRepo";
import type { Message } from "../types";

@customElement("club-forum")
export class ClubForum extends LitElement {
  @property({ attribute: "clubid" }) clubId = "";
  @state() private messages: Message[] = [];
  @state() private draft = "";

  static styles = css`
    :host {
      display: block;
      background: rgba(216, 205, 190, 0.18);
      border: 1px solid var(--dust, #d8cdbe);
      border-radius: 12px;
      padding: 1rem 1.25rem;
    }
    .messages {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      margin-bottom: 1rem;
      max-height: 320px;
      overflow-y: auto;
    }
    .msg {
      background: var(--paper, #f5efe6);
      border-radius: 10px;
      padding: 0.7rem 0.9rem;
      border: 1px solid var(--dust, #d8cdbe);
    }
    .msg header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.3rem;
    }
    .author {
      font-weight: 600;
      color: var(--reading, #3d7d5c);
      font-size: 0.9rem;
    }
    .when {
      font-size: 0.75rem;
      color: var(--ink-soft, #5c4f47);
    }
    .body {
      font-size: 0.95rem;
      line-height: 1.45;
      color: var(--ink, #2a1f1a);
    }
    .empty {
      color: var(--ink-soft, #5c4f47);
      font-style: italic;
      font-size: 0.9rem;
      padding: 1rem 0;
    }
    form {
      display: flex;
      gap: 0.5rem;
    }
    textarea {
      flex: 1;
      font: inherit;
      padding: 0.55rem 0.75rem;
      border: 1px solid var(--dust, #d8cdbe);
      border-radius: 8px;
      resize: vertical;
      min-height: 2.5rem;
      background: var(--paper, #f5efe6);
      color: var(--ink, #2a1f1a);
    }
    textarea:focus {
      outline: none;
      border-color: var(--reading, #3d7d5c);
      box-shadow: 0 0 0 3px rgba(61, 125, 92, 0.15);
    }
    button {
      background: var(--reading, #3d7d5c);
      color: white;
      border: none;
      padding: 0.55rem 1.1rem;
      border-radius: 8px;
      cursor: pointer;
      font: inherit;
      font-weight: 500;
      align-self: flex-end;
      white-space: nowrap;
    }
    button:hover {
      background: var(--reading-dark, #2d5d44);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.reload();
  }

  private reload() {
    this.messages = forumRepo.getMessages(this.clubId);
  }

  private formatWhen(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  private submit(e: Event) {
    e.preventDefault();
    const body = this.draft.trim();
    if (!body) return;
    const me = userRepo.getCurrent();
    forumRepo.postMessage(this.clubId, me.name, body);
    this.draft = "";
    this.reload();
  }

  render() {
    return html`
      <div class="messages">
        ${this.messages.length === 0
          ? html`<p class="empty">
              Aún no hay mensajes. ¡Sé el primero en escribir!
            </p>`
          : this.messages.map(
              (m) => html`
                <article class="msg">
                  <header>
                    <span class="author">${m.authorName}</span>
                    <span class="when">${this.formatWhen(m.postedAt)}</span>
                  </header>
                  <p class="body">${m.body}</p>
                </article>
              `,
            )}
      </div>
      <form @submit=${this.submit}>
        <textarea
          placeholder="Escribe un mensaje al club…"
          .value=${this.draft}
          @input=${(e: Event) =>
            (this.draft = (e.target as HTMLTextAreaElement).value)}
        ></textarea>
        <button type="submit" ?disabled=${!this.draft.trim()}>Enviar</button>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "club-forum": ClubForum;
  }
}
