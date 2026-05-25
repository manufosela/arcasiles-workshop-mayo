# Clubes de Lectura · Reto B

Demo navegable de una app que conecta personas con clubes de lectura (online y presenciales). Reto B de "La Batalla de las IAs" del [ai-engineering-workshop](https://github.com/arcasilesgroup/ai-engineering-workshop).

## Arranque

```bash
npm install
npm run dev
```

→ `http://localhost:4321`

## Demo del workshop

1. Abre `/`.
2. Aplica filtros: **Modalidad = Presencial**, **Ciudad = Madrid**, **Temática = literatura latinoamericana**.
3. Deberían aparecer 4 clubs (Macondo en Madrid, Voces del Cono Sur, Café con Pessoa, Nuevos Narradores Madrid).
4. Abre cualquiera para ver el detalle (próxima lectura, historial con valoraciones, foro, miembros, botón de unirse).
5. Ve a `/profile`, ajusta géneros / modalidad / ciudad, guarda. Vuelve a `/` y el feed se ajusta a tu perfil.
6. En el directorio, alterna **Vista lista ↔ Vista mapa** para ver los clubs presenciales en un mapa OpenStreetMap.

## Arquitectura

Hexagonal Architecture + Repository pattern (§10.8 de ai-engineering).

- **Puertos**: `src/services/<entity>Repo.ts` exponen el contrato público de cada entidad.
- **Adapters**: datos dummy en `src/data/*.json`. Persistencia mutable (perfil, foro, solicitudes de membresía) en `localStorage`.
- **Tipos compartidos**: `src/types/`.
- **Pages**: `src/pages/` (Astro 5, SSG).
- **Componentes interactivos**: `src/components/*.lit.ts` (Lit 3, Web Components con shadow DOM).
- **Estilos**: Tailwind v4 + tokens en `src/styles/globals.css` (también expuestos como CSS variables para los componentes Lit).

Los componentes Lit consumen exclusivamente los repos del puerto — ningún componente importa de `src/data/*.json` directamente. Esto permitió desarrollar las features en paralelo (contract-first) sobre el contrato fijado en Fase 1.

## Stack

- **Astro 5** (static output)
- **Lit 3** para Web Components interactivos
- **Tailwind CSS v4** (beta) para el layout y estilos del light DOM
- **Leaflet** para el mapa interactivo
- **TypeScript strict**

## Stretches incluidos

Todos los stretches del reto entran como features:

| # | Stretch | Componente / Página |
|---|---------|---------------------|
| 1 | Foro interno | `components/club-forum.lit.ts` |
| 2 | Solicitar unirse (simulado) | `components/join-button.lit.ts` |
| 3 | Mapa interactivo | `components/clubs-map.lit.ts` (Leaflet + OSM) |
| 4 | Sugerencias IA | `components/ai-suggestions.lit.ts` (mock precomputado en `suggestions.json`) |
| 5 | Historial con valoraciones | `components/book-history.lit.ts` |

## Spec & plan

- Spec aprobado: [.ai-engineering/specs/spec.md](.ai-engineering/specs/spec.md)
- Plan de ejecución: [.ai-engineering/specs/plan.md](.ai-engineering/specs/plan.md)

## Build de producción

```bash
npm run build
npm run preview
```

15 páginas estáticas generadas en `dist/` (directorio + 13 detalles de club + perfil).
