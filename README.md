# ORUM

Plataforma web de **club de beneficios**: conecta a los **miembros** con una red de
**comercios aliados** para que accedan a descuentos y promociones.

Hay un solo producto: **la membresía mensual**. No existen niveles ni planes premium;
el estado de un miembro es **binario — paga o no paga**.

---

## Antes de escribir código

> ### 📐 Lee [`CLAUDE.md`](CLAUDE.md)
>
> Contiene las reglas del sistema de diseño: qué es oro y qué no, qué está prohibido,
> cómo se anima, dónde va cada archivo. **No es documentación opcional ni es solo para
> herramientas de IA** — es el contrato de la capa de presentación.
>
> Existe porque ya pasó: dos sesiones trabajando en paralelo construyeron dos sistemas
> de diseño incompatibles sobre los mismos archivos.

Los cinco puntos que más se rompen sin querer:

1. **No hay clases `.orum-*`.** Esa capa se eliminó. Todo sale de `src/components/ui/`.
2. **Nada de valores literales** de color, espaciado o duración: van por `var(--…)` desde
   `src/styles/tokens.css`.
3. **Un formulario no navega.** Se abre encima, como ruta interceptada bajo
   `src/app/admin/@modal/`.
4. **Nunca leas `membresias.estado` en crudo.** Esa columna no se actualiza al vencer.
   Usa `derivarEstadoMembresia`.
5. **Rangos de fecha contra columnas `timestamptz`** van con `inicioDiaBogota` /
   `finDiaBogota` (`src/lib/shared/fecha.ts`), nunca con una cadena suelta.

---

## Documentos del proyecto

| | |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Reglas del sistema de diseño |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Estado por fases y próximos pasos |
| [`docs/AUDITORIA-SEGURIDAD.md`](docs/AUDITORIA-SEGURIDAD.md) | Revisión de seguridad y OWASP Top 10 |
| [`docs/BACKEND-PENDIENTE.md`](docs/BACKEND-PENDIENTE.md) | Lo que necesita backend: qué se observó y por qué importa |

---

## Requisitos

| | |
|---|---|
| **Node** | **≥ 22.13** — declarado en `.nvmrc` y en `engines` |
| **Gestor** | **pnpm** (no npm, no yarn) |
| **Backend** | Supabase — el esquema ya existe, no se crea desde aquí |

Node 20 **no sirve**: pnpm 11 usa `node:sqlite`, que no existe antes de la 22.13, y el
instalador falla con `No such built-in module`.

## Puesta en marcha

```bash
corepack enable pnpm     # una sola vez por máquina
pnpm install

cp .env.example .env.local   # y rellena las tres claves de Supabase

pnpm dev                 # http://localhost:3000
```

`.env.local` está en `.gitignore` y **nunca** debe subirse.

## Comandos

```bash
pnpm dev      # desarrollo
pnpm build    # compilación de producción
pnpm lint     # ESLint
pnpm test     # Vitest — solo funciones puras
```

**Antes de dar algo por hecho**, los cuatro juntos:

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

Y **míralo renderizado**. Medir con `getComputedStyle` durante una transición da
resultados falsos: en una pestaña que el navegador no pinta, la transición no avanza.

---

## Los cuatro portales

| Portal | Ruta | Quién entra |
|---|---|---|
| Público | `/` | Cualquiera *(pendiente)* |
| Administración | `/admin` | `super_admin`, `empleado` |
| Miembros | `/miembros` | `miembro` |
| Comercios | `/comercios` | `comercio` |

## Dónde vive cada cosa

```
src/
  app/            rutas (Server Components por defecto)
    admin/@modal/ formularios en superposición (rutas interceptadas)
  components/ui/  el kit de diseño — kebab-case + CSS Modules
  lib/            por dominio: auth · miembros · comercios · metricas
                  bitacora · shared · supabase
  styles/         tokens.css y hojas compartidas
docs/ROADMAP.md   estado por fases y próximos pasos
```

## Reglas de arquitectura

- Páginas = **Server Components** protegidos con `requireRol`.
- Mutaciones = **server actions**, que verifican el rol al entrar.
  Ocultar un enlace no protege nada: la autorización va en el servidor, siempre.
- `src/lib/supabase/admin.ts` usa la `service_role`, que **ignora RLS**. Lleva
  `import 'server-only'`: importarlo desde un componente cliente rompe la compilación
  a propósito.
- Pruebas automatizadas **solo de funciones puras**. El resto se verifica a mano.

---

## Frontend y backend van en paralelo

Dos personas trabajan sobre este repositorio a la vez. Para no pisarse:

- **El backend manda en la lógica.** Server actions, consultas, RPC y `database.types.ts`
  son suyos. Un cambio de presentación nunca debe alterarlos.
- **El frontend manda en la presentación.** Componentes, CSS, rutas interceptadas y
  tokens.
- **La frontera es el `FormData`.** Si un formulario se rediseña, los atributos `name`
  deben seguir coincidiendo exactamente con lo que lee su `actions.ts`. Es lo primero
  que hay que comprobar tras tocar un formulario.
- Si una pantalla nueva se construye "provisional para probar", déjala anotada en
  `docs/ROADMAP.md` para que se rehaga sobre el sistema de diseño antes de publicarse.
