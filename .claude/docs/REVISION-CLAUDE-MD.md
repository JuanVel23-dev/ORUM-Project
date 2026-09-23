# Revisión de `CLAUDE.md` — T7, puerta dura del rediseño

> `docs-handoff` · propuesta, no aplicada · 30/08/2026
> Exige: `.claude/docs/PLAN-rediseno-miembros.md` (P4, RUP-1, RUP-2, RUP-4, §2b)
> **No se ha editado `CLAUDE.md`.** Este documento es el diff que el propietario
> aplica a mano. Ningún agente lo copia por iniciativa propia.

## Por qué esto va antes de tocar una pantalla

Mientras `CLAUDE.md` diga lo que dice hoy, el rediseño se revierte solo: cada
sesión nueva lo carga, `code-reviewer` marca el botón dorado y el nombre del
plan como violaciones, y `frontend-implementer` las "corrige" obedientemente.
Este diff cierra esa contradicción antes de que exista código que la sufra.

Cubre **solo** los dos cambios que el propietario marcó como obligatorios y que
no dependen de trabajo todavía sin terminar (T4/T5 del plan: tokens nuevos y su
auditoría de contraste no existen aún en `.claude/docs/`). Todo lo demás de
`CLAUDE.md` —incluida la tabla de contrastes fuera de la fila nueva— **quiere
decir hoy exactamente lo que decía ayer**.

---

## Cambio 1 — Separar «producto» de «estado de membresía»

**Sección**: `## Lo que ORUM es` (líneas 14–19 de la versión actual).

**Riesgo si no se corrige**: un agente lee «el estado es binario», concluye que
los planes sobran, y borra el nombre del plan del carnet de todos los socios.

### Quitar (literal)

```markdown
Club de beneficios. Un solo producto: **la membresía mensual**. No hay niveles ni
planes premium. El estado de un miembro es **binario: paga o no paga**.
```

### Poner (literal)

```markdown
Club de beneficios por membresía. Dos ejes que no se deben confundir:

- **El producto no es binario.** `planes_membresia` sostiene varios planes con
  precio y duración propios (`precio numeric`, `duracion_meses integer`), y
  `membresias.plan_id` apunta a uno de ellos. Que el carnet muestre `plan.nombre`
  (`src/app/miembros/(portal)/perfil/page.tsx:72`) es correcto, no un defecto.
- **El estado de la membresía sí es binario: vigente o no.** Se deriva siempre
  con `derivarEstadoMembresia` — ver "Estado de membresía" más abajo, que **no
  cambia** con esta revisión.
```

### Por qué, con evidencia

El esquema real contradice la frase de hoy: `planes_membresia` es una tabla
completa (`nombre`, `descripcion`, `precio numeric CHECK (precio >= 0)`,
`duracion_meses integer DEFAULT 1`, `activo`) que soporta N planes con precio y
duración distintos, y existe una sección de administración para gestionarlos.
El carnet lo confirma en producción: `perfil/page.tsx:72` lee
`{plan?.nombre ?? 'Membresía ORUM'}` y en el carnet de prueba se lee "PREMIUM".
El carnet es correcto; la norma vieja fundía dos ejes independientes —qué plan
compró (no binario) y si está vigente (sí binario)— en una sola frase, y esa
fusión es el error. La sección "Estado de membresía" del propio `CLAUDE.md`
(líneas 77–93 hoy) ya describe correctamente el segundo eje: no se toca una
palabra de ahí.

---

## Cambio 2 — El oro como color de acción, condicionado a contraste

**Sección**: `## El oro` (líneas 52–73 de la versión actual).

**Lo que NO se relaja**: un relleno de acción debe cumplir **a la vez** 4.5:1
texto/relleno (WCAG 1.4.3) y 3:1 borde/superficie (WCAG 1.4.11). Ningún número
de esta propuesta se da por medido salvo que ya lo estuviera en `CLAUDE.md`.

### Quitar (literal)

```markdown
**El oro es color de MARCA, no de acción, y jamás codifica datos.**

- Botón primario = **tinta**: negro sobre claro, blanco sobre oscuro.
- El oro vive en: wordmark, indicador de ruta activa, anillo de focus, hairlines,
  y el CTA comercial del Portal Público.
- Presupuesto: **≤5% del área visible** por pantalla.

Contrastes verificados — no los cambies sin recalcular:

| Uso | Token | Ratio |
|---|---|---|
| Texto dorado sobre oscuro | `--gold-300` | 13.0:1 |
| Marca sobre oscuro | `--gold-500` | 7.94:1 |
| Texto negro sobre oro (CTA) | `--n-1000` | 7.94:1 |
| Texto dorado sobre claro | `--gold-700` | 5.44:1 |
| Focus/filos en claro | `--gold-600` | 3.66:1 |
| ⛔ `--gold-500` sobre blanco | | **2.49:1 — prohibido** |
```

### Poner (literal)

```markdown
**El oro es color de MARCA siempre.** Es color de acción **solo** donde se
indica abajo, y solo mientras el par relleno/texto cumpla los dos ratios de
contraste de esta sección. Donde no se cumplan, sigue siendo tinta.

- **Panel de Administración y Herramienta de Comercios**: botón primario =
  **tinta**, negro sobre claro, blanco sobre oscuro. No cambia.
- **Portal de Miembros y las seis pantallas de acceso**: el botón primario
  puede usar relleno dorado con texto en tinta, **condicionado** a que el par
  concreto cumpla a la vez:
  - **4.5:1** entre el texto y el relleno (WCAG 1.4.3).
  - **3:1** entre el borde del relleno y la superficie que lo rodea, en **los
    dos temas** donde se use (WCAG 1.4.11).
  Si el par no llega a esos dos números, el primario de esa pantalla **vuelve
  a tinta**. No hay apaño de borde que sustituya la medición, y no se aprueba
  con una estimación: solo con el ratio firmado por `accessibility-auditor`.
- El oro vive en: wordmark, indicador de ruta activa, anillo de focus,
  hairlines, y —donde el punto anterior lo habilite— la acción principal del
  recorrido del cliente. (La versión anterior citaba "el CTA comercial del
  Portal Público" como única excepción: ese portal y ese CTA nunca se
  construyeron. Se retira la referencia).
- Presupuesto: **≤5% del área visible** por pantalla.

Contrastes verificados — no los cambies sin recalcular:

| Uso | Token | Ratio |
|---|---|---|
| Texto dorado sobre oscuro | `--gold-300` | 13.0:1 |
| Marca sobre oscuro | `--gold-500` | 7.94:1 |
| Texto negro sobre oro | `--n-1000` | 7.94:1 |
| Texto dorado sobre claro | `--gold-700` | 5.44:1 |
| Focus/filos en claro | `--gold-600` | 3.66:1 |
| ⛔ `--gold-500` sobre blanco | | **2.49:1 — prohibido** |
| ⏳ Relleno de acción `--gold-600` + texto tinta | `--gold-600` | **sin verificar.** Estimación preliminar ~5.8:1, no confirmada. No usar como botón primario hasta que esta fila lleve un número firmado por `accessibility-auditor` y esta nota desaparezca. |
```

### Por qué, con evidencia

`grep` sobre todo `src/` para "Portal Público" y "CTA comercial" no devuelve
ningún archivo: la excepción que la norma sancionaba apunta a una pantalla que
nadie construyó. La condición de contraste no es nueva, es la misma regla de
hoy aplicada a un par distinto: `tokens.css:47-53` ya documenta que
`--gold-500` sobre blanco da 2.49:1 y está prohibido, y esa fila no cambia. El
candidato `--gold-600` (borde 3.66:1, ya verificado) con texto tinta tiene una
estimación de ~5.8:1 que **nadie ha medido con el algoritmo de contraste**: por
eso entra en la tabla marcado `sin verificar` y no como fila normativa. Migrar
esa fila de "sin verificar" a un número firmado es trabajo de
`accessibility-auditor` (T5/T6 del plan), no de esta revisión.

`Button` ya declara la variante `gold` (`src/components/ui/button.tsx:6`), así
que esta regla no crea capacidad nueva: solo decide dónde se admite usarla como
`primary`. El comentario de ese mismo archivo, línea 12
(`` `gold` es ceremonial: reservada al CTA comercial ``), queda desalineado en
cuanto se aplique este diff — es código, no se toca aquí, pero quien implemente
la variante condicionada debe actualizarlo en el mismo commit.

---

## Alcance: lo que este diff no toca

Confirmado por lectura directa de `CLAUDE.md` antes de escribir este documento.
Ninguna de estas secciones cambia una palabra:

- `## Estado de membresía` y `derivarEstadoMembresia`.
- `### Fechas` (`timestamptz` vs fecha civil, `Date.UTC`, `inicioDiaBogota`/`finDiaBogota`).
- `## Formularios: overlay, no página` y la ranura única `@modal` en `app/admin/layout.tsx`.
- La regla de `QrCode` en negro sobre blanco en ambos temas.
- `## Accesibilidad: mínimos no negociables` (área táctil, `:focus-visible`, nunca `tabIndex={-1}`).
- Las prohibiciones técnicas de la tabla `## Prohibiciones duras`: animar solo
  `transform`/`opacity`, `none` dentro de una lista de sombras, `backdrop-filter`
  en filas de lista, `outline: none` sin sustituto.

Otras rupturas que el plan lista (RUP-3 movimiento, RUP-5 carruseles, RUP-6
placa del logo) **no entran en este diff** porque dependen de entregables que
todavía no existen en `.claude/docs/` (spec de T2, tokens de T4, auditoría de
T5). Se revisarán en un segundo diff cuando esos documentos existan, para no
escribir en `CLAUDE.md` una regla que cite un token o una spec que nadie ha
producido todavía.

---

## Lista de comprobación para el propietario

Antes de pegar este diff en `CLAUDE.md`:

- [ ] Confirmar que `src/app/miembros/(portal)/perfil/page.tsx:72` sigue
      mostrando `plan?.nombre` en el momento de aplicar (la línea puede haberse
      movido; buscar por el texto `plan?.nombre ?? 'Membresía ORUM'` si el
      número cambió).
- [ ] Confirmar con `grep -r "CTA comercial\|Portal Público" src/` que sigue sin
      haber resultados antes de retirar esa frase — si alguien construyó algo
      con ese nombre entre esta revisión y su aplicación, la frase no sobra.
- [ ] **No fusionar la fila `--gold-600` de la tabla como verificada.** Debe
      quedar marcada `sin verificar` hasta que `accessibility-auditor` entregue
      el ratio firmado (texto/relleno **y** borde/superficie, en claro y en
      oscuro, porque las pantallas de acceso se sirven siempre en oscuro).
- [ ] Si `accessibility-auditor` **no** confirma 4.5:1, aplicar solo el Cambio
      1 de este documento y dejar `## El oro` con el texto de "Quitar" tal cual
      está hoy — no con el de "Poner" a medias.
- [ ] Si se confirma un ratio distinto de ~5.8:1, sustituir la estimación por
      el valor real antes de quitar la marca `sin verificar`, no después.
- [ ] Encargar, fuera de este diff, que quien implemente el botón dorado
      actualice el comentario de `src/components/ui/button.tsx:12` (menciona un
      CTA que ya no existe como única razón de ser de la variante).
