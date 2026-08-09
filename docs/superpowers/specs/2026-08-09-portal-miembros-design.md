# Portal de Miembros (diseño)

- **Fecha:** 2026-08-09
- **Estado:** Aprobado para planificación
- **Depende de:** Fases 1-4 (`main`) y de la reorganización de agosto (`src/lib/` por dominio,
  `src/components/ui/`).
- **Cubre:** RF-06 a RF-14 (login, perfil, descuentos, búsqueda y filtros, soporte, QR).

## 1. Objetivo

Construir el portal privado donde el miembro consulta su membresía, explora los comercios aliados
y sus beneficios, y muestra su QR en el punto de venta. Es la primera pieza de cara al usuario
final (después de 4 fases construyendo solo el back-office administrativo).

## 2. Alcance

**Dentro:** RF-06 (login por número de membresía), RF-07 (perfil de solo lectura), RF-08 a RF-12
(listado único con búsqueda + filtros por comercio/marca/ubicación), RF-13 (botón de soporte por
WhatsApp, persistente en el layout), RF-14 (QR con `numero_membresia` como payload — decisión ya
tomada en Fase 2).

**Fuera de alcance (este pase):**

- Edición de datos del miembro desde el portal — sigue siendo tarea del admin/empleado
  (`/admin/miembros/[id]/editar`). El RF original dice "consulta", no edición.
- Autodetección de ciudad por geolocalización del navegador. Requiere agregar columnas `lat`/`lng`
  a `ciudades` (hoy solo tiene `nombre`/`departamento`) y una función de distancia (haversine) para
  resolver la ciudad más cercana. Queda anotado para una iteración posterior una vez validada la
  necesidad real; por ahora el filtro de ubicación es manual (select), igual que comercio y marca.
- Filtrado de promociones por `fecha_inicio`/`fecha_fin` — se mantiene la decisión ya tomada en
  Fase 3: son campos informativos, no ocultan/muestran automáticamente.
- Portal Público (RF-01–04) y Herramienta para Comercios (RF-20–22) — fases separadas.

## 3. Arquitectura de rutas

```
src/app/miembros/
  layout.tsx                   # requireRol('miembro') + chequeo de membresía vigente + WhatsAppButton persistente
  page.tsx                     # Home: listado + búsqueda + filtros (RF-08 a RF-12)
  _components/comercio-card.tsx
  perfil/
    page.tsx                   # RF-07 (solo lectura) + QR (RF-14)
  inactiva/
    page.tsx                   # Pantalla de bloqueo si la membresía no está vigente
  login/
    page.tsx
    actions.ts
    _components/login-form.tsx
```

Sigue el mismo patrón que `/admin` (fases 1-4): árbol de rutas de primer nivel con URL real,
protegido en su `layout.tsx` con `requireRol` (sin cambios en `lib/auth/auth.ts`, ya es
portal-agnóstico). `/login` (admin) no se toca — `/miembros/login` es una ruta nueva e
independiente, porque el flujo de credenciales es distinto (número de membresía en vez de correo).

**Chequeo de membresía vigente en el layout:** el `estado` guardado en `membresias` no se actualiza
solo cuando `fecha_fin` pasa (no existe un job que lo haga — deuda técnica ya anotada en el
ROADMAP). Por eso `layout.tsx` valida `estado === 'activa' AND fecha_fin >= hoy` (función pura
`esMembresiaVigente`, no solo el campo `estado` a secas). Si no hay membresía vigente así definida,
redirige a `/miembros/inactiva` (mensaje + botón de soporte) sin mostrar el resto del portal.

## 4. Login (RF-06)

1. El formulario en `/miembros/login` pide número de membresía + contraseña.
2. Server action resuelve el número a un correo real vía
   `lib/miembros/auth-miembro.ts#resolverCorreoPorNumeroMembresia`. Esta función es la **única**
   excepción de este portal que usa el admin client (`service_role`): la resolución ocurre *antes*
   de que exista sesión (no hay `auth.uid()` todavía), igual que `lib/supabase/admin.ts` ya hace
   para crear usuarios. Nunca se inventan correos internos (decisión ya tomada en el ROADMAP).
3. Con el correo resuelto, se llama `supabase.auth.signInWithPassword` — mismo mecanismo de Auth
   que ya usa el login admin, sin credenciales nuevas que gestionar.
4. Tras el login exitoso, el `layout.tsx` de `/miembros` valida rol + membresía vigente (§3).

## 5. Seguridad de datos: RLS

A diferencia de `/admin` (staff de confianza, cliente `service_role` + filtrado en la app), el
portal de miembros expone datos a los propios usuarios finales. Se activa RLS en Supabase como
defensa en profundidad (recomendación ya anotada en el ROADMAP antes de este pase) y todas las
páginas de `/miembros/**` (excepto la resolución de login, §4) usan el cliente normal
(`lib/supabase/server.ts`, con la sesión del usuario) en vez del admin client.

Políticas nuevas (tarea previa, SQL directo en Supabase — no hay migraciones en el repo, el
esquema ya vive ahí):

| Tabla | Política `SELECT` |
|---|---|
| `miembros` | `perfil_id = auth.uid()` |
| `membresias` | `miembro_id` pertenece a un miembro con `perfil_id = auth.uid()` |
| `comercios` | `activo = true AND deleted_at IS NULL` |
| `sucursales` | `activo = true AND deleted_at IS NULL` |
| `promociones` | `activo = true AND deleted_at IS NULL` |
| `marcas`, `categorias`, `ciudades`, `tipos_beneficio`, `planes_membresia` | Sin restricción (datos de referencia; `planes_membresia` la necesita el perfil del miembro para mostrar su plan, y sus precios son públicos por RF-03) |
| `configuracion` | Sin restricción (solo guarda claves como `whatsapp_soporte`, nada sensible) |

**Fuera de esta tarea (a propósito):** `perfiles` y `roles`. Se leen con el cliente de sesión desde
`getPerfilActual()` (`lib/auth/auth.ts`), usada por **todos** los portales (incluido `/admin`, que
lleva 4 fases funcionando así). Activarles RLS sin la política correcta de autolectura rompería el
login de todo el sistema, no solo el de miembros — por eso quedan fuera de este paso y siguen con
el acceso abierto actual (deuda técnica ya anotada en el ROADMAP, no se resuelve en este pase).

## 6. Reorganización de `src/lib/`

Mismo criterio por dominio que ya dejó la reorganización de agosto:

| Archivo nuevo | Contenido |
|---|---|
| `lib/miembros/auth-miembro.ts` | `resolverCorreoPorNumeroMembresia(numero)` (admin client, ver §4) |
| `lib/miembros/membresia-vigente.ts` | `esMembresiaVigente(estado, fechaFin, hoy)` — función pura testeada, usada en `layout.tsx` de `/miembros` |
| `lib/comercios/beneficios-formato.ts` | `formatearBeneficio(tipoBeneficio, valor)` → texto amigable ("20% de descuento", "2x1", "$15.000 de descuento"). Función pura testeada; también reemplaza el `p.valor ?? '—'` crudo que hoy muestra `/admin/comercios/[id]` |

## 7. Pantallas

### Home `/miembros` (RF-08 a RF-12)

Una sola pantalla: sin filtros se ve todo (RF-08); con filtros se acota (RF-09 a RF-12). Server
component, lee `searchParams` (`q`, `comercio_id`, `marca_id`, `ciudad_id`):

- **Búsqueda libre** (RF-09): `SearchForm` ya existente en el kit — coincide contra nombre de
  comercio o título de promoción.
- **Filtros** (RF-10, RF-11, RF-12): tres `<select>` (comercio, marca, ciudad — poblados desde
  `comercios`, `marcas`, `ciudades`) usando un componente nuevo del kit, `Select` (hermano de
  `Field`, mismo patrón label+input pero para opciones).
- Resultado: grid de tarjetas (`ComercioCard`, específico de esta ruta →
  `miembros/_components/comercio-card.tsx`, construido sobre `Row`/`Stack`/`Badge` del kit más un
  `Card`/`CardGrid` nuevo y genérico que sí entra al kit — análogo a `DataTable` pero para grillas).
  Cada promoción se muestra con `formatearBeneficio()` (§6) en vez de un valor crudo.
- Filtro de ubicación por ciudad vía las `sucursales` del comercio (un comercio aparece si
  cualquiera de sus sucursales está en la ciudad filtrada).

### Perfil `/miembros/perfil` (RF-07, RF-14)

Solo lectura: datos del miembro, membresía vigente (plan, fechas, tipo nueva/renovada), y el QR
(payload = `numero_membresia`, decisión ya tomada en Fase 2). Se usa `react-qr-code` (SVG en
cliente, sin dependencias de red) envuelto en un componente nuevo del kit, `QrCode` — pensado para
poder reutilizarse si el admin quiere mostrar el QR de un miembro en su ficha
(`/admin/miembros/[id]`) más adelante, sin duplicar la integración de la librería.

### Soporte (RF-13)

No es una pantalla aparte: botón persistente en `layout.tsx` de `/miembros`, visible en todo el
portal. Componente nuevo del kit, `WhatsAppButton` (`telefono`, `mensaje?` como props — no lee
`configuracion` él mismo, la página/layout se lo pasa ya resuelto desde la tabla). Portal-agnóstico
a propósito: el futuro RF-04 del Portal Público lo reutiliza igual.

### `/miembros/inactiva`

Pantalla de bloqueo cuando el login es válido pero no hay membresía vigente (§3): mensaje +
`WhatsAppButton` de soporte. Sin acceso al resto del portal.

## 8. Tareas previas (antes de implementar)

1. Políticas RLS de §5 (SQL directo en Supabase).
2. Insertar en `configuracion` la fila `whatsapp_soporte` con el número real.
3. `pnpm add react-qr-code`.

## 9. Verificación

- `esMembresiaVigente` y `formatearBeneficio` como funciones puras testeadas con Vitest (mismo
  patrón que `membresias.ts`/`promociones.ts`).
- `tsc --noEmit`, `pnpm lint`, `pnpm build` limpios.
- Prueba manual en navegador: login con número válido/inválido, membresía vencida (bloqueo a
  `/miembros/inactiva`), búsqueda + cada filtro por separado y combinados, QR visible, botón de
  soporte abre WhatsApp con el número correcto.
- Verificar en Supabase que las políticas RLS realmente bloquean acceso cruzado (un miembro no
  puede leer la fila de otro miembro ni membresías ajenas) probando con sesión real, no solo
  confiando en que la policy "se ve bien" en el SQL.

## 10. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Política RLS mal escrita deja pasar datos de más o de menos | Prueba manual explícita de acceso cruzado (§9), no solo revisión visual del SQL |
| `esMembresiaVigente` no cubre bien casos borde (membresía `suspendida`, sin membresía nunca comprada) | Función pura testeada con casos explícitos: activa+vigente, activa+vencida por fecha, `suspendida`, sin membresías |
| El admin client usado en `resolverCorreoPorNumeroMembresia` se reutiliza sin querer para otra cosa dentro de `/miembros` | Aislado en su propio archivo (`lib/miembros/auth-miembro.ts`), solo se llama desde `login/actions.ts`; el resto de páginas de `/miembros/**` usa el cliente con sesión |
| El kit nuevo (`Card`/`CardGrid`, `Select`) termina siendo prematuro si el único consumidor es este portal | Se construyen contra el caso real de `ComercioCard`/los tres filtros; si un patrón no encaja limpio se deja local en `miembros/_components/` en vez de forzarlo al kit |

## 11. Criterios de aceptación

- [ ] `/miembros/login` permite iniciar sesión con número de membresía; rechaza número inválido o
      contraseña incorrecta con mensaje genérico (sin filtrar cuál de los dos falló).
- [ ] Un miembro con membresía vencida o suspendida no accede al portal; ve `/miembros/inactiva`.
- [ ] `/miembros` muestra todos los comercios/promociones activos sin filtros, y los acota
      correctamente con búsqueda y cada uno de los tres filtros (comercio, marca, ciudad),
      combinados entre sí.
- [ ] `/miembros/perfil` muestra los datos del miembro, su membresía vigente, y el QR con
      `numero_membresia` como payload. Sin formulario de edición.
- [ ] El botón de soporte (WhatsApp) es visible en todas las pantallas de `/miembros/**` y abre el
      número correcto leído desde `configuracion`.
- [ ] RLS activo en Supabase para `miembros`, `membresias`, `comercios`, `sucursales`,
      `promociones` según la tabla de §5; verificado con prueba manual de acceso cruzado.
- [ ] `tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build` pasan limpio.
