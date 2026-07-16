# Echoboard

Feedback boards, roadmap y changelog para tu producto. **Como Canny, pero con precio plano
transparente, tableros privados desde el primer plan y priorización por revenue en vez de por
votos.**

La investigación de mercado que justifica el proyecto está en
[`docs/investigacion-mercado.md`](docs/investigacion-mercado.md).

## Stack

- **Next.js 15** (App Router) + TypeScript
- **PostgreSQL** + Drizzle ORM
- **Auth.js v5** (Google / GitHub OAuth)
- **Tailwind CSS v4** + componentes estilo shadcn/ui

## Desarrollo

```bash
cp .env.example .env       # configura DATABASE_URL y AUTH_SECRET
npm install
npm run db:migrate         # aplica las migraciones de drizzle/
npm run dev
```

## Scripts de base de datos

| Script | Descripción |
|---|---|
| `npm run db:generate` | Genera migraciones SQL a partir de `src/db/schema.ts` |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:push` | Sincroniza el esquema directamente (solo desarrollo) |
| `npm run db:studio` | Abre Drizzle Studio |

## Estructura

```
src/
  auth.ts               # Auth.js v5 (adapter Drizzle)
  db/schema.ts          # Esquema multi-tenant: org → project → board → post
  app/
    page.tsx            # Landing
    login/              # Sign-in (Google/GitHub)
    dashboard/          # Panel del equipo (protegido)
    p/[slug]/           # Board público por tenant (SSR)
    api/auth/[...nextauth]/
```

## Roadmap del MVP

- [x] **Fase 0** — Scaffold, esquema multi-tenant, Auth.js
- [ ] **Fase 1** — Core del board: posts, votos, comentarios, estados
- [ ] **Fase 2** — SDK de identidad JWT + priorización por revenue + boards privados
- [ ] **Fase 3** — Roadmap kanban + changelog con notificaciones
- [ ] **Fase 4** — Widget embebible < 30 KB
- [ ] **Fase 5** — API pública + webhooks
- [ ] **Fase 6** — Stripe + lanzamiento
