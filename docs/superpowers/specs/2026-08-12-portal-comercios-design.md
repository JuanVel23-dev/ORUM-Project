# Portal de Comercios — Verificación de membresía y registro de venta

> Spec de diseño. Cubre RF-20 a RF-22 (Herramienta para Comercios Aliados), acotado a lo que el
> cliente pidió: verificar si un miembro está activo, mostrar sus datos generales, y dejar que el
> comercio seleccione la promoción que está aplicando al registrar la venta.
>
> **Fecha:** 2026-08-12

---

## 1. Qué es y qué no es

El comercio (rol `comercio`, ya creado en Fase 3 con correo real + contraseña autogenerada) entra
a su propio portal para:

1. Buscar a un miembro por número de membresía (QR o manual).
2. Ver si su membresía está vigente, su nombre y su plan actual.
3. Si está vigente: elegir la promoción que aplica (o ninguna), digitar el valor de la compra, y
   registrar la venta.

**Fuera de alcance de este pase** (decisiones tomadas durante el brainstorming):

- **No incluye a comercios en el correo de bienvenida** con credenciales (idea pendiente en
  ROADMAP §10) — de todas formas ese correo aún no está implementado para nadie.
- **Sin historial de ventas visible en el portal del comercio.** Las ventas quedan en la BD y
  alimentan el dashboard de métricas (Fase 4), pero no hay pantalla de "mis ventas" en este pase.
- **Sin pantalla de cambio de contraseña propia** para comercio (sí existe para staff). Se puede
  agregar después con el mismo patrón que `/admin/cuenta/password`.
- **Miembro inactivo/vencido: solo se muestra el estado, no se puede registrar nada** para él (ni
  venta con ni sin promoción).

---

## 2. Rutas y estructura de archivos

Mismo patrón que el Portal de Miembros (Fase 5): route group para que el layout protegido no
envuelva el login (evita el bucle de redirect que ya se documentó en esa fase).

```
src/app/comercios/
  login/
    page.tsx
    login-form.tsx
    actions.ts              → iniciarSesionComercio, cerrarSesionComercio
  (portal)/
    layout.tsx               → requireRolComercio, header con logout
    page.tsx                 → pantalla única: buscar → verificar → registrar venta
    actions.ts                → buscarMiembro, registrarVenta (server actions)
    _components/
      buscar-miembro-form.tsx     → input número (8 dígitos) + botón "Escanear QR"
      escaner-qr.tsx                → cámara, client component
      resultado-miembro.tsx         → tarjeta con nombre/estado/plan
      confirmar-venta-form.tsx      → promoción, sucursal (si aplica), valor compra/descuento

src/lib/comercios/
  requerir-comercio.ts    → requireRolComercio (mismo patrón que requerir-miembro.ts)
  ventas.ts                → funciones puras: calcularDescuento, calcularValorFinal
  promocion-vigente.ts     → esPromocionVigente
```

**Login** (`/comercios/login`): correo + contraseña directo, sin resolución de número (el comercio
ya usa su correo real desde Fase 3). Rechaza cualquier sesión cuyo rol no sea `comercio`, igual que
`/login` rechaza todo lo que no sea staff y `/miembros/login` todo lo que no sea miembro.

**Nueva dependencia:** `@yudiel/react-qr-scanner` para el escaneo de QR con cámara (componente
React, envuelve zxing). El input manual del número queda siempre disponible como respaldo si la
cámara falla, no existe, o el permiso es denegado.

---

## 3. Flujo de la pantalla principal

Todo ocurre en una sola vista (`/comercios`), sin recargar de página, con `useActionState` para las
dos acciones (buscar, registrar).

1. **Al cargar:** se resuelve el comercio del usuario (`comercios` donde `perfil_id = auth.uid()`)
   y sus sucursales activas.
   - **0 sucursales activas** → mensaje bloqueante: "Este comercio no tiene sucursales activas,
     contacta al administrador." No se muestra el resto de la herramienta.
   - **1 sucursal** → se usa automáticamente, sin preguntar nada.
   - **2+ sucursales** → aparece un selector como parte del formulario de venta (paso 4), no como
     paso separado.

2. **Buscar al miembro:** el operador escribe el número de 8 dígitos o escanea el QR con la
   cámara. Ambos caminos llaman a la misma función `buscarMiembro(numero, metodo)`, que internamente
   usa `supabase.rpc('buscar_miembro_comercio', { p_numero: numero })` (ver §5). `metodo` se guarda
   para luego escribirlo en `ventas.metodo_registro` ('qr' | 'numero').

3. **Resultado:**
   - **No existe** → "No se encontró un miembro con ese número."
   - **Existe pero no vigente** → tarjeta con nombre + badge "Inactiva". Fin del flujo para ese
     miembro.
   - **Existe y vigente** → tarjeta con nombre + badge "Activa" + nombre del plan, y aparece el
     formulario de venta (paso 4).

4. **Formulario de venta** (solo si vigente):
   - **Promoción aplicada:** "Sin promoción" o una de las promociones del propio comercio que estén
     `activo = true` y vigentes por fecha (`esPromocionVigente`). Selección única — `ventas.promocion_id`
     es un solo campo, y aunque pueda haber varias promociones disponibles, cada venta aplica como
     máximo una.
   - **Sucursal:** solo visible si el comercio tiene más de una activa (ver paso 1).
   - **Valor de la compra:** obligatorio, numérico, `>= 0` (0 permitido para un obsequio puro sin
     compra asociada).
   - **Valor del descuento:**
     - Promoción `porcentaje` o `monto_fijo` → se calcula automáticamente con `calcularDescuento` y
       se muestra de solo lectura.
     - Promoción `dos_por_uno`, `regalo`, o "sin promoción" → el operador lo escribe a mano (el
       sistema no conoce precios de artículos individuales para calcularlo solo). Por defecto 0 si
       no hay promoción.
   - **Valor final** = compra − descuento, con `calcularValorFinal` (nunca negativo), se recalcula
     en vivo mientras se edita.

5. **Confirmar:** inserta en `ventas` (`miembro_id`, `membresia_id`, `sucursal_id`, `promocion_id`
   nullable, `valor_compra`, `valor_descuento`, `valor_final`, `metodo_registro`,
   `registrada_por_perfil = auth.uid()`, `fecha_hora = now()`). Éxito → mensaje de confirmación y
   botón "Verificar otro miembro" que reinicia el flujo completo.

---

## 4. Seguridad de datos: RLS y función RPC

El comercio necesita buscar a *cualquier* miembro (no solo "su" fila, como sí ocurre en el Portal
de Miembros), lo cual no se puede resolver con una política RLS simple de "cada quien su fila" sin
exponer datos de más. La deuda técnica ya anotada en el ROADMAP (§7, punto 3) señalaba justamente
esto: activar RLS "antes de exponer los portales de miembros/comercios".

**Ya no hace falta tocar** (quedó abierto desde Fase 5, sin restricción por rol):

| Tabla | Política existente | Uso en este portal |
|---|---|---|
| `promociones` | `activo = true AND deleted_at IS NULL` | El comercio lee sus propias promociones (filtradas por `comercio_id` en la consulta de la app) |
| `sucursales` | `activo = true AND deleted_at IS NULL` | El comercio lee sus propias sucursales |
| `planes_membresia` | Sin restricción | Usado dentro de la función RPC para devolver el nombre del plan |

**Nuevo en este pase** (SQL directo en Supabase, igual que en fases anteriores — no hay
migraciones en el repo):

1. **Función `buscar_miembro_comercio(p_numero text)`**, `SECURITY DEFINER`:
   - Verifica primero que quien llama (`auth.uid()`) tiene un perfil con rol `comercio` y
     `activo = true`; si no, no devuelve filas.
   - Busca el miembro por `numero_membresia` (`deleted_at is null`), calcula vigencia con la misma
     regla que `esMembresiaVigente` (estado `activa` y `fecha_fin >= hoy`).
   - Devuelve **únicamente**: `miembro_id`, `nombres`, `apellidos`, `numero_membresia`, `vigente`
     (boolean), `membresia_id`, `plan_nombre`. **Nunca** cédula, teléfono, dirección ni ciudad —
     esos campos no le corresponden al comercio.

   ```sql
   create or replace function buscar_miembro_comercio(p_numero text)
   returns table (
     miembro_id bigint, nombres text, apellidos text, numero_membresia text,
     vigente boolean, membresia_id bigint, plan_nombre text
   )
   security definer set search_path = public as $$
     select m.id, m.nombres, m.apellidos, m.numero_membresia,
            coalesce(mb.estado = 'activa' and mb.fecha_fin >= current_date, false),
            mb.id, pl.nombre
     from miembros m
     left join lateral (
       select * from membresias where miembro_id = m.id
       order by fecha_fin desc limit 1
     ) mb on true
     left join planes_membresia pl on pl.id = mb.plan_id
     where m.numero_membresia = p_numero and m.deleted_at is null
       and exists (
         select 1 from perfiles pf join roles r on r.id = pf.rol_id
         where pf.id = auth.uid() and r.codigo = 'comercio' and pf.activo
       );
   $$ language sql stable;

   grant execute on function buscar_miembro_comercio(text) to authenticated;
   ```

2. **Habilitar RLS en `ventas`** (hoy no está activo) con una política de `INSERT` para el rol
   `comercio`: solo puede insertar si `registrada_por_perfil = auth.uid()` **y** la `sucursal_id`
   pertenece a un comercio cuyo `perfil_id = auth.uid()`. Sin política de `SELECT` para comercio en
   este pase (no hay historial de ventas en el portal; si se agrega después, ahí se suma esa
   política).

---

## 5. Manejo de errores y casos borde

- **Número no encontrado** → mensaje genérico, no distingue formato inválido de "no existe".
- **Comercio sin sucursales activas** → bloquea toda la herramienta al cargar (no debería pasar si
  Fase 3 exige al menos una sucursal al crear el comercio, pero cubre el caso de que se desactiven
  todas después).
- **Cámara no disponible o permiso denegado** → cae automáticamente al input manual, con aviso
  breve; nunca bloquea el flujo.
- **Descuento mayor al valor de compra** (posible en `monto_fijo` o cuando el operador lo escribe a
  mano) → se acepta, pero `valor_final` se limita a 0 (no negativo) — cubre el caso de un obsequio
  real sin compra asociada.
- **Revalidación en servidor:** aunque el cliente ya filtra promociones vigentes y calcula el
  descuento, `registrarVenta` vuelve a validar en el servidor (la promoción sigue activa y
  vigente, pertenece al comercio del actor, el tipo coincide con el cálculo enviado) antes de
  insertar — no confía en lo que llega del formulario.
- **Doble clic al confirmar** → botón deshabilitado mientras la acción está en curso (mismo patrón
  `useActionState` ya usado en el resto del proyecto).

---

## 6. Testing

- **Funciones puras (Vitest)**, mismo criterio que `src/lib/miembros/membresias.ts` y
  `src/lib/comercios/promociones.ts`:
  - `calcularDescuento(tipoBeneficio, valorPromocion, valorCompra)` — casos `porcentaje` y
    `monto_fijo`.
  - `calcularValorFinal(valorCompra, valorDescuento)` — nunca negativo.
  - `esPromocionVigente(activo, fechaInicio, fechaFin, hoy)` — con y sin fechas límite, dentro y
    fuera de rango.
- **Prueba manual en navegador** (mismo patrón que fases anteriores): login de comercio, búsqueda
  por número y por cámara real, miembro activo vs. inactivo, comercio con 1 vs. varias sucursales,
  los 4 tipos de promoción, venta sin promoción, y confirmar que la fila queda en `ventas` y se
  refleja en el dashboard de métricas de Fase 4.
- **Prueba de acceso cruzado (RLS/RPC):** un comercio no debe poder insertar ventas a nombre de
  otro comercio, ni obtener cédula/teléfono/dirección de un miembro vía `buscar_miembro_comercio`.

---

## 7. Checklist de implementación

- [ ] Función `buscar_miembro_comercio` y RLS de `ventas` aplicados en Supabase (§4), verificados
      con prueba manual de acceso cruzado.
- [ ] `pnpm add @yudiel/react-qr-scanner`.
- [ ] Funciones puras de §6 con sus tests.
- [ ] `requireRolComercio` + login (`/comercios/login`) siguiendo el patrón de `/miembros/login`.
- [ ] Pantalla única `/comercios` con los 5 pasos de §3.
- [ ] `tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build` limpios.
- [ ] Prueba manual completa en navegador (login real, cámara real, los 4 tipos de promoción,
      comercio con varias sucursales) antes de dar la fase por cerrada.
