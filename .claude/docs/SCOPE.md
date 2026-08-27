# Frontera de alcance — ORUM

> **CONFIGURADO.** Esta es la frontera real del proyecto, no una plantilla.
> Es el único mecanismo que impide que un agente modifique el backend.

Estado: `CONFIGURADO` · 26/08/2026 · rama `mejora-diseno`

---

## 1. Zona de trabajo (lectura y escritura)

Rutas donde **`frontend-implementer`** puede modificar código:

```
src/app/**            ← SOLO la interfaz. Ver la excepción de §1b, que manda sobre esto
src/components/**
src/styles/**
public/**
```

`qa-tester` tiene una zona de escritura propia y disjunta: **`src/lib/**/*.test.ts`**,
y solo para funciones puras. Ningún otro agente escribe en el repositorio, salvo
`agent-tuner` en `.claude/agents/` y los agentes de planificación en `.claude/docs/`.

### 1b. Excepción que recorta la zona de trabajo: las Server Actions

Dentro de `src/app/**` hay archivos que **NO son zona de trabajo**. La regla de solo
lectura de §2 gana siempre sobre la de escritura de §1.

---

## 2. Zona de solo lectura (contrato)

Los agentes **leen para entender**, y **nunca modifican**:

```
src/app/**/actions.ts             ← toda Server Action
src/app/**/*-actions.ts           ← promociones-actions.ts, sucursales-actions.ts
cualquier archivo con 'use server'
src/lib/server/**                 ← reservado (no existe hoy)
src/lib/auth/**                   ← sesión, roles, requireRol
src/lib/supabase/**               ← clientes y acceso a datos
src/lib/correo/**                 ← invitaciones y escapado de HTML
supabase/migrations/**
supabase/**
docs/**
```

### Inventario exacto de la frontera (verificado el 26/08/2026)

Doce archivos declaran `'use server'`. **Ninguno se toca:**

```
src/app/admin/actions.ts                      src/app/admin/planes/actions.ts
src/app/admin/comercios/actions.ts            src/app/admin/usuarios/actions.ts
src/app/admin/comercios/promociones-actions.ts  src/app/comercios/(portal)/actions.ts
src/app/admin/comercios/sucursales-actions.ts   src/app/comercios/login/actions.ts
src/app/admin/cuenta/actions.ts               src/app/login/actions.ts
src/app/admin/miembros/actions.ts             src/app/miembros/login/actions.ts
```

> **Nota de nomenclatura**: el patrón real de este repositorio es `actions.ts` y
> `*-actions.ts` (con guion), **no** `*.actions.ts`. Un glob escrito con punto no casa
> con nada aquí y dejaría la frontera abierta sin avisar.

`docs/**` es solo lectura por una razón distinta: contiene las specs y planes que
documentan el porqué de las decisiones. Se citan, no se reescriben. La documentación
nueva la produce `docs-handoff` en `.claude/docs/`.

---

## 3. Zona prohibida (ni siquiera leer)

```
.env*
node_modules/**
.next/**
graphify-out/**
.opencode/**
```

`graphify-out/` está prohibido por partida doble: además de gastar contexto, **está
desactualizado** (generado el 19/08/2026, 13 commits por detrás del repositorio) y
describe un árbol que ya no existe. Citarlo produce afirmaciones falsas.

---

## 3b. Permisos de shell — atención requerida

La garantía de «un solo escritor» depende de que los auditores no puedan escribir.

**En este equipo, ningún auditor tiene `Bash`.** Solo lo tienen
`frontend-implementer`, `qa-tester` y `codebase-analyst`. La garantía se sostiene.

Aun así, `.claude/settings.local.json` **preaprueba hoy dos comandos de escritura
arbitraria, sin ruta acotada**:

```
PowerShell(Remove-Item *)     ← borrado arbitrario
PowerShell(Set-Content *)     ← escritura arbitraria
```

Es un riesgo por sí mismo, con agentes o sin ellos. **Recomendación**: acotarlos a
rutas concretas o quitarlos y aprobar caso por caso. Pendiente de decisión del
propietario del repositorio.

---

## 4. Regla de propuestas que cruzan la frontera

Si un agente concluye que la mejora correcta exige tocar la zona de solo lectura
(cambiar una Server Action, añadir un campo, alterar un contrato):

**No lo implementa. Lo escribe en una sección aparte del reporte llamada
`PROPUESTAS PARA BACKEND`**, con:

- Qué necesita exactamente (acción, campo, forma de la respuesta)
- Por qué la alternativa solo-frontend es peor
- Qué se puede hacer entretanto sin cruzar la frontera

Esa sección la lleva **una persona** al equipo correspondiente. Nunca es una tarea
del equipo de agentes.

---

## 5. Server Actions y Route Handlers: **ZONA DE SOLO LECTURA**

En Next.js la frontera suele ser borrosa. **Aquí no lo es. Está decidido:**

- [ ] Las Server Actions / Route Handlers son zona de trabajo
- [x] **Son zona de SOLO LECTURA**
- [ ] Mixto

### Por qué

En ORUM **toda mutación es una Server Action** — no hay capa de API separada, así que
esos doce archivos *son* el backend. Y acaban de recibir la tanda de seguridad OWASP
(commits `2a89f87`…`87d6476`, fusionados el 26/08/2026): invitación por enlace en vez
de contraseñas por correo, escapado de HTML en correos, revocación de `EXECUTE` sobre
`registrar_venta`, y la corrección de `renovarMembresia`.

Ese código está **auditado y verificado contra un modelo de amenazas concreto**. Un
agente de frontend optimizando ahí una consulta o «limpiando» una validación puede
deshacer una mitigación sin que nada falle de forma visible. El coste de un falso
ahorro no es un bug de interfaz: es una regresión de seguridad en producción.

### Qué significa para `security-auditor`

**Sigue auditándolas exactamente igual — con la misma profundidad y sin ablandar
ninguna severidad.** Lo que cambia es únicamente el destino del hallazgo:

| Hallazgo en… | Va a… |
|---|---|
| `src/app/**` de interfaz, `src/components/**` | Hallazgos normales, aplicables por `frontend-implementer` |
| Server Actions, `src/lib/auth`, `src/lib/supabase`, `src/lib/correo`, migraciones | **`PROPUESTAS PARA BACKEND`** |

Un hallazgo crítico en una Server Action **no se aplica: se escala**. Márcalo como
`CRÍTICO — REQUIERE DECISIÓN HUMANA` en el encabezado del reporte para que no se
pierda entre las propuestas.

Lo mismo aplica a `performance-engineer`: la paralelización de consultas a Supabase ya
se hizo (commit `e1fc40a`). Si detecta más, es propuesta, no parche.

---

## 6. Contrato de datos existente

Inventario de lo que el frontend consume hoy, generado por `codebase-analyst`:
`.claude/docs/API-CONTRACT.md`

El diseño se hace **dentro** de lo que ese contrato permite. Salirse de él es una
propuesta para backend, no una decisión de diseño.

---

## 7. Supuesto declarado — confírmalo o corrígelo

La instrucción de configuración nombraba `src/lib/server/**`, que **no existe** en
este repositorio: `src/lib/` está organizado por dominio (`auth/`, `comercios/`,
`correo/`, `metricas/`, `miembros/`, `bitacora/`, `shared/`, `supabase/`).

Interpretando la intención —proteger el código de servidor—, se han clasificado como
solo lectura **`src/lib/auth/`, `src/lib/supabase/` y `src/lib/correo/`**: manejan
sesión y roles, acceso a datos y el envío de invitaciones, y los tres fueron tocados
por la tanda OWASP.

`src/lib/shared/`, `src/lib/miembros/`, `src/lib/comercios/`, `src/lib/metricas/` y
`src/lib/bitacora/` quedan **legibles y modificables por `frontend-implementer`** en
su parte pura, y son la zona de tests de `qa-tester`.

Si esta división no es la que querías, corrígela aquí antes de ejecutar ningún agente.
