# 🚀 Guía de despliegue de Echoboard en producción

> Pensada para humanos. Si sigues los pasos en orden, en unos 30–45 minutos
> tendrás Echoboard funcionando en tu propio dominio. No hace falta saber de
> servidores: usaremos **Vercel** (aloja la web) y **Neon** (aloja la base de
> datos). Ambos tienen plan gratuito de sobra para empezar.

---

## El mapa del viaje

```
1. Base de datos (Neon)      →  5 min   →  obtienes DATABASE_URL
2. La web (Vercel)           →  10 min  →  Echoboard online en *.vercel.app
3. Login (Google/GitHub)     →  10 min  →  tu equipo puede entrar
4. Emails (Resend)           →  5 min   →  avisos de "Lanzado" a votantes
5. Cobros (Stripe)           →  10 min  →  planes Starter y Growth a la venta
6. Checklist final           →  5 min   →  ¡lanzamiento! 🎉
```

Cada pieza es independiente: **la app funciona aunque te saltes los pasos 4 y
5** (sin Resend no se envían emails; sin Stripe todo el mundo está en el plan
Free). Puedes lanzar primero y configurar cobros después.

---

## Paso 1 — La base de datos (Neon)

1. Entra en [neon.tech](https://neon.tech) → **Sign up** (vale con tu cuenta
   de GitHub).
2. Crea un proyecto: nómbralo `echoboard`, elige la región más cercana a tus
   clientes (p. ej. Frankfurt para Europa).
3. En el panel del proyecto verás **Connection string**. Cópiala: empieza por
   `postgresql://...`. **Esa cadena es tu `DATABASE_URL`.** Guárdala como si
   fuera una contraseña (lo es).

> 🟢 *Alternativa*: [supabase.com](https://supabase.com) funciona igual de
> bien — crea un proyecto y copia la connection string de
> **Settings → Database** (usa la variante "connection pooling / session").

4. Aplica las tablas (migraciones) desde tu ordenador, una sola vez:

```bash
DATABASE_URL="postgresql://...tu cadena..." npm run db:migrate
```

Verás `migrations applied successfully!`. Ya existe toda la estructura.

---

## Paso 2 — La web (Vercel)

1. Entra en [vercel.com](https://vercel.com) → **Add New → Project** →
   importa el repositorio `mi-nuevo-saas` desde GitHub.
2. Vercel detecta Next.js solo; no toques el build (`npm run build` ya
   compila también el widget).
3. Antes de darle a **Deploy**, abre **Environment Variables** y añade las
   dos imprescindibles:

| Variable | Qué es | De dónde sale |
|---|---|---|
| `DATABASE_URL` | La dirección de tu base de datos | Paso 1 (Neon) |
| `AUTH_SECRET` | La llave con la que se firman las sesiones | Genera una: `npx auth secret` o `openssl rand -hex 32` |

4. **Deploy**. En un par de minutos tienes `https://tu-proyecto.vercel.app`.
5. Añade ahora la variable `NEXT_PUBLIC_APP_URL` con esa URL exacta (o tu
   dominio propio cuando lo conectes en **Settings → Domains**) y redeploy.
   Se usa para construir los enlaces de los emails y los snippets del widget.

---

## Paso 3 — El login del equipo (Google y/o GitHub)

Tu equipo entra con "Continuar con Google/GitHub". Configura al menos uno:

**GitHub** (el más rápido):
1. [github.com/settings/developers](https://github.com/settings/developers) →
   **New OAuth App**.
2. Homepage URL: `https://tu-dominio.com` · Callback URL:
   `https://tu-dominio.com/api/auth/callback/github`.
3. Copia el **Client ID** → variable `AUTH_GITHUB_ID`, y genera un **Client
   secret** → `AUTH_GITHUB_SECRET`.

**Google**:
1. [console.cloud.google.com](https://console.cloud.google.com) → APIs &
   Services → Credentials → **Create OAuth client ID** (tipo Web).
2. Redirect URI: `https://tu-dominio.com/api/auth/callback/google`.
3. Client ID → `AUTH_GOOGLE_ID` · Client secret → `AUTH_GOOGLE_SECRET`.

Añade las variables en Vercel y redeploy. Prueba a entrar en `/login`.

---

## Paso 4 — Emails a votantes (Resend) *(opcional pero recomendado)*

Cuando muevas una feature a **Lanzado**, Echoboard avisa por email a todos
los que la votaron. Es tu mejor momento de retención — actívalo:

1. [resend.com](https://resend.com) → crea cuenta → **Domains** → añade tu
   dominio y copia los registros DNS que te pide (SPF/DKIM) en tu proveedor.
2. **API Keys** → crea una → variable `RESEND_API_KEY`.
3. Variable `EMAIL_FROM`, p. ej.: `Echoboard <avisos@tudominio.com>`.

Sin estas variables no pasa nada malo: los envíos simplemente se omiten y
queda registrado en los logs.

---

## Paso 5 — Cobros (Stripe) *(cuando quieras vender)*

1. En [dashboard.stripe.com](https://dashboard.stripe.com) → **Product
   catalog** → crea dos productos con precio recurrente mensual:
   - *Echoboard Starter* — $19/mes → copia su **Price ID** (`price_...`) →
     variable `STRIPE_PRICE_STARTER`.
   - *Echoboard Growth* — $49/mes → su Price ID → `STRIPE_PRICE_GROWTH`.
2. **Developers → API keys** → copia la **Secret key** (`sk_live_...`) →
   variable `STRIPE_SECRET_KEY`.
3. **Developers → Webhooks** → **Add endpoint**:
   - URL: `https://tu-dominio.com/api/stripe/webhook`
   - Eventos: `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`.
   - Copia el **Signing secret** (`whsec_...`) → variable
     `STRIPE_WEBHOOK_SECRET`.
4. Activa el **Customer Portal** en Settings → Billing → Customer portal
   (es lo que permite a tus clientes cambiar de plan o cancelar solos).

> 💡 El plan de una cuenta **solo** lo actualiza el webhook. Si un pago no se
> refleja, revisa en Stripe → Webhooks que las entregas den 200.

---

## Chuleta completa de variables de entorno

| Variable | Obligatoria | Para qué sirve |
|---|---|---|
| `DATABASE_URL` | ✅ | Dónde viven tus datos (Neon/Supabase) |
| `AUTH_SECRET` | ✅ | Firma las sesiones de login y del widget. Si se filtra, rótala |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL pública; construye enlaces de emails y snippets |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | ◽ al menos un proveedor | Botón "Continuar con GitHub" |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | ◽ al menos un proveedor | Botón "Continuar con Google" |
| `RESEND_API_KEY` | opcional | Envío de emails de "Lanzado" a votantes |
| `EMAIL_FROM` | opcional | Remitente de esos emails |
| `STRIPE_SECRET_KEY` | opcional | Cobrar suscripciones (Checkout + Portal) |
| `STRIPE_WEBHOOK_SECRET` | opcional | Verificar que los avisos de pago vienen de Stripe |
| `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_GROWTH` | opcional | Qué precio de Stripe corresponde a cada plan |

---

## Paso 6 — Checklist de lanzamiento

- [ ] `https://tu-dominio.com` carga la landing con el simulador de ROI.
- [ ] Puedes entrar en `/login` y crear tu primer proyecto.
- [ ] El board público responde en `/p/tu-proyecto` y se puede votar.
- [ ] `https://tu-dominio.com/widget.js` responde (es el widget embebible).
- [ ] (Si Resend) mueve un post de prueba a "Lanzado" y comprueba el email.
- [ ] (Si Stripe) haz un checkout con la tarjeta de prueba `4242 4242 4242 4242`
      en modo test antes de pasar a claves live.
- [ ] El webhook de Stripe muestra entregas 200 en su panel.

**¿Algo falla?** Los logs en vivo están en Vercel → tu proyecto → **Logs**.
Los tres sospechosos habituales: una variable con espacios de más al pegarla,
la callback URL del OAuth que no coincide exactamente con tu dominio, y
migraciones sin aplicar (paso 1.4).
