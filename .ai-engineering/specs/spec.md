---
spec: spec-001
title: App de clubes de lectura (Reto B workshop)
status: approved
effort: medium
summary: Construir en 60 minutos una demo navegable de directorio + detalle + perfil de clubes de lectura usando contract-first parallel dev (contratos + mocks JSON primero, features Lit en paralelo después).
---

# App de clubes de lectura — Reto B "La Batalla de las IAs"

## Summary

El reto B del workshop ai-engineering pide entregar en 60 minutos una demo navegable de una app que conecte personas con clubes de lectura (online y presenciales), con MVP funcional y stretches incrementales. El plan de juego es **contract-first parallel development** (§10.8 Hexagonal Architecture): primero diseñamos tipos compartidos, JSON seeds y repositorios adapter; después lanzamos todas las features sobre el contrato en waves paralelos, y solo al final integramos. Esto permite acometer MVP + los 5 stretches dentro del cronómetro sin descartar funcionalidad por falta de tiempo.

## Goals

- Demo navegable en `npm run dev` a localhost:4321 al final de los 60 minutos.
- **Criterio de aceptación del workshop**: filtrar "presencial en Madrid, literatura latinoamericana" devuelve clubs concretos, y el detalle de uno de ellos abre correctamente.
- El perfil del usuario influye en lo que aparece en el directorio (filtro implícito por preferencia de modalidad y géneros).
- MVP completo: directorio con cards (nombre, modalidad, temática, ciudad/zona, frecuencia, miembros), filtros combinables por modalidad/temática/ubicación, página de detalle de club (descripción, próxima lectura, historial, miembros activos), y perfil editable con géneros + modalidad preferida.
- Los 5 stretches están en scope a través de mocks adapter-shaped (foro interno, solicitar unirse, mapa interactivo, sugerencias IA, historial con valoraciones).
- Polish visual coherente con paleta editorial improvisada (marrón papel + verde lectura), tipografía serif para títulos de libros y sans-serif para UI.
- Datos seed coherentes: al menos 12 clubs reales-plausibles, incluyendo varios "presenciales en Madrid de literatura latinoamericana" para que la demo del workshop tenga material concreto.

## Non-Goals

- Autenticación real (sin login, sin Firebase Auth, sin OAuth). Hay un único perfil "demo" precargado y editable.
- Backend persistente. Toda la persistencia es JSON seed + localStorage para el perfil.
- Despliegue a Firebase Hosting durante el workshop. Queda como ejercicio post-cronómetro.
- Llamada real a un LLM para sugerencias. Stretch 4 entra como mock precomputado (`suggestionsRepo` devuelve sugerencias por `userId`); promover a API real solo si sobra tiempo después del cierre del workshop.
- Tests unitarios exhaustivos. Para 60 min priorizamos demo funcional; máximo un smoke test sobre los repositorios si encaja.
- Internacionalización: la UI está en español, hardcoded. No hay i18n.
- Optimización de bundle, SSR, accesibilidad WCAG completa ni SEO. Polish suficiente para la demo, no para producción.
- Branding oficial del reto (assets Arcasiles, fuente Lexend). Improvisamos paleta y tipografía propias.

## Decisions

### D-001-01 — Stack: Astro 5 + Lit + Tailwind v4

**Elección**: Astro como SSG / routing + Lit Web Components para componentes interactivos (filtros, cards, mapa, foro) + Tailwind v4 para estilos.

**Rationale**: El usuario ya domina este stack (catálogo Geniova histórico). Astro hace el routing trivial con `src/pages/*.astro`, las islands de Astro encajan perfectamente con Lit para los componentes interactivos, y Tailwind v4 acelera el polish visual. Alternativas consideradas y descartadas: SvelteKit (DX más rápida pero stack desconocido), Next.js 15 + shadcn (más prod-grade pero más boilerplate), Vanilla Vite + TS (cero framework, riesgo alto de tardar en routing/filtros).

### D-001-02 — Capa de datos: JSON estático + repositorios adapter

**Elección**: Datos dummy viven en `src/data/*.json`. Cada entidad expone su repositorio en `src/services/<entity>Repo.ts` con interfaz pública (listAll, getById, filter, etc.). Componentes consumen vía el repositorio, nunca leen el JSON directamente.

**Rationale**: §10.8 Hexagonal Architecture. Los repositorios son los puertos; los JSON son adapters concretos. Esto desacopla las features de la fuente de datos y permite que las features se construyan en paralelo sin colisionar. Alternativa descartada: Firestore con seed (~10-15 min de overhead que sale del cronómetro sin valor para la demo).

### D-001-03 — Estrategia de ejecución: contract-first parallel waves

**Elección**: Tres fases:
- **Fase 1 (secuencial, ~10 min)**: tipos compartidos en `src/types/`, JSON seeds en `src/data/`, repositorios en `src/services/`, layout base + tokens Tailwind. Es la única fase no paralelizable.
- **Fase 2 (paralela, ~25-30 min, hasta 6 agentes simultáneos)**: cada feature implementada en agentes aislados (worktrees), consumiendo solo el contrato definido en Fase 1. Features:
  - F1 Directorio + filtros (`pages/index.astro` + `components/club-card.lit.ts` + `components/filter-bar.lit.ts`)
  - F2 Detalle de club (`pages/clubs/[id].astro`)
  - F3 Perfil de usuario (`pages/profile.astro`)
  - F4 Foro interno (`components/club-forum.lit.ts`)
  - F5 Solicitar unirse (`components/join-button.lit.ts`)
  - F6 Mapa interactivo (`components/clubs-map.lit.ts`, Leaflet)
  - F7 Historial + valoraciones (`components/book-history.lit.ts`)
  - F8 Sugerencias IA mock (`components/ai-suggestions.lit.ts`)
- **Fase 3 (integración, ~10 min)**: cablear F4-F8 dentro de las páginas correspondientes, ajustar navegación, polish global, verificar criterio de demo.

**Rationale**: El usuario validó explícitamente este enfoque sobre la propuesta inicial de descartar stretches por tiempo. Es la única forma honesta de completar MVP + 5 stretches en 60 min con un único colaborador (yo). Permite además que el quality loop final de `/ai-pr` actúe sobre el resultado integrado y no sobre cada feature aislada.

### D-001-04 — Persistencia del perfil: localStorage

**Elección**: `userRepo.updatePreferences()` escribe en `localStorage` bajo la clave `user:current`. `userRepo.getCurrent()` lee de localStorage con fallback a `users.json` seed.

**Rationale**: El perfil influye en el feed del directorio. Si se pierde al recargar, la demo es frágil. localStorage es la persistencia más simple sin red ni dependencias externas. Alternativa descartada: Firestore (overhead injustificado para el cronómetro).

### D-001-05 — Sugerencias IA: solo mock precomputado

**Elección**: `suggestionsRepo.getForUser(userId)` devuelve un array de `{ clubId, reason }` precargado en `suggestions.json` por perfil.

**Rationale**: El stretch 4 con LLM real introduce latencia, API key management y posibles fallos visibles durante la demo. Un mock precomputado se ve igualmente "AI-generated" en la UI y nunca rompe. El propio contrato del repositorio permite sustituir la implementación por una llamada real post-workshop sin tocar los componentes consumidores.

### D-001-06 — Branding: improvisado, no oficial

**Elección**: Paleta editorial mínima (marrón papel `#f5efe6`, verde lectura `#3d7d5c`, tinta `#2a1f1a`), tipografías sistema serif para títulos de libros (`ui-serif`) + sans-serif para UI (`ui-sans-serif`). Sin assets del workshop.

**Rationale**: Velocidad y libertad sobre alineación con el branding oficial. No hay que descargar assets ni configurar fuentes externas; Tailwind v4 ya provee tokens del sistema. Trade-off explícito: menos puntos de "polish alineado con el jurado" pero también cero tiempo gastado en assets.

### D-001-07 — Idioma UI: español hardcoded

**Elección**: Toda la UI está en español sin sistema de i18n.

**Rationale**: El contexto del workshop es hispanohablante. Introducir i18n añade complejidad sin valor para la demo.

### D-001-08 — Sin auth, sin deploy, sin tests exhaustivos

**Elección**: Cero autenticación, cero despliegue Firebase Hosting durante el cronómetro, cero suite de tests Vitest/Playwright completa.

**Rationale**: Cada uno de estos elementos consume tiempo que sale directamente del polish del MVP+stretches. La demo se ejecuta localmente en `npm run dev`. Si al final sobra tiempo, valoramos un smoke test rápido sobre los repositorios o un `firebase deploy`, pero no son obligatorios.

### D-001-09 — Añadir TypeScript al manifest

**Elección**: Antes de `/ai-build`, `providers.stacks` en `.ai-engineering/manifest.yml` pasa de `[python]` a `[python, typescript]`.

**Rationale**: El framework ai-engineering resuelve adapters de gates (semgrep, dependency audit, etc.) por stack declarado. Sin typescript declarado, los gates aplicarían reglas python sobre código TS y fallarían o pasarían en falso. Esta es una decisión de configuración, no de producto.

## Risks

### R1 — El cronómetro no acompaña

**Probabilidad**: Media. **Impacto**: Alto.

El plan asume ~10 min foundation + ~25-30 min features paralelas + ~10 min integración. Las preguntas/aprobaciones de plan + interacción humana también consumen tiempo real. Si el wave paralelo de Fase 2 tarda más de 30 min, comemos del tiempo de integración.

**Mitigación**: Priorización dura por valor de demo. Si la Fase 2 se alarga, F1-F3 (MVP estricto) tienen prioridad absoluta sobre F4-F8. Si una feature en wave paralelo se atasca, el agente la marca como skipped y seguimos sin ella. El criterio de aceptación del workshop solo requiere MVP funcional + filtro de Madrid.

### R2 — Conflictos de merge en Fase 2 a pesar del contract-first

**Probabilidad**: Baja. **Impacto**: Medio.

Aunque cada feature toca ficheros propios, todas tocan algún punto compartido (layout base, navegación, paleta Tailwind). Un cambio simultáneo a `BaseLayout.astro` desde dos agentes podría colisionar.

**Mitigación**: La Fase 1 deja el layout, nav y paleta congelados. Los agentes de Fase 2 reciben instrucciones explícitas de no modificar ficheros compartidos; cualquier ajuste cosmético se difiere a Fase 3. El orquestador (`/ai-autopilot` o `/ai-build` con concurrencia) ya aísla en worktrees.

### R3 — Leaflet + Astro SSR

**Probabilidad**: Media. **Impacto**: Bajo.

Leaflet asume `window` y rompe en SSG/SSR. Componentes Lit del mapa deben hidratarse client-side con `client:only="lit"`.

**Mitigación**: La directiva `client:only="lit"` en la página que usa el mapa es la solución estándar. Documentada en la tarea del agente de F6 para que no se descubra a media implementación.

### R4 — Datos seed insuficientes o poco creíbles

**Probabilidad**: Baja. **Impacto**: Medio.

Si los 12+ clubs seed no incluyen el match exacto para "presencial en Madrid + literatura latinoamericana", la demo falla en su criterio explícito.

**Mitigación**: Los datos seed se generan en Fase 1 con al menos 3 clubs que matcheen ese filtro específico, y verificados en Fase 3 antes de cerrar.

### R5 — Stack typescript no declarado dispara gates rotos

**Probabilidad**: Baja. **Impacto**: Bajo.

Si olvidamos D-001-09 y dejamos solo `python` en el manifest, los hooks de pre-commit pueden quejarse o pasar en falso al ejecutar sobre código TS.

**Mitigación**: D-001-09 es la primera tarea de la Fase 1 antes de tocar código.

## References

- doc: https://github.com/arcasilesgroup/ai-engineering-workshop/blob/main/workshop/la-batalla-de-las-ias/reto-b-clubes-lectura.md
- doc: .ai-engineering/reference/principles.md (§10.8 Hexagonal Architecture)
- doc: CLAUDE.md (§11 Canonical Chain, §13 Hard Rules)
