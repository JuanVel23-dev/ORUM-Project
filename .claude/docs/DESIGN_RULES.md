# Reglas de diseño — dónde están

> **Este archivo NO define tokens.** Es un puntero.
>
> ORUM ya tiene un sistema de diseño completo, verificado y en producción. Este
> documento existe solo para que ningún agente lo reconstruya por su cuenta.

Estado: `PUNTERO — no requiere generación`

---

## La fuente de verdad, en tres archivos

| Fuente | Qué manda | Autoridad |
|---|---|---|
| **`CLAUDE.md`** (raíz del proyecto) | La norma: prohibiciones duras, la regla del oro, contrastes verificados, estado de membresía, formularios en overlay, accesibilidad | **Normativo.** Se carga en cada sesión |
| **`src/styles/tokens.css`** | Los valores: color, espaciado, radio, sombra, duración, curva | **Único origen.** Todo sale de aquí vía `var(--…)` |
| **`src/lib/shared/motion.ts`** | Los resortes y las constantes de movimiento | Único origen para animación con `motion` |

Complemento histórico — el porqué de cada decisión:
[`docs/superpowers/specs/2026-08-04-rediseno-visual-orum-design.md`](../../docs/superpowers/specs/2026-08-04-rediseno-visual-orum-design.md)

---

## Por qué este archivo está vacío de valores

La plantilla original de este equipo de agentes pedía que `design-system-architect`
generase aquí una paleta, una escala tipográfica, radios, sombras y tokens de motion.

**Hacer eso en ORUM sería el fallo exacto que `CLAUDE.md` existe para prevenir.** Su
primer párrafo lo dice sin rodeos:

> *«Existe porque ya pasó una vez: dos sesiones trabajaron en paralelo y construyeron
> dos sistemas de diseño incompatibles sobre los mismos archivos.»*

Un segundo documento de tokens no es documentación: es un segundo sistema. En cuanto
alguien cambia `tokens.css` sin acordarse de este archivo, las dos fuentes divergen y
la siguiente sesión no sabe cuál obedecer.

La plantilla, además, ya contradecía el repositorio en tres puntos concretos:

- Proponía `motion-fast: 150ms / ease-out` y una escala de duraciones propia, cuando
  las curvas y duraciones reales viven en `tokens.css` y los resortes en `motion.ts`.
- Buscaba clases arbitrarias de **Tailwind** (`[13px]`, `[#ff0000]`) y hablaba de
  `tailwind.config`. **ORUM no usa Tailwind:** son **CSS Modules** (`.module.css`).
- Su escala de espaciado (`4px` base, 0-1-2-3-4-6-8-12-16-24) es inventada respecto a
  la que declara `tokens.css`.

---

## Qué hacer en su lugar

- **Para saber cuál es la regla** → `CLAUDE.md`, sección correspondiente.
- **Para saber cuál es el valor** → `src/styles/tokens.css`. Léelo, no lo recuerdes.
- **Para auditar coherencia visual** → `design-system-architect` en modo **AUDITAR**,
  que contrasta el código contra esas dos fuentes. Es su único modo.
- **Si crees que falta un token** → no lo inventes aquí ni en la hoja que estés
  tocando. Es una propuesta razonada a `tech-lead`, con el caso de uso que lo exige.

---

## Lo único que este archivo sí puede añadir

Cuando una auditoría descubra una regla **implícita** que el código respeta de forma
consistente pero `CLAUDE.md` no enuncia, anótala abajo como observación —nunca como
token nuevo— y propón elevarla a `CLAUDE.md`.

### Observaciones pendientes de elevar

_(vacío)_
