# Echoboard — Motor de ROI y Alertas de Churn

> Memoria técnica de negocio. Las fórmulas de este documento son la única
> fuente de verdad: viven en código en `src/lib/roi.ts` (simulador) y
> `src/lib/churn.ts` (alertas). Si cambian los supuestos, se cambian aquí
> primero y el código después.

---

## 1. Simulador de ROI (landing)

### Inputs del visitante

| Variable | Símbolo | Rango del slider | Default |
|---|---|---|---|
| Sugerencias de feedback / mes | `S` | 10 – 500 | 80 |
| ARPU (ingreso medio por cliente de pago, $/mes) | `A` | 10 – 500 | 49 |

### Supuestos del modelo (documentados y conservadores)

| Supuesto | Valor | Justificación |
|---|---|---|
| Tiempo de triage por sugerencia | **10 min** | Leer, deduplicar y clasificar a mano cada entrada |
| Sugerencias que llegan a construirse | **10 %** | Tasa típica de selección de backlog público |
| Horas de desarrollo por feature seleccionada | **8 h** | Feature mediana de un equipo pequeño |
| Features mal priorizadas al ordenar por votos | **35 %** | Sin datos de revenue, el ruido gana a la señal |
| Votos medios por sugerencia | **1,8** | Media observada en boards públicos activos |
| % de votantes que son clientes de pago | **25 %** | Mezcla free/pago habitual en SaaS B2B |
| % del MRR de pago que queda enterrado bajo el volumen | **40 %** | Los pocos votos de clientes grandes pierden contra los muchos votos gratuitos |
| Recuperable al accionar la señal | **25 %** | Solo un cuarto del margen silencioso se convierte en retención/expansión: prudencia |
| Coste hora de desarrollo | **$60** | Coste medio cargado |

### Fórmulas

```
1. Horas desperdiciadas / mes
   H = S × (10/60)                    (triage manual)
     + S × 0,10 × 8h × 0,35           (features mal priorizadas)
   H = S × 0,4467

2. Margen Silencioso ($/mes de clientes de pago ignorados)
   M = S × 1,8 votos × 0,25 pago × A × 0,40 enterrado
   M = S × A × 0,18

3. Valor mensual recuperable
   V = M × 0,25 + H × $60

4. Plan recomendado por volumen
   S ≤ 30  → Free ($0)   ·   31–150 → Starter ($19)   ·   > 150 → Growth ($49)

5. Payback (días hasta que Echoboard se paga solo)
   P = ceil( precio_plan / (V / 30) ),  mínimo 1 día
   Plan Free → payback inmediato (ROI desde el primer día)
```

**Ejemplo** (defaults S=80, A=$49): H ≈ 35,7 h/mes · M ≈ $705,6/mes ·
V ≈ $2.320/mes · plan Starter ($19) · P = 1 día.

### Reglas de presentación

- Cifras grandes en **Fraunces**; unidades y desglose en Geist Mono `tabular-nums`.
- Los números **cuentan hacia su valor** con easing `1-(1-p)³` en ~450 ms vía
  `requestAnimationFrame`; con `prefers-reduced-motion` se asignan en seco.
- Los sliders actualizan **en el mismo frame** (estado local puro, cero red).
- CTA dinámico: nombra el plan recomendado y lleva a `/login`.
- Honestidad: el bloque enlaza los supuestos ("modelo conservador, ajústalo
  a tu caso") — un simulador que parece magia genera desconfianza B2B.

---

## 2. MRR en Riesgo (alertas de churn en el dashboard)

### Intuición de negocio

Un cliente de pago que vota una feature y ve el post meses parado está
acumulando motivos para irse. El silencio es el primer síntoma del churn: el
dashboard debe convertirlo en una señal visible antes de que sea una baja.

### Algoritmo (`src/lib/churn.ts`)

Un post entra en riesgo cuando se cumplen las tres condiciones:

1. **Hay dinero esperando**: `revenue_impact > 0`.
2. **Está parado**: su estado pertenece a una categoría "sin movimiento"
   (`open` o `planned`). `in_progress` ya es respuesta, `shipped`/`closed`
   son resolución.
3. **Lleva demasiado sin señales**: `updated_at` (que cambia con cada
   transición de estado o edición) tiene una antigüedad de:
   - **≥ 30 días → nivel «watch»** (ámbar): atención temprana.
   - **≥ 60 días → nivel «risk»** (terracota): riesgo real de cancelación.

```
edad = hoy − updated_at (días enteros)
nivel = edad ≥ 60 → "risk" · edad ≥ 30 → "watch" · si no → sin alerta
MRR en riesgo = revenue_impact del post
```

### Presentación

- Badge minimalista en mono: `$1.700 · 72 d` con punto de tinta ámbar
  (watch) o terracota (risk). Nada estridente: es un libro de cuentas, no
  una alarma de incendios.
- Tooltip al hover/focus (accesible, `role="tooltip"`):
  *"Este post acumula $X de clientes activos que llevan N días esperando.
  Programarlo reduce el riesgo de cancelación."*
- Aparece en el **listado del dashboard** (junto al título) y en las
  tarjetas de la columna *Planificado* del kanban (solo miembros — el MRR
  jamás se muestra a visitantes).

### Limitaciones conocidas (v1)

- `updated_at` es un proxy: un retoque de texto también lo refresca. v2
  debería mirar la última transición de estado real (tabla de actividad).
- El MRR en riesgo usa el agregado del post, no filtra votantes que ya
  cancelaron. Aceptable mientras los end users se sincronicen por SSO/API.
