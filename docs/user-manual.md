# 📖 Manual de Echoboard (para humanos ocupados)

> Si diriges un negocio y no escribes código, este manual es para ti.
> En 10 minutos de lectura sabrás qué es Echoboard, por qué te hace ganar
> dinero y cómo dejarlo funcionando en tu web hoy mismo.

---

## ¿Qué es Echoboard? (la analogía del buzón)

Imagina el clásico **buzón de sugerencias** de una cafetería. Los clientes
echan papelitos: "poned más enchufes", "abrid los domingos", "quiero leche de
avena". El problema del buzón de toda la vida: **todos los papelitos parecen
iguales**. El de un cliente que desayuna allí cada día vale lo mismo que el
de alguien que entró una vez a pedir el baño.

Echoboard es ese buzón, pero **cada papelito lleva grapado el ticket de
compra de quien lo escribió**. Cuando abres el buzón no ves solo "12 personas
piden leche de avena" — ves *"estas 12 personas se gastan 340 € al mes en tu
cafetería"*. De repente, decidir qué hacer primero es fácil.

En tu SaaS es igual: tus usuarios proponen y votan mejoras en un tablero
público, y Echoboard te dice **cuántos ingresos respaldan cada petición**.

---

## Mini-glosario sin tecnicismos

| Verás escrito… | Significa simplemente… |
|---|---|
| **MRR / revenue** | Los **ingresos mensuales** que te pagan tus clientes (sus suscripciones) |
| **MRR impactado** | Cuántas suscripciones, en dinero al mes, respaldan una petición concreta |
| **Churn / MRR en riesgo** | **Fuga de clientes**: dinero de clientes que podrían cancelar si les sigues ignorando |
| **ARPU** | Lo que te paga **de media** cada cliente al mes |
| **Board / tablero** | El buzón de sugerencias público de tu producto |
| **Post** | Cada sugerencia o petición del tablero |
| **Roadmap** | El tablón "qué está planificado / en marcha / ya hecho" |
| **Changelog** | El diario de novedades: lo que has ido lanzando |
| **Widget** | El botón flotante de "Feedback" que va dentro de tu web |
| **Identificar usuarios (SSO)** | "Presentarle" tus clientes a Echoboard para que sepa cuánto paga cada uno (esto lo conecta tu desarrollador con 10 líneas de código) |

---

## Tu primer tablero en 5 minutos ⏱️

**Minuto 1 — Entra.** Ve a la web de tu Echoboard → **Entrar** → botón de
Google o GitHub. Sin contraseñas.

**Minuto 2 — Crea tu proyecto.** Escribe el nombre de tu producto (p. ej.
*FacturaFácil*) y pulsa crear. Echoboard te monta solo el tablero de
sugerencias, el roadmap, el changelog y los estados (Abierto → Planificado →
En progreso → Lanzado).

**Minuto 3 — Mira tu tablero público.** Tendrá una dirección tipo
`tudominio.com/p/facturafacil`. Esa URL ya la puedes compartir con clientes:
pueden proponer ideas y votar sin registrarse en ningún sitio.

**Minutos 4–5 — Pon el widget en tu web.** En tu panel → **API y webhooks**
no hace falta entrar; ve a la tarjeta **Widget embebible** del dashboard,
copia la línea que empieza por `<script src=...` y pégasela a tu
desarrollador (o pégala tú en tu web, justo antes de `</body>`; en Webflow,
Framer o WordPress hay una casilla de "custom code" para esto). Al recargar
tu web aparecerá un botón flotante **Feedback**: tus usuarios opinan sin
salir de tu producto.

🎉 Ya está. Todo lo demás es opcional y se puede hacer otro día.

---

## El superpoder: ordenar por dinero

En tu **dashboard** (tu panel privado), la lista de peticiones tiene tres
pestañas: *Por revenue*, *Por votos* y *Más nuevos*. La primera es la
importante: ordena las peticiones por **cuántos ingresos mensuales las
respaldan**.

Para que ese número exista, Echoboard necesita saber quién es cada votante y
cuánto paga. Eso se activa una vez, con ayuda de tu desarrollador: en el
dashboard → tarjeta **Identificación de usuarios (SSO)** hay instrucciones de
copiar-y-pegar (son ~10 líneas en vuestro servidor). Desde ese momento, cada
voto llega "con su ticket de compra grapado".

> Mientras tanto, los votos anónimos funcionan igual — solo que cuentan como
> 0 € y no engordan la columna de ingresos.

---

## Las alertas de "dinero en riesgo" 🔶

Si una petición acumula dinero de clientes y lleva **más de 30 días** sin que
la muevas de estado, verás junto a su título una etiqueta discreta tipo
`$2,400 · 72 d`. Traducción: *hay 2.400 dólares al mes de clientes reales
esperando una respuesta desde hace 72 días*. Cuanto más tiempo, más riesgo de
que alguno se canse y se vaya (eso es la "fuga de clientes").

**¿Qué hacer al verla?** No hace falta construir la feature mañana. Basta con
mover el post a *Planificado* o dejar un comentario del equipo: la gente
perdona la espera, no el silencio.

---

## Cerrar el círculo: Lanzado = email automático

Cuando termines una mejora, cambia su estado a **Lanzado** desde el dashboard
o desde la propia página del post. Echoboard enviará **automáticamente un
email a todas las personas que la votaron**: "eso que pediste, ya está".

Es el email más rentable que enviarás nunca, y no tienes que acordarte de
nada. (Solo se envía una vez por post, aunque cambies el estado mil veces.)

Remata publicando una nota en el **Changelog** (dashboard → Changelog →
escribes en borrador → **Publicar** cuando esté lista).

---

## Los planes, en cristiano

| Plan | Precio | Qué añade |
|---|---|---|
| **Free** | $0 | Todo lo esencial: tablero, roadmap, changelog, widget, emails de Lanzado, tableros privados |
| **Starter** | $19/mes | Conectar Echoboard con tus propios sistemas (la "API"): crear peticiones y votos desde tu app automáticamente |
| **Growth** | $49/mes | Avisos instantáneos a tus sistemas cuando pasa algo (los "webhooks") — para equipos que integran el feedback con Slack, su CRM, etc. |

El precio es **plano**: no pagas más por tener más usuarios opinando. Cambias
de plan (o cancelas) tú solo desde **Facturación → Gestionar suscripción**,
sin escribir a nadie.

---

## Preguntas rápidas

**¿Mis competidores verán mi tablero?** Solo si quieres. Con un clic en
"Hacer privado", el tablero solo lo ven tu equipo y tus clientes
identificados; el resto del mundo recibe un "no existe".

**¿Puedo borrar una sugerencia ofensiva?** Sí: entra al post → *Eliminar
post*. Los comentarios también se pueden borrar uno a uno.

**¿Qué pasa si dos personas piden lo mismo?** El propio formulario avisa a
quien escribe: *"esto se parece a X — mejor vótala"*. Los duplicados bajan
solos.

**¿Necesito programador para empezar?** No. Solo lo necesitarás (10 minutos)
para la identificación de usuarios con sus pagos, y para pegar el widget si
no tienes acceso al código de tu web.
