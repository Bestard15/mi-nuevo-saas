# Echoboard — Sistema de Diseño

> Memoria a largo plazo del equipo de diseño. Toda decisión visual del producto se
> justifica aquí. Si un cambio de UI contradice este documento, o se actualiza el
> documento o se descarta el cambio.

---

## 1. Identidad y taste

### El concepto: «minimalismo de libro de cuentas» (ledger minimalism)

Echoboard convierte feedback en decisiones de dinero. La interfaz debe sentirse como
el cuaderno de un contable con un gusto exquisito: **papel inmaculado, tinta casi
negra, y una sola tinta de color que se usa cuando hay algo que decir**. La cifra de
MRR es la protagonista de cada pantalla; todo lo demás es soporte.

### Referencias de alta gama (qué robamos de cada una)

| Referencia | Qué tomamos |
|---|---|
| **Linear** | Contención: pocos colores, jerarquía por peso tipográfico, nada grita |
| **Stripe** | Sombras tintadas del color de acento, gradientes atmosféricos sutiles |
| **Vercel/Geist** | El blanco como material, hairlines de 1px, mono para datos |
| **Amie / Family** | Microinteracciones con física natural, la UI se siente «viva» |
| **Editorial impreso** | Serif de display con carácter, números viejos, eyebrows en versalitas |

### «Anti-genérico»: reglas duras

1. **Prohibido el grid de cards con borde gris.** Si tres cosas van juntas, se separan
   con espacio y hairlines, no con seis cajas idénticas. Una card solo existe si es
   interactiva o si agrupa datos que viven juntos (el preview del board, un plan).
2. **El color se gasta, no se decora.** El verde solo aparece pegado a una cifra de
   dinero. El índigo solo en la acción principal y en el acento del titular. Si una
   pantalla tiene más de dos tintas, sobra una.
3. **Los números son protagonistas**: siempre en mono, siempre `tabular-nums`,
   siempre con su unidad (`/mes`). Un «$4.830» bien puesto vende más que un párrafo.
4. **Nada de simetría perfecta de plantilla**: el hero es asimétrico (7/5), el
   preview del board va ligeramente rotado, los delays de entrada están escalonados.
   La perfección mecánica huele a IA; la intención huele a estudio.
5. **Voz editorial**: los textos afirman («El modo oscuro puede esperar. El CSV de
   $4.830/mes, no»). Cero lorem-ipsum-speak («Potencia tu productividad»).

---

## 2. Paleta de colores

Base blanca **cálida** (el blanco puro de monitor es estéril; un grado de calidez lo
convierte en papel). Tinta con un matiz frío para el contraste. Todo en `oklch`.

| Token | Valor | Uso |
|---|---|---|
| `--background` (papel) | `oklch(0.993 0.0024 95)` | Lienzo global, blanco cálido |
| `--foreground` (tinta) | `oklch(0.19 0.014 265)` | Texto principal, casi negro azulado |
| `--primary` (índigo eléctrico) | `oklch(0.545 0.222 277)` | CTA principal, links de acción, acento del hero |
| **Verde MRR** `--revenue` | `oklch(0.60 0.145 160)` | **EXCLUSIVO para cifras de dinero.** Nunca decorativo |
| `--muted-foreground` | `oklch(0.50 0.016 265)` | Texto secundario (contraste AA sobre papel) |
| `--border` (hairline) | `oklch(0.925 0.005 95)` | Líneas de 1px; jamás border-2 |
| Ámbar (avisos) | `amber-500/10 + /40` | Estados de atención (gates de plan, keys) |

**Gradientes atmosféricos**: solo en la landing, como `radial-gradient` de índigo y
verde a ≤ 8% de alfa, desenfocados (`blur-3xl`), detrás del contenido. Nunca en la app.

**Sombras tintadas**: la sombra negra pura ensucia el papel. Las elevaciones usan el
índigo como tinte:

```css
--shadow-soft:  0 1px 2px oklch(0.545 0.222 277 / 0.06), 0 8px 24px -12px oklch(0.545 0.222 277 / 0.12);
--shadow-lift:  0 2px 4px oklch(0.545 0.222 277 / 0.08), 0 16px 48px -16px oklch(0.545 0.222 277 / 0.22);
```

---

## 3. Tipografía

Dos voces, contraste máximo entre ellas:

| Rol | Fuente | Uso |
|---|---|---|
| **Display** | **Fraunces** (serif, optical sizing, 500–600) | H1/H2 de landing, cifras-titular, CTA final. Tracking `-0.02em`. La palabra clave del titular va en *itálica* con color primario |
| **Interfaz** | **Geist Sans** | Todo el producto: párrafos, forms, dashboard |
| **Datos** | **Geist Mono** | Dinero, contadores, API keys, código. Siempre `tabular-nums` |

### Escala estricta (rem)

| Token | Tamaño / interlínea | Uso |
|---|---|---|
| `display-xl` | 4rem / 1.05 | H1 landing (desktop) |
| `display-lg` | 2.5rem / 1.1 | H2 de sección |
| `title` | 1.25rem / 1.3 | Títulos de card/feature |
| `body` | 1rem / 1.6 | Párrafo |
| `small` | 0.875rem / 1.5 | UI densa, tablas |
| `caption` | 0.75rem / 1.4 | Metadatos, eyebrows |

**Eyebrow**: versalitas sintéticas — `text-xs uppercase tracking-[0.18em] font-medium`
en color primario. Abre toda sección de landing; sustituye a los badges genéricos.

---

## 4. Espacio y layout

Base de **8pt**. El espacio en blanco es el separador por defecto; el borde es la
excepción.

- **Secciones de landing**: `py-24` a `py-32` (96–128px). Entre bloque de título y
  contenido: `mt-12/16`. El aire vende premium; apretarlo lo mata.
- **Regla de un solo nivel de borde**: dentro de una card no hay más cajas con borde.
  Sub-agrupaciones → espacio + hairline `border-t` como en un libro de cuentas.
- **Anchos**: contenido de landing `max-w-5xl`; párrafos nunca > `max-w-xl` (65ch).
- **Asimetría intencional**: hero en grid 7/5; el preview del board rota `-1.5deg`
  y se endereza al hover. Los features van en lista indexada (01, 02…), no en cajas.
- **La app** (dashboard/board) hereda tokens: papel cálido, hairlines, sombras
  tintadas, radio `0.75rem`. Sin refactor estructural: el sistema la eleva solo.

---

## 5. Movimiento (microinteracciones)

La física antes que el adorno. Curva de la casa:

```css
--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);  /* frena como un objeto real */
```

| Patrón | Especificación |
|---|---|
| **Entrada de sección** | `rise`: opacity 0→1 + translateY(14px)→0, 700ms, escalonado 70–90ms por elemento (clases `.rise` + `.rise-1..n`) |
| **Hover en botón** | 200ms; primario: sombra tintada crece + `translateY(-1px)`; `active:` vuelve a 0 (sensación de pulsación) |
| **Hover en card/plan** | `translateY(-2px)` + `--shadow-lift`, 250ms |
| **Preview del board** | rotación -1.5deg → 0deg al hover, 500ms `--ease-out-soft` |
| **Links de nav** | color 150ms; subrayado con `underline-offset-4` |

**Reglas**: nada > 700ms; nunca animar `width/height` (solo transform/opacity);
`prefers-reduced-motion: reduce` desactiva todas las animaciones de entrada.

---

## 6. Checklist antes de mergear UI

- [ ] ¿Hay más de dos tintas de color en la pantalla? Elimina una.
- [ ] ¿El verde aparece lejos de una cifra de dinero? Quítalo.
- [ ] ¿Hay cards con borde solo para agrupar texto estático? Sustituye por espacio.
- [ ] ¿Todos los números van en mono con `tabular-nums`?
- [ ] ¿Los hovers tienen transición y las entradas respetan `reduced-motion`?
- [ ] ¿El titular usa Fraunces y el eyebrow versalitas con tracking?
