---
spec: spec-001
pipeline: full
status: approved
execution_route:
  version: 1
  spec: spec-001
  executor: autopilot
  automation: dispatch_parallel_waves
  concern_count: 8
  estimated_files: 30
  reason: "Multi-concern delivery (8 paralelizable features sobre contract-first). >10 ficheros. /ai-autopilot orquesta sub-specs en waves con worktrees aislados."
  safe_next_command: "/ai-autopilot"
---

# Plan — App de clubes de lectura (Reto B workshop)

## Architecture

**Pattern**: Hexagonal Architecture + Repository (§10.8). Cada entidad expone un puerto en `src/services/<entity>Repo.ts` con interfaz pública. Los adapters concretos son JSON estáticos en `src/data/*.json`. Los componentes (Astro pages + Lit components) consumen solo el puerto — nunca leen JSON directamente. Esto desacopla la fuente de datos y permite features 100% paralelas en Fase 2 sobre un contrato fijado en Fase 1.

## Design

Diseño visual improvisado, sin assets externos:

- **Paleta**: `paper #f5efe6` (fondo), `reading #3d7d5c` (acento principal), `ink #2a1f1a` (texto), `dust #d8cdbe` (bordes/separadores), `error #b85c5c`.
- **Tipografía**: `ui-serif` para títulos de libros y nombres de clubs, `ui-sans-serif` para UI (filtros, botones, navegación).
- **Layout**: header sticky con nav (Directorio / Mi perfil), grid responsive de cards (3 cols desktop, 1 col mobile), página de detalle con secciones colapsables.
- **Microinteracciones**: hover lift en cards, transición suave de filtros, badge de modalidad (online/presencial) con color distinto.

`--skip-design` no usado; diseño es explícito y mínimo.

## Phases

### Fase 0 — Configuración del repo (secuencial, ~3 min)

- [ ] **T-01** — Añadir `typescript` a `manifest.yml > providers.stacks`
- Agent: build
- Files: `.ai-engineering/manifest.yml:18`
- Principles applied: §10.6 SDD
- Patch (deterministic):
```diff
 providers:
   vcs: github
   stacks:
-  - python
+  - python
+  - typescript
```
- Gate: `ai-eng doctor --check stack-drift` reporta PASS o WARN aceptable

- [ ] **T-02** — Scaffold Astro 5 + Tailwind v4 + Lit
- Agent: build
- Files: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/env.d.ts`
- Principles applied: §10.2 YAGNI (configuración mínima viable)
- Patch (deterministic): N/A — scaffold por CLI. Comandos:
  - `npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git --skip-houston`
  - `npm install`
  - `npx astro add tailwind --yes`
  - `npx astro add lit --yes`
  - `npm install leaflet @types/leaflet`
- Gate: `npm run dev` arranca sin errores, sirve en localhost:4321

- [ ] **T-03** — Configurar paleta editorial en Tailwind v4
- Agent: build
- Files: `src/styles/globals.css`
- Principles applied: §10.7 Clean Code (tokens centralizados)
- Patch (deterministic):
```diff
+@theme {
+  --color-paper: #f5efe6;
+  --color-reading: #3d7d5c;
+  --color-ink: #2a1f1a;
+  --color-dust: #d8cdbe;
+  --color-error: #b85c5c;
+  --font-serif: ui-serif, Georgia, serif;
+  --font-sans: ui-sans-serif, system-ui, sans-serif;
+}
+
+body {
+  background: var(--color-paper);
+  color: var(--color-ink);
+  font-family: var(--font-sans);
+}
```
- Gate: build verde + visual inspection del fondo paper

### Fase 1 — Contratos + Mocks (secuencial, ~10 min)

**Gate de fase**: ningún componente UI puede importar de `src/data/*.json` directamente. Todo va por `src/services/`.

- [ ] **T-10** — Tipos compartidos (`src/types/`)
- Agent: build
- Files: `src/types/club.ts`, `src/types/user.ts`, `src/types/book.ts`, `src/types/message.ts`, `src/types/membership.ts`, `src/types/suggestion.ts`, `src/types/index.ts`
- Principles applied: §10.3 SOLID (interface segregation), §10.8 Hexagonal (puertos tipados)
- Patch (deterministic):
```typescript
// src/types/club.ts
export type Modality = 'online' | 'presencial' | 'hibrido';
export interface Club {
  id: string;
  name: string;
  modality: Modality;
  themes: string[];           // ej. ['literatura latinoamericana', 'novela']
  city?: string;              // requerido si modality !== 'online'
  neighborhood?: string;
  meetingFrequency: string;   // ej. 'quincenal', 'mensual'
  memberCount: number;
  description: string;
  currentBookId?: string;
  pastBookIds: string[];
  activeMemberIds: string[];
  coords?: { lat: number; lng: number }; // requerido si presencial
}

// src/types/user.ts
export type ModalityPreference = 'online' | 'presencial' | 'ambos';
export interface User {
  id: string;
  name: string;
  preferredGenres: string[];
  modalityPreference: ModalityPreference;
  city?: string;
}

// src/types/book.ts
export interface Book {
  id: string;
  title: string;
  author: string;
  year?: number;
}

// src/types/message.ts (foro)
export interface Message {
  id: string;
  clubId: string;
  authorName: string;
  body: string;
  postedAt: string; // ISO
}

// src/types/membership.ts
export type RequestStatus = 'none' | 'pending' | 'accepted' | 'rejected';
export interface MembershipRequest {
  clubId: string;
  userId: string;
  status: RequestStatus;
  requestedAt?: string;
}

// src/types/suggestion.ts
export interface Suggestion {
  clubId: string;
  reason: string;
  confidence: number; // 0-1
}

// src/types/index.ts (barrel)
export * from './club';
export * from './user';
export * from './book';
export * from './message';
export * from './membership';
export * from './suggestion';
```
- Gate: `tsc --noEmit` pasa

- [ ] **T-11** — Seed JSON data (`src/data/`)
- Agent: build (synthesis)
- Files: `src/data/clubs.json`, `src/data/users.json`, `src/data/books.json`, `src/data/messages.json`, `src/data/memberships.json`, `src/data/suggestions.json`
- Principles applied: §10.5 TDD (datos de prueba como contract examples)
- Patch (deterministic): N/A — synthesis. Requisitos:
  - `clubs.json`: ≥12 clubs, mix online/presencial/híbrido, ≥3 con `modality: 'presencial'` + `city: 'Madrid'` + `themes` incluyendo `'literatura latinoamericana'` (para satisfacer criterio de demo del workshop). Coords reales aproximadas de Madrid para presenciales (40.4-40.5 lat, -3.6 a -3.8 lng).
  - `users.json`: 1 usuario demo (`id: 'demo-1'`, preferredGenres con géneros que matcheen al menos 2 clubs).
  - `books.json`: 20-30 libros, incluyendo clásicos latinoamericanos (Cortázar, García Márquez, Bolaño, Vallejo, Lispector…).
  - `messages.json`: 3-5 mensajes por club, autores variados, timestamps realistas.
  - `memberships.json`: vacío inicialmente `[]` o con 1-2 entries de demo.
  - `suggestions.json`: 5 sugerencias para `demo-1` con reasons en español.
- Gate: `ai-eng spec verify` no falla por refs rotas; 3+ clubs matchean filtro "presencial Madrid + literatura latinoamericana"

- [ ] **T-12** — Repositorios (`src/services/`)
- Agent: build
- Files: `src/services/clubsRepo.ts`, `src/services/userRepo.ts`, `src/services/booksRepo.ts`, `src/services/forumRepo.ts`, `src/services/membershipRepo.ts`, `src/services/suggestionsRepo.ts`
- Principles applied: §10.8 Hexagonal Architecture, §10.4 DRY
- Patch (deterministic):
```typescript
// src/services/clubsRepo.ts
import type { Club, Modality } from '../types';
import data from '../data/clubs.json';

export interface ClubFilters {
  modality?: Modality;
  theme?: string;
  city?: string;
  preferredGenres?: string[];
  modalityPreference?: 'online' | 'presencial' | 'ambos';
}

export const clubsRepo = {
  listAll(): Club[] {
    return data as Club[];
  },
  getById(id: string): Club | undefined {
    return (data as Club[]).find((c) => c.id === id);
  },
  filter(criteria: ClubFilters): Club[] {
    return (data as Club[]).filter((c) => {
      if (criteria.modality && c.modality !== criteria.modality) return false;
      if (criteria.theme && !c.themes.some((t) => t.toLowerCase().includes(criteria.theme!.toLowerCase()))) return false;
      if (criteria.city && c.city?.toLowerCase() !== criteria.city.toLowerCase()) return false;
      if (criteria.modalityPreference && criteria.modalityPreference !== 'ambos') {
        if (c.modality !== criteria.modalityPreference) return false;
      }
      if (criteria.preferredGenres?.length) {
        const match = c.themes.some((t) => criteria.preferredGenres!.some((g) => t.toLowerCase().includes(g.toLowerCase())));
        if (!match) return false;
      }
      return true;
    });
  },
};

// src/services/userRepo.ts
import type { User } from '../types';
import seed from '../data/users.json';

const STORAGE_KEY = 'user:current';

export const userRepo = {
  getCurrent(): User {
    if (typeof window === 'undefined') return (seed as User[])[0];
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : (seed as User[])[0];
  },
  updatePreferences(patch: Partial<User>): User {
    const current = this.getCurrent();
    const next = { ...current, ...patch };
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return next;
  },
};

// src/services/booksRepo.ts
import type { Book } from '../types';
import data from '../data/books.json';

export const booksRepo = {
  getById(id: string): Book | undefined {
    return (data as Book[]).find((b) => b.id === id);
  },
  getMany(ids: string[]): Book[] {
    return ids.map((id) => this.getById(id)).filter(Boolean) as Book[];
  },
  averageRating(_bookId: string): number {
    // Mock: rating derivado del hash del id para coherencia visual
    return 3 + Math.random() * 2;
  },
};

// src/services/forumRepo.ts (lectura: JSON + escritura: localStorage)
import type { Message } from '../types';
import seed from '../data/messages.json';

const STORAGE_KEY = (clubId: string) => `forum:${clubId}`;

export const forumRepo = {
  getMessages(clubId: string): Message[] {
    const fromSeed = (seed as Message[]).filter((m) => m.clubId === clubId);
    if (typeof window === 'undefined') return fromSeed;
    const local = window.localStorage.getItem(STORAGE_KEY(clubId));
    const localMsgs: Message[] = local ? JSON.parse(local) : [];
    return [...fromSeed, ...localMsgs].sort((a, b) => a.postedAt.localeCompare(b.postedAt));
  },
  postMessage(clubId: string, authorName: string, body: string): Message {
    const msg: Message = {
      id: `local-${Date.now()}`,
      clubId,
      authorName,
      body,
      postedAt: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      const current = window.localStorage.getItem(STORAGE_KEY(clubId));
      const arr: Message[] = current ? JSON.parse(current) : [];
      arr.push(msg);
      window.localStorage.setItem(STORAGE_KEY(clubId), JSON.stringify(arr));
    }
    return msg;
  },
};

// src/services/membershipRepo.ts (localStorage-backed)
import type { MembershipRequest, RequestStatus } from '../types';

const STORAGE_KEY = 'memberships:current';

function loadAll(): MembershipRequest[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveAll(items: MembershipRequest[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

export const membershipRepo = {
  requestJoin(clubId: string, userId: string): MembershipRequest {
    const all = loadAll();
    const existing = all.find((r) => r.clubId === clubId && r.userId === userId);
    if (existing) return existing;
    const req: MembershipRequest = {
      clubId,
      userId,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    saveAll([...all, req]);
    return req;
  },
  getStatus(clubId: string, userId: string): RequestStatus {
    const all = loadAll();
    return all.find((r) => r.clubId === clubId && r.userId === userId)?.status ?? 'none';
  },
};

// src/services/suggestionsRepo.ts
import type { Suggestion } from '../types';
import data from '../data/suggestions.json';

type SuggestionMap = Record<string, Suggestion[]>;

export const suggestionsRepo = {
  getForUser(userId: string): Suggestion[] {
    return (data as SuggestionMap)[userId] ?? [];
  },
};
```
- Gate: `tsc --noEmit` pasa, no hay imports cruzados entre repos

- [ ] **T-13** — Layout base + navegación
- Agent: build (synthesis)
- Files: `src/layouts/Base.astro`, `src/pages/_redirects` (si aplica)
- Principles applied: §10.4 DRY (layout único reutilizado)
- Patch (deterministic): N/A — synthesis. Requisitos:
  - Header sticky con logo textual "Clubes de Lectura" + nav (Directorio `/`, Mi perfil `/profile`).
  - `<slot />` para contenido de página.
  - Footer mínimo con link a repo workshop.
  - Carga `globals.css`.
- Gate: navegación funciona, layout responsive (mobile-first)

### Fase 2 — Features en paralelo (~25-30 min, hasta 6 agentes)

**Precondición**: Fase 1 cerrada (contratos + datos + layout congelados).
**Gate de fase**: cada feature implementada en su worktree aislado consumiendo solo `src/services/*`. Cero modificación de `src/types/`, `src/data/`, `src/layouts/Base.astro`, ni de `globals.css` (cualquier ajuste cosmético se difiere a Fase 3).

- [ ] **T-20** — F1: Directorio + filtros (MVP core)
- Agent: build (synthesis)
- Files: `src/pages/index.astro`, `src/components/club-card.lit.ts`, `src/components/filter-bar.lit.ts`
- Principles applied: §10.3 SOLID (componentes single-responsibility), §10.8 Hexagonal (consume clubsRepo, userRepo)
- Patch (deterministic): N/A — synthesis. Requisitos:
  - `index.astro` carga `clubsRepo.listAll()` server-side y pasa a `<filter-bar>` (Lit, client:load) + lista de `<club-card>`.
  - `filter-bar` mantiene estado de filtros (modality, theme, city) y emite `CustomEvent('filters-changed', { detail })`.
  - `index.astro` escucha el evento y re-renderiza la lista en cliente (puede ser via Lit state shared o re-fetch desde el repo).
  - Cards muestran nombre, modalidad (badge color), temáticas (chips), ciudad/zona si aplica, frecuencia, miembros.
  - Aplicar filtro implícito por `userRepo.getCurrent()` (modalityPreference + preferredGenres) en carga inicial.
- Gate: filtrar `modality: presencial`, `city: Madrid`, `theme: literatura latinoamericana` devuelve ≥3 clubs

- [ ] **T-21** — F2: Detalle de club
- Agent: build (synthesis)
- Files: `src/pages/clubs/[id].astro`
- Principles applied: §10.3 SOLID, §10.8 Hexagonal (consume clubsRepo, booksRepo)
- Patch (deterministic): N/A. Requisitos:
  - getStaticPaths que enumere todos los clubs.
  - Render de nombre, descripción, modalidad, ciudad/zona, frecuencia.
  - Sección "Próxima lectura" con `booksRepo.getById(currentBookId)`.
  - Sección "Historial" con `booksRepo.getMany(pastBookIds)`.
  - Sección "Miembros activos" con avatares-iniciales en círculo.
  - Slots placeholder para F4 (foro), F5 (botón unirse), F7 (historial+ratings), reservados con id="slot-forum", etc., para cablear en Fase 3.
- Gate: navegando a `/clubs/<cualquier-id>` muestra info completa

- [ ] **T-22** — F3: Perfil de usuario
- Agent: build (synthesis)
- Files: `src/pages/profile.astro`, `src/components/profile-form.lit.ts`
- Principles applied: §10.3 SOLID, §10.8 Hexagonal (consume userRepo)
- Patch (deterministic): N/A. Requisitos:
  - Formulario Lit con: nombre (input text), géneros preferidos (multi-select de chips), modalidad preferida (radio: online/presencial/ambos), ciudad (input text opcional).
  - Botón "Guardar" llama a `userRepo.updatePreferences()`.
  - Toast/aviso de "Preferencias guardadas".
- Gate: al guardar, recargar `/` y comprobar que el feed refleja la preferencia

- [ ] **T-23** — F4: Foro interno (Stretch 1)
- Agent: build (synthesis)
- Files: `src/components/club-forum.lit.ts`
- Principles applied: §10.3 SOLID, §10.8 Hexagonal (consume forumRepo)
- Patch (deterministic): N/A. Requisitos:
  - Componente Lit con `@property() clubId`.
  - Lista de mensajes (autor + body + fecha relativa).
  - Form para postear mensaje nuevo (usa `userRepo.getCurrent().name` como autor).
  - Cero conocimiento de la página padre; se renderiza standalone.
- Gate: posteando un mensaje aparece en la lista y persiste tras recargar

- [ ] **T-24** — F5: Solicitar unirse (Stretch 2)
- Agent: build (synthesis)
- Files: `src/components/join-button.lit.ts`
- Principles applied: §10.3 SOLID, §10.8 Hexagonal (consume membershipRepo, userRepo)
- Patch (deterministic): N/A. Requisitos:
  - Botón Lit que muestra estado `none → pending → accepted/rejected`.
  - Al click en estado `none`, llama `membershipRepo.requestJoin()` y pasa a `pending`.
  - Tras 3 segundos en `pending`, simula respuesta aleatoria (75% accepted, 25% rejected) actualizando localStorage.
- Gate: el estado se mantiene tras recargar la página

- [ ] **T-25** — F6: Mapa interactivo (Stretch 3)
- Agent: build (synthesis)
- Files: `src/components/clubs-map.lit.ts`
- Principles applied: §10.3 SOLID, §10.8 Hexagonal (consume clubsRepo)
- Patch (deterministic): N/A. Requisitos:
  - Componente Lit con Leaflet. Importar CSS de Leaflet en el componente.
  - **CRÍTICO (R3)**: el componente solo se monta client-side. La página que lo use lo embebe con `client:only="lit"`.
  - Markers solo para clubs con `coords` definidas (presenciales).
  - Popup en cada marker con nombre + link al detalle.
  - Centro y zoom iniciales: Madrid (40.4168, -3.7038), zoom 12.
- Gate: el mapa renderiza sin errores de SSR; los markers son clickables

- [ ] **T-26** — F7: Historial + valoraciones (Stretch 5)
- Agent: build (synthesis)
- Files: `src/components/book-history.lit.ts`
- Principles applied: §10.3 SOLID, §10.8 Hexagonal (consume booksRepo)
- Patch (deterministic): N/A. Requisitos:
  - Componente Lit con `@property() bookIds: string[]`.
  - Lista de libros pasados con título, autor, año, y rating agregado (estrellas) usando `booksRepo.averageRating()`.
  - Visual estilo "estantería" con libros como tarjetas pequeñas.
- Gate: el componente renderiza correctamente la lista de libros con rating

- [ ] **T-27** — F8: Sugerencias IA mock (Stretch 4)
- Agent: build (synthesis)
- Files: `src/components/ai-suggestions.lit.ts`
- Principles applied: §10.3 SOLID, §10.8 Hexagonal (consume suggestionsRepo, userRepo, clubsRepo)
- Patch (deterministic): N/A. Requisitos:
  - Componente Lit que carga `suggestionsRepo.getForUser(userId)` para el usuario actual.
  - Cada sugerencia muestra: nombre del club (link), `reason` en cursiva, badge "Sugerido por IA" con icono ✨.
  - Si no hay sugerencias para el usuario, mostrar estado vacío "Configura tu perfil para recibir sugerencias".
- Gate: el componente se renderiza con 3-5 sugerencias para el demo-1

### Fase 3 — Integración (~10 min, secuencial)

**Precondición**: Fase 2 cerrada (todos los componentes Lit existen y consumen sus repos).

- [ ] **T-30** — Cablear F4 (foro) en detalle de club
- Agent: build
- Files: `src/pages/clubs/[id].astro`
- Principles applied: §10.4 DRY
- Patch (deterministic):
```diff
   <h2>Miembros activos</h2>
   {/* membersList */}
+
+  <h2>Foro del club</h2>
+  <club-forum clubId={club.id} client:load></club-forum>
```
- Gate: foro visible en cada detalle

- [ ] **T-31** — Cablear F5 (solicitar unirse) en detalle de club
- Agent: build
- Files: `src/pages/clubs/[id].astro`
- Principles applied: §10.4 DRY
- Patch (deterministic):
```diff
   <h1>{club.name}</h1>
+  <join-button clubId={club.id} client:load></join-button>
```
- Gate: botón visible al lado del título

- [ ] **T-32** — Cablear F6 (mapa) en directorio
- Agent: build (synthesis)
- Files: `src/pages/index.astro`
- Principles applied: §10.4 DRY
- Patch (deterministic): N/A — synthesis. Añadir toggle "Vista lista / Vista mapa" en la página. Si "mapa" activo, ocultar la lista y mostrar `<clubs-map client:only="lit"></clubs-map>`.
- Gate: toggle funciona, mapa carga sin errores SSR

- [ ] **T-33** — Cablear F7 (historial+ratings) en detalle de club
- Agent: build
- Files: `src/pages/clubs/[id].astro`
- Principles applied: §10.4 DRY
- Patch (deterministic):
```diff
-  <h2>Historial</h2>
-  {/* simple list of past books */}
+  <h2>Historial con valoraciones</h2>
+  <book-history bookIds={club.pastBookIds.join(',')} client:load></book-history>
```
- Gate: historial se ve con ratings

- [ ] **T-34** — Cablear F8 (sugerencias IA) en directorio y perfil
- Agent: build
- Files: `src/pages/index.astro`, `src/pages/profile.astro`
- Principles applied: §10.4 DRY
- Patch (deterministic): N/A — synthesis. Añadir `<ai-suggestions client:load></ai-suggestions>` arriba de la lista de directorio (sección "Para ti") y en la página de perfil (sección "Sugerencias basadas en tu perfil").
- Gate: sugerencias visibles en ambas páginas

- [ ] **T-35** — Smoke check del criterio de demo
- Agent: verify
- Files: N/A (verificación visual + scripted)
- Principles applied: §10.5 TDD (verificación post-build)
- Patch (deterministic): N/A — comando:
  - `npm run build` debe pasar sin errores.
  - Manual: abrir `/`, aplicar filtros `modality: presencial`, `city: Madrid`, `theme: literatura latinoamericana`, comprobar ≥3 resultados, abrir uno.
- Gate: el flujo de demo completa sin errores

- [ ] **T-36** — README de arranque
- Agent: build
- Files: `README.md`
- Principles applied: §10.7 Clean Code (docs mínimas + accionables)
- Patch (deterministic): N/A — synthesis. Contenido:
  - Título + 1 línea de propósito.
  - Sección "Arranque": `npm install` + `npm run dev` + URL.
  - Sección "Demo": pasos para reproducir el criterio del workshop.
  - Sección "Arquitectura": 1 párrafo sobre Hexagonal + Repository, link a `.ai-engineering/specs/spec.md`.
- Gate: archivo creado, formato markdown válido

### Fase 4 — Commit + PR (~5 min)

- [ ] **T-40** — Crear feature branch
- Agent: build
- Files: N/A (git)
- Principles applied: §13 (hard rule: feature branch)
- Patch (deterministic): N/A — comando: `git checkout -b feat/spec-001-clubes-lectura`
- Gate: branch creado

- [ ] **T-41** — Commit conventional con resumen de spec
- Agent: build
- Files: N/A (git)
- Principles applied: §13 (hard rule: Conventional Commits + no --no-verify)
- Patch (deterministic): N/A — `ai-eng commit` o `/ai-commit` para que pase por la pipeline gobernada (gitleaks + format + lint).
- Gate: commit creado, pre-commit hook verde

- [ ] **T-42** — Push + PR
- Agent: build
- Files: N/A
- Principles applied: §13
- Patch (deterministic): N/A — `/ai-pr` ejecuta gates pre-push + abre PR + watcheo de CI.
- Gate: PR abierta, CI verde (o explícitamente skipped si no hay remote)

## Risks (heredados del spec)

- **R1** Cronómetro: priority MVP > stretches si Fase 2 se alarga.
- **R2** Conflictos de merge en Fase 2: layout congelado en Fase 1.
- **R3** Leaflet + SSR: `client:only="lit"` documentado en T-25.
- **R4** Seed insuficiente: ≥3 clubs Madrid+latinoamericana enforced en T-11 gate.
- **R5** Stack drift: T-01 antes de todo.

## Gates resumen

| Fase | Gate |
|------|------|
| 0 | `ai-eng doctor` PASS, `npm run dev` arranca |
| 1 | `tsc --noEmit` pasa, no imports cruzados de JSON desde componentes |
| 2 | cada feature builda en su worktree sin tocar archivos compartidos |
| 3 | flujo de demo del workshop completable end-to-end |
| 4 | pre-commit + pre-push gates verde |

## Safe next command

```
/ai-autopilot
```
