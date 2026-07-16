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
    embed/[slug]/       # Vista compacta para el iframe del widget
    api/auth/[...nextauth]/
widget/
  src/index.ts          # Widget embebible (vanilla TS → public/widget.js)
  build.mjs             # Build esbuild con presupuesto de 30 KB
```

## Identificación de usuarios (SSO por JWT)

Cada proyecto tiene un `ssoSecret` (visible en su dashboard de administración). El backend del
cliente firma un JWT **HS256** con ese secreto y envía al usuario al endpoint de identify:

```js
// Node.js (npm i jose)
import { SignJWT } from "jose";

const token = await new SignJWT({
  id: "user_123",          // requerido: id estable del usuario en tu sistema
  email: "ana@acme.com",
  name: "Ana García",
  company: "Acme Inc",
  plan: "growth",
  mrr: 499,                // lo que paga al mes → alimenta la priorización por revenue
})
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("10m")
  .sign(new TextEncoder().encode(SSO_SECRET));

// Redirige a:
// https://tu-echoboard.com/api/sso/<proyecto>?token=<jwt>&redirect=/p/<proyecto>
```

Efectos: el visitante queda identificado (cookie httpOnly de 30 días), sus votos cargan su MRR
en `revenue_impact`, y obtiene acceso a los boards privados del proyecto. También existe
`POST /api/sso/<proyecto>` con `{ "token": "<jwt>" }` para flujos programáticos.

## Widget embebible (< 30 KB)

El board puede incrustarse en la app del cliente sin frameworks ni dependencias. El bundle
(`public/widget.js`, ~4 KB minificado) se compila con esbuild desde `widget/src/index.ts`; el
build falla si supera los 30 KB.

```html
<!-- Popup con botón flotante (auto-init) -->
<script src="https://tu-echoboard.com/widget.js" data-project="mi-producto" defer></script>

<!-- O programático, con identificación SSO -->
<script src="https://tu-echoboard.com/widget.js" defer></script>
<script>
  window.addEventListener("load", function () {
    Echoboard.init({ project: "mi-producto" });          // mode: "inline", target: "#feedback"
    Echoboard.identify("<jwt>");                          // mismo JWT del flujo SSO
  });
</script>
```

El widget renderiza `/embed/<proyecto>` en un iframe; `identify()` enruta el iframe por
`GET /api/sso/<proyecto>` para fijar la sesión del end user server-side (el `ssoSecret` nunca
toca el navegador). Demo local en `/widget-demo.html`. Build manual: `npm run widget:build`
(también se ejecuta dentro de `npm run build`).

## Roadmap del MVP

- [x] **Fase 0** — Scaffold, esquema multi-tenant, Auth.js
- [x] **Fase 1** — Core del board: posts, votos, comentarios, estados
- [x] **Fase 2** — SDK de identidad JWT + priorización por revenue + boards privados
- [x] **Fase 3** — Roadmap kanban + changelog + emails de "Lanzado" (Resend)
- [x] **Fase 4** — Widget embebible < 30 KB
- [ ] **Fase 5** — API pública + webhooks
- [ ] **Fase 6** — Stripe + lanzamiento
