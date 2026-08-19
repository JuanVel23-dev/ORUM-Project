# Pendientes de backend

> Documento de traspaso. Recoge lo que la interfaz **no puede resolver** porque vive en
> server actions, en la base de datos o en la configuración de Supabase.
>
> Está escrito desde el lado del frontend: cada punto dice **qué se observó**, **por qué
> importa** y **qué haría falta**. Las decisiones de implementación son tuyas.
>
> **Última actualización:** 2026-08-19 · Nada de esto se ha tocado desde el frontend.

---

## Resumen

| # | Asunto | Gravedad | Tipo |
|---|---|---|---|
| 1 | Dos membresías activas a la vez | 🔴 Alta | Base de datos |
| 2 | RLS sin activar | 🔴 Alta | Supabase |
| 3 | Sin límite de intentos de login | 🔴 Alta | Auth |
| 4 | Datos de usuario sin escapar en el correo | 🟠 Media | Código |
| 5 | Contraseñas en claro por correo | 🟠 Media | Producto + código |
| 6 | Flujos multi-tabla sin transacción | 🟠 Media | Base de datos |
| 7 | No se puede dar de baja a nadie | 🟡 Funcionalidad | Server action |
| 8 | No se puede cancelar ni suspender | 🟡 Funcionalidad | Server action |
| 9 | Los miembros no se desactivan | 🟡 Funcionalidad | Server action |
| 10 | Sin comprobante de pago | 🟡 Funcionalidad | Server action + Storage |
| 11 | `codigo_publico` sin usar | 🔵 Decisión | Producto |
| 12 | Techo de 9.999 miembros | 🔵 Futuro | Base de datos |

---

## 🔴 1. Se pueden crear dos membresías activas a la vez

**Observado.** `renovarMembresia` (`src/app/admin/miembros/actions.ts`) inserta la nueva
membresía y **después** marca la anterior como `vencida`. Son dos escrituras
independientes contra PostgREST, sin transacción.

La regla "una sola membresía vigente por miembro" vive **únicamente en ese código**. En
`Esquema_BD.txt` no hay ningún índice que la imponga.

**Por qué importa.** Dos empleados que renueven al mismo miembro a la vez leen ambos la
misma membresía vigente, ambos insertan, y ambos marcan como vencida la misma anterior.
Resultado: dos activas.

Y **no falla en voz alta**. Se manifiesta como inconsistencia silenciosa:

- El carnet del miembro lee `order('fecha_fin' desc).limit(1)`.
- La ficha del administrador lee `order('fecha_inicio' desc)`.
- Pueden mostrar membresías distintas.
- Las métricas suman `precio_pagado` de todas → **el ingreso queda inflado**.

**Qué haría falta.** Un índice único parcial, que convierte el problema en un error
explícito en vez de un dato corrupto:

```sql
create unique index membresias_una_activa_por_miembro
  on membresias (miembro_id)
  where estado = 'activa';
```

Con eso, la segunda inserción simultánea falla y `renovarMembresia` puede devolver
"otro empleado acaba de renovar a este miembro". Lo ideal es además mover el par
insertar/vencer a una función RPC transaccional (ver punto 6).

---

## 🔴 2. RLS sin activar en todas las tablas

**Observado.** La autorización vive en la aplicación: `requireRol` en cada página y cada
server action. El ROADMAP ya lo recoge como deuda aceptada.

**Por qué importa.** Es una sola capa. La `anon key` viaja al navegador por diseño; si
alguna consulta acaba ejecutándose con ella sin el filtro correcto, no hay una segunda
barrera que lo impida. Con RLS activo, la base se defiende sola aunque la aplicación se
equivoque.

Ahora importa más que antes: el Portal de Miembros y el de Comercios ya están
publicados, y ahí entran usuarios que no son del equipo.

**Qué haría falta.** Revisar tabla por tabla en Supabase. Como mínimo `miembros`,
`membresias`, `ventas` y `bitacora_actividad`: un miembro solo debe poder leer su propia
fila; un comercio, solo sus sucursales, promociones y ventas.

---

## 🔴 3. Sin límite de intentos de login

**Observado.** Buscado en todo el código: no hay rate limiting, ni bloqueo por intentos,
ni captcha. Los tres accesos (`/login`, `/miembros/login`, `/comercios/login`) aceptan
peticiones ilimitadas.

**Por qué importa.** El acceso de miembros es el más expuesto: el usuario es un **número
de membresía de 8 dígitos**, y los primeros 4 son secuenciales. El espacio real a probar
son los 4 dígitos aleatorios — **10.000 combinaciones por miembro**. Con contraseñas
generadas es poco explotable, pero permite **enumerar qué números existen**, que ya es
información del negocio.

**Qué haría falta.** Supabase Auth trae limitación configurable en el panel
(Authentication → Rate Limits). Si no basta, un contador por IP antes de llamar a
`signInWithPassword`. Un captcha (punto 12 de la lista de seguridad) solo si aparece
abuso real: añade fricción a un cajero con prisa.

---

## 🟠 4. Datos de usuario sin escapar en el HTML del correo

**Observado.** `src/lib/correo/correo.ts`:

```ts
const html = `
  <p>Hola ${input.nombre},</p>
  ...
  <li><strong>Correo:</strong> ${input.correo}</li>
```

`nombre` viene del formulario de registro sin escapar.

**Por qué importa.** Un miembro registrado como `Juan <img src=x onerror=...>` genera
HTML roto en el correo. Los clientes de correo filtran scripts, pero se puede inyectar
maquetación y enlaces — suficiente para un correo de aspecto legítimo que lleve a otro
sitio.

**Qué haría falta.** Escapar `< > & " '` antes de interpolar. Es una función de cinco
líneas y `construirCorreoBienvenida` ya está testeada, así que se puede cubrir con un
test más.

---

## 🟠 5. Se envían contraseñas en claro por correo

**Observado.** El correo de bienvenida incluye la contraseña generada en el cuerpo.

**Por qué importa.** Queda en el buzón del usuario indefinidamente, en los registros del
proveedor, y en cualquier reenvío. Si alguien accede al correo, accede a ORUM.

**Qué haría falta.** Es una decisión de producto, no solo técnica. La alternativa
habitual es enviar un **enlace de un solo uso** para que el usuario fije su contraseña
(`generateLink` de la Admin API de Supabase), y no enviar nunca la contraseña. Si se
mantiene el envío, al menos forzar el cambio en el primer inicio de sesión.

---

## 🟠 6. Los flujos multi-tabla no son atómicos

**Observado.** Registro, renovación y edición escriben en varias tablas y revierten con
compensaciones manuales (`revertir()` en `miembros/actions.ts`). Ya está en el ROADMAP.

**Por qué importa.** Una compensación es otra llamada de red que también puede fallar. Si
el proceso muere entre la escritura y su reversión, el estado queda partido — y nadie se
entera.

**Qué haría falta.** Mover esos flujos a funciones RPC en Supabase, donde Postgres
garantiza la atomicidad de verdad. Empezaría por `renovarMembresia`, que además resuelve
el punto 1.

---

## 🟡 7-10. Funcionalidad que la base da por hecha y no existe

Estos cuatro comparten patrón: **el esquema los previó y la interfaz nunca los
implementó**. No son fallos, son huecos.

### 7. No se puede dar de baja a nadie

`deleted_at` se **lee en 30 sitios** (todas las consultas filtran `is('deleted_at',
null)`) y **ninguna server action lo escribe jamás**. El borrado lógico está diseñado y
no hay forma de ejecutarlo. Un miembro registrado por error se queda para siempre.

### 8. No se puede cancelar ni suspender una membresía

El enum `estado_membresia` incluye `cancelada` y `suspendida`.
`derivarEstadoMembresia` sabe interpretarlos y la interfaz sabe mostrarlos. **Ningún
flujo los dispara.** Solo existe "vence sola al llegar la fecha".

### 9. Los miembros no se pueden desactivar

Usuarios, planes y comercios tienen activar/desactivar. Miembros no.

### 10. No hay comprobante de pago

La columna `membresias.comprobante_url` existe y tiene **cero usos**. Se cobra dinero y
no queda soporte del pago en ninguna parte. Necesitaría además un bucket de Supabase
Storage con su política.

> **Nota del frontend:** las pantallas de estas cuatro las puedo construir en cuanto
> existan las acciones. Solo necesito saber el nombre de la acción y qué campos espera.

---

## 🔵 11-12. Decisiones abiertas

**11. `miembros.codigo_publico`** (UUID) tiene **cero usos**. El QR del carnet usa
`numero_membresia`. O es una idea a medio hacer o es una columna muerta: conviene
decidirlo antes de que alguien la use suponiendo otra cosa.

**12. Número de membresía:** 4 dígitos secuenciales + 4 aleatorios. Techo de **9.999
miembros**. No urge, pero cuando se acerque hay que ampliar el ancho o añadir prefijo.

---

## Lo que ya está bien

Para que conste, porque se auditó y salió limpio:

- **No hay secretos en el historial de git.** Solo ha existido `.env.example`.
- **La `service_role` no llega al navegador.** Verificado sobre los 56 chunks
  compilados. Además `admin.ts` lleva `import 'server-only'`, así que importarla desde
  un componente cliente **rompe la compilación**.
- **Las consultas no se construyen concatenando SQL.** Todo va por los filtros de
  PostgREST, y el texto libre que entra en un `.or()` se sanea antes
  (`limpiarTermino`).
- **Las contraseñas nunca se guardan en tablas propias**: viven solo en Supabase Auth.
- **Ninguna consulta usa `select('*')`**: todas piden columnas explícitas.
- **`registrarVenta` re-deriva en servidor** —miembro, sucursal, promoción y descuento—
  en vez de confiar en lo que manda el formulario. Está bien resuelto.
