# Investigación de Mercado — Elección del SaaS de Nicho

**Fecha:** 16 de julio de 2026
**Objetivo:** Encontrar, analizar y elegir el mejor micro-SaaS de nicho para construir desde cero.
**Criterios:** Tracción validada ($5k–$50k MRR en el nicho), infraestructura ligera, nicho claro (B2B / productividad / automatización / dev tools / micro-utilidades).

---

## 1. Fase de descubrimiento

Los marketplaces TrustMRR, Acquire.com y Microns bloquean el scraping directo (HTTP 403), por lo que la extracción se hizo vía sus datos indexados públicamente y reportes "build in public" verificados. Hallazgos de tracción verificada:

| Producto | MRR verificado | Nicho | Fuente |
|---|---|---|---|
| FriendFilter/GroupFilter | $11.3k MRR | Micro-utilidad (extensión Chrome) | TrustMRR (revenue verificado vía Stripe) |
| EZ Fulfill | $8k MRR | Automatización Shopify | Directorios micro-SaaS 2026 |
| Vendor Hawk | $12k MRR | Alertas para sellers de Amazon | Directorios micro-SaaS 2026 |
| ScreenshotOne | ~$22k MRR ($269k ARR) | Dev tool (API de screenshots) | Blog oficial / IndieHackers |
| Featurebase | ~$10k MRR | B2B feedback management | SaasyTrends / blog oficial |
| Senja | $83k MRR (fue $30k en 2024) | Testimonios / social proof | Build in public reports |
| Canny (líder incumbente) | 7,000+ empresas, planes $200–$400/mes | B2B feedback management | G2 / Trustpilot |

### Candidatos finalistas

1. **Recolección de testimonios / social proof** — líder: Senja ($83k MRR), incumbente caro: Testimonial.to
2. **Feedback boards + roadmap + changelog B2B** — líder incumbente: Canny; retador: Featurebase ($10k MRR)
3. **Screenshot API para developers** — líder: ScreenshotOne ($22k MRR)

---

## 2. Análisis de la competencia y puntos de dolor

### Candidato A — Testimonios / Social Proof (Senja, Testimonial.to)

**Queja nº1 de usuarios de pago (Testimonial.to):** precio — $50/mes el plan básico, la marca de agua solo desaparece a partir de $40/mes, y Google Rich Results solo en el plan de $80/mes.

**Features pedidas que faltan o están mal implementadas:**
- Sin secuencias automatizadas de email/SMS post-compra para pedir el testimonio (recolección 100 % manual).
- Sin transcripción con IA, sin análisis de sentimiento, sin importación masiva.
- En Senja: embeds lentos que penalizan el rendimiento del sitio, sin exportación visual en bulk, API pública incompleta (acciones solo en Zapier), un solo webhook por proyecto, testimonios que "desaparecen".

**Pero:** Senja es barato ($29/mes ilimitado), muy querido y ejecuta rápido. El hueco de dolor real es pequeño.

### Candidato B — Feedback boards + Roadmap + Changelog (Canny, Featurebase)

**Queja nº1 de usuarios de pago (Canny):**el precio y su modelo. Clientes reportan pasar de $200/mes a $400/mes con subidas inesperadas. El pricing por "tracked users" castiga a productos con muchos usuarios gratuitos/trial. El salto del plan Pro (tope duro de 10 usuarios) al plan Business es enorme por un solo asiento adicional.

**Otras quejas fuertes de Canny:**
- Obliga a que los datos de feedback sean **públicos** salvo que pagues un upgrade.
- Cancelar requiere contactar a soporte (dark pattern).
- Personalización limitada e interfaz rígida.

**Quejas de Featurebase (el retador):**
- Analítica superficial ("the analytics dashboard could offer deeper insights").
- API poco avanzada; exportar datos es difícil.
- Features esenciales bloqueadas en tiers altos.
- No prioriza por revenue en la interfaz (solo exporta "Associated MRR") — gap explícito señalado por equipos que deciden por impacto en ingresos, no por número de votos.

### Candidato C — Screenshot API (ScreenshotOne, Urlbox)

**Queja nº1 de developers:** fiabilidad del renderizado — cookie banners y overlays que arruinan la captura (ScreenshotOne pasa 12/15 tests de cookie banners, Urlbox 13/15), lazy loading incompleto, resultados inconsistentes entre ejecuciones.

**Pero:** el foso competitivo es precisamente ese: años de heurísticas acumuladas para miles de edge cases, más una flota de navegadores headless (infraestructura pesada). El propio fundador de ScreenshotOne documenta que su algoritmo de bloqueo de banners "tardó años en desarrollarse". Mal encaje con el criterio de "infraestructura ligera".

---

## 3. Matriz de viabilidad (Scorecard 1–10)

| Métrica | A: Testimonios | B: Feedback boards | C: Screenshot API |
|---|---|---|---|
| **Demanda validada** (¿la gente ya paga?) | 9 — Senja $83k MRR, múltiples players | 9 — Canny 7k+ empresas a $200–400/mes; Featurebase creciendo | 8 — dev tools con márgenes del 74 % |
| **Complejidad del MVP** (más alto = más fácil/rápido) | 6 — video hosting, grabación en navegador, widgets | 9 — CRUD + votos + kanban + changelog; cero infra exótica, cero IA cara | 5 — flota de navegadores headless + años de heurísticas anti-banner |
| **Fricción del competidor** (¿es fácil ganar arreglando sus fallos?) | 4 — el líder (Senja) es barato y querido; poco dolor que explotar | 8 — el líder (Canny) es caro, opaco, fuerza datos públicos y retiene la cancelación; el retador (Featurebase) deja gaps claros (API, analítica, revenue-priorización) | 4 — el líder es confiable, amado por devs y con foso técnico real |
| **Barrera de entrada** (más alto = nicho más desatendido) | 4 — saturado: Senja, Famewall, Trustmary, Vouch, WiserReview… | 6 — competido pero el segmento SMB/startup está mal servido: Canny les queda caro y Featurebase les queda corto | 5 — muchos players compitiendo por calidad de render |
| **TOTAL** | **23/40** | **32/40** | **22/40** |

---

## 4. Ganador: Candidato B — Feedback Board B2B

### El proyecto: **Echoboard**

> **"Es como Canny, pero con precio plano transparente, tableros privados desde el primer plan, y priorización por revenue en vez de por votos."**

**Por qué gana:**
- Demanda probadísima: las empresas ya pagan $200–$400/mes por esto, y lo hacen quejándose.
- El dolor nº1 del líder es estructural (su modelo de pricing por tracked users y su motion enterprise), no un bug que puedan parchear mañana. Canny no puede bajar precios sin canibalizar su base enterprise: es el escenario clásico de disrupción por gama baja.
- MVP 100 % construible con un stack web estándar: sin GPUs, sin flotas de navegadores, sin modelos propios.
- Featurebase ya demostró que un retador bootstrapped le puede arrancar cuota a Canny ($0 → $10k MRR), y aun así dejó gaps documentados que podemos atacar desde el día 1.

### Features del MVP (cada una mapeada a un dolor detectado)

| # | Feature | Dolor que resuelve |
|---|---|---|
| 1 | Tableros de feedback con votos, comentarios y estados (Open → Planned → In Progress → Shipped) | Core del producto |
| 2 | **Tableros privados incluidos en todos los planes** | Canny fuerza datos públicos salvo upgrade |
| 3 | **Precio plano por proyecto** (sin pricing por tracked users, sin límite duro de asientos) | Queja nº1 de Canny: $200→$400 y saltos de tier |
| 4 | **Priorización ponderada por revenue**: cada usuario final puede llevar un atributo `mrr`/`plan` vía SDK, y los posts se ordenan por impacto en ingresos, no solo por votos | Gap explícito de Featurebase |
| 5 | Roadmap kanban público/privado autogenerado desde los estados | Paridad necesaria |
| 6 | Changelog integrado que notifica por email a los votantes cuando su petición se shippea (cierre del loop) | Paridad + retención |
| 7 | **Widget embebible < 30 KB** (script vanilla, sin framework) | Los embeds lentos son queja recurrente en la categoría (Senja, Canny) |
| 8 | **API REST completa + webhooks desde el plan gratuito** | Featurebase: "API poco avanzada, exportar datos es difícil" |
| 9 | Identificación de usuarios finales por JWT/SSO ligero | Necesario para #4 y para feedback autenticado |
| 10 | **Cancelación self-service en un clic** (y exportación total de datos) | Canny obliga a contactar soporte para cancelar |
| 11 | Deduplicación asistida por IA de posts similares (merge sugerido) | Dolor operativo clásico de los boards con volumen; barato: solo embeddings |

**Fuera del MVP (v2):** analítica profunda de comportamiento, integraciones Slack/Intercom/Linear, encuestas in-app, SSO SAML enterprise.

### Stack tecnológico recomendado

| Capa | Elección | Justificación |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Full-stack en un repo, SSR para los boards públicos (SEO = canal de adquisición: cada board público indexa) |
| Base de datos | **PostgreSQL + Drizzle ORM** | Relacional puro (posts, votos, usuarios, tenants); Drizzle es ligero y type-safe |
| Auth | **Auth.js (email + Google/GitHub OAuth)** + JWT propio para usuarios finales del widget | Dos poblaciones de usuarios distintas: clientes (dashboard) y sus usuarios (widget) |
| UI | **Tailwind CSS + shadcn/ui** | Velocidad de desarrollo y estética profesional inmediata |
| Pagos | **Stripe** (checkout + customer portal) | El portal de Stripe nos da la cancelación self-service gratis |
| Email | **Resend + React Email** | Notificaciones de changelog y digest |
| Widget | **Script vanilla TS compilado con esbuild** (paquete separado) | Cumplir el presupuesto de < 30 KB |
| IA (dedup) | **API de Anthropic (Haiku 4.5) + pgvector** | Embeddings + merge sugerido, coste marginal ínfimo |
| Hosting | **Vercel (app) + Neon/Railway (Postgres)** | Cero DevOps en fase MVP |

### Plan de desarrollo paso a paso

- **Fase 0 — Fundaciones (día 1):** scaffold Next.js + TypeScript + Tailwind + shadcn/ui; esquema Drizzle (organizations, projects, boards, posts, votes, comments, end_users, statuses); Auth.js; multi-tenancy por slug (`echoboard.io/p/{proyecto}`).
- **Fase 1 — Core del board (días 2–4):** CRUD de posts, votos, comentarios; estados y transiciones; board público SSR con SEO; búsqueda y filtros.
- **Fase 2 — Identidad y revenue-priorización (días 5–6):** SDK de identificación JWT; atributos de usuario (`mrr`, `plan`, `company`); ordenación por revenue-impact; tableros privados con control de acceso.
- **Fase 3 — Roadmap + Changelog (días 7–8):** vista kanban; editor de changelog; emails de notificación a votantes (Resend); suscripción pública al changelog.
- **Fase 4 — Widget embebible (días 9–10):** paquete esbuild < 30 KB; modo popup y modo inline; identify() con JWT.
- **Fase 5 — API pública + webhooks (día 11):** REST con API keys por proyecto; webhooks (post.created, post.status_changed, vote.created); docs OpenAPI.
- **Fase 6 — Monetización y lanzamiento (días 12–14):** Stripe checkout + portal; planes Free / Starter ($19) / Growth ($49) — precio plano, todo ilimitado en Growth; dedup por embeddings; landing page "Canny alternative" + página comparativa (SEO play que ya usan Featurebase y Senja con éxito).

---

## Fuentes

- [TrustMRR — marketplace con revenue verificado](https://trustmrr.com/)
- [Flowjam — 27 micro-SaaS examples](https://www.flowjam.com/blog/27-micro-saas-examples-that-actually-print-money-in-2025)
- [Senja — build in public reports](https://senja.io/blog/october-build-in-public-report)
- [TinyStartups — Senja revenue](https://www.tinystartups.com/revenue/senja)
- [SaasyTrends — FeatureBase de 0 a $4k MRR](https://saasytrends.com/featurebase)
- [Canny reviews en G2](https://www.g2.com/products/canny/reviews)
- [Canny reviews en Trustpilot](https://www.trustpilot.com/review/canny.io)
- [Featurebase pros & cons en G2](https://www.g2.com/products/featurebase/reviews?qs=pros-and-cons)
- [WiserNotify — Testimonial.to alternatives (quejas de pricing)](https://wisernotify.com/blog/testimonial-to-alternatives/)
- [ScreenshotOne — $200k ARR](https://screenshotone.com/blog/200000-arr-and-400-paying-customers/)
- [Medium — test de 7 screenshot APIs](https://medium.com/@TheTechDude/i-tested-7-screenshot-apis-with-the-same-100-urls-08dc7aece9b6)
- [Acquire.com — SaaS companies for sale](https://acquire.com/saas-companies-for-sale/)
