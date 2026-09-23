# Contrato de datos disponible
> codebase-analyst · 28/08/2026 · commit `e4d33e9` · rama `mejora-diseno`
>
> Inventario de lo que el frontend **consume hoy**. Todo sale de leer el código real
> (`src/app/**/actions.ts`, `src/app/**/*-actions.ts`, `src/lib/supabase/database.types.ts`
> y las consultas de cada Server Component). `graphify-out/` no se ha leído.
>
> **Los doce archivos de Server Actions son SOLO LECTURA** (`SCOPE.md` §2 y §5). Este
> documento describe su superficie, no su implementación. Lo que falte se pide en
> `PROPUESTAS PARA BACKEND`, al final.

---

## 0. Cómo funciona la capa de datos aquí

No hay REST, ni GraphQL, ni Route Handlers. **Cero llamadas a `fetch()` en todo `src/`.**
Hay exactamente dos caminos:

| Camino | Mecanismo | Dónde |
|---|---|---|
| **Lectura** | El Server Component consulta Supabase directamente con `supabase-js` | 36 archivos `page.tsx` y `layout.tsx` |
| **Escritura** | Server Action invocada por un `form` con `action={...}` | 12 archivos, 27 acciones exportadas |

Consecuencias que acotan el diseño:

- **No hay endpoint que un cliente pueda llamar.** Cualquier interacción que necesite
  datos nuevos exige o una navegación (cambio de `searchParams`) o una Server Action.
  Solo hay **una** acción que se invoca imperativamente desde el cliente sin formulario:
  `buscarMiembrosAction`, en la paleta de comandos.
- **No hay caché de datos configurada.** Cero `export const revalidate`, cero
  `export const dynamic`, cero `unstable_cache`, cero `cache()` de React. La
  invalidación es manual, vía `revalidatePath()` dentro de cada acción.
- **El estado de servidor no vive en el cliente.** No hay React Query ni SWR. Tras una
  mutación la vista se refresca por `revalidatePath` mas `redirect`, no por refetch.

---

## 1. Server Actions consumidas

Roles: `super_admin` · `empleado` · `comercio` · `miembro` (`RolCodigo`,
`src/lib/supabase/database.types.ts:13`).

### 1.1 Autenticación

`src/app/login/actions.ts` · `src/app/comercios/login/actions.ts` · `src/app/miembros/login/actions.ts`

| Acción | Firma | Rol exigido | Devuelve | Se consume en |
|---|---|---|---|---|
| `iniciarSesion` | `(prev: LoginState, fd: FormData) => Promise<LoginState>` | ninguno, es la puerta | `{error?}`; en éxito `redirect('/admin')` | `src/app/login/login-form.tsx:10` |
| `cerrarSesion` | `() => Promise<never>` | ninguno | `redirect('/login')` | `src/app/admin/layout.tsx:3`, se pasa a `AppShell` |
| `iniciarSesionComercio` | `(prev: LoginComercioState, fd) => Promise<...>` | ninguno | `{error?}`; éxito redirige a `/comercios` | `comercios/login/_components/login-form.tsx:10` |
| `cerrarSesionComercio` | `() => Promise<never>` | ninguno | redirige a `/comercios/login` | `comercios/(portal)/layout.tsx:9` |
| `iniciarSesionMiembro` | `(prev: LoginMiembroState, fd) => Promise<...>` | ninguno | `{error?}`; éxito redirige a `/miembros` | `miembros/login/_components/login-form.tsx:10` |
| `cerrarSesionMiembro` | `() => Promise<never>` | ninguno | redirige a `/miembros/login` | `miembros/(portal)/layout.tsx:10` |

Campos de `FormData`:

- admin y comercio: `email`, `password`
- miembro: `numero_membresia`, `password`. El correo se resuelve en servidor con
  `resolverCorreoPorNumeroMembresia` (`src/lib/miembros/auth-miembro.ts:10`)

### 1.2 Miembros — `src/app/admin/miembros/actions.ts`

Guarda: `exigirEmpleadoOAdmin()`, es decir perfil activo con rol `empleado` o
`super_admin`. **No redirige**: devuelve el error de permiso dentro del estado del
formulario, igual que un error de validación.

| Acción | FormData que lee | Devuelve | Se consume en |
|---|---|---|---|
| `registrarMiembro` | `nombres` `apellidos` `cedula` `correo` `telefono` `direccion` `ciudad_id` `plan_id` `precio_pagado` | `{error?}` o `{ok, numero, correo, nombre}` | `miembros/_components/miembro-form.tsx:11` |
| `renovarMembresia` | `miembro_id` `plan_id` `precio_pagado` | `{error?}`; éxito redirige a la ficha | `miembros/[id]/_components/renovar-form.tsx:9` |
| `editarMiembro` | `miembro_id` `perfil_id` `nombres` `apellidos` `cedula` `telefono` `direccion` `ciudad_id` `correo` `correo_original` | `{error?}`; éxito redirige a la ficha | `miembros/[id]/editar/_components/editar-miembro-form.tsx:10` |

`registrarMiembro` es la **única** acción que devuelve datos de vuelta a la interfaz
(`numero`, `correo`, `nombre`): el formulario cambia por completo a una pantalla de
entrega de credenciales (`miembro-form.tsx:36`).

### 1.3 Comercios, sucursales y promociones

Guarda en las tres familias: `exigirSuperAdmin()`. **Solo `super_admin`.**
Los `cambiarEstado*` no devuelven estado: redirigen a `/login?error=sin_permiso` si falla
el permiso, y a la ficha si tienen éxito. Firma `(fd: FormData) => Promise<void>`.

| Acción | Archivo:línea | FormData | Devuelve |
|---|---|---|---|
| `crearComercio` | `admin/comercios/actions.ts:42` | `nombre` `descripcion` `marca_id` `categoria_id` `logo_url` `correo` | `{error?}` o `{ok, email}` |
| `editarComercio` | `admin/comercios/actions.ts:114` | mas `id` `perfil_id` `correo` `correo_original` | `{error?}`; éxito redirige a ficha |
| `cambiarEstadoComercio` | `admin/comercios/actions.ts:163` | `id` `activar` | `void`, redirige |
| `cambiarEstadoAccesoComercio` | `admin/comercios/actions.ts:179` | `id` `perfil_id` `activar` | `void`, redirige |
| `crearSucursal` | `sucursales-actions.ts:35` | `comercio_id` `nombre` `ciudad_id` `direccion` `telefono` | `{error?}` |
| `editarSucursal` | `sucursales-actions.ts:59` | mas `id` | `{error?}` |
| `cambiarEstadoSucursal` | `sucursales-actions.ts:88` | `id` `comercio_id` `activar` | `void` |
| `crearPromocion` | `promociones-actions.ts:52` | `comercio_id` `titulo` `descripcion` `tipo_beneficio_id` `valor` `fecha_inicio` `fecha_fin` | `{error?}` |
| `editarPromocion` | `promociones-actions.ts:89` | mas `id` | `{error?}` |
| `cambiarEstadoPromocion` | `promociones-actions.ts:131` | `id` `comercio_id` `activar` | `void` |

Consumidores: `comercio-form.tsx:11`, `editar-comercio-form.tsx:10`,
`sucursal-form.tsx:14`, `promocion-form.tsx:14`, y la ficha
`admin/comercios/[id]/page.tsx:13-15` para los tres `cambiarEstado*`.

### 1.4 Planes, usuarios y cuenta

| Acción | Archivo:línea | Rol | FormData | Devuelve |
|---|---|---|---|---|
| `crearPlan` | `admin/planes/actions.ts:42` | `super_admin` | `nombre` `descripcion` `precio` `duracion_meses` | `{error?}`; éxito va a `/admin/planes` |
| `editarPlan` | `admin/planes/actions.ts:62` | `super_admin` | mas `id` | `{error?}` |
| `cambiarEstadoPlan` | `admin/planes/actions.ts:88` | `super_admin` | `id` `activar` | `void` |
| `crearUsuario` | `admin/usuarios/actions.ts:34` | `super_admin` | `tipo` (`super_admin` o `empleado`), `email` `nombres` `apellidos` `cedula` `telefono` | `{error?}` o `{ok, email}` |
| `editarUsuario` | `admin/usuarios/actions.ts:124` | `super_admin` | `perfil_id` `nombres` `apellidos` `cedula` `telefono` `email` `email_original` | `{error?}`; éxito va a `/admin/usuarios` |
| `cambiarEstadoAcceso` | `admin/usuarios/actions.ts:185` | `super_admin` | `perfil_id` `activar` | `void` |
| `cambiarPassword` | `admin/cuenta/actions.ts:11` | **sesión válida; no comprueba rol** | `password` `confirmar` | `{error?}` o `{ok}` |

`cambiarPassword` actúa siempre sobre el usuario de la sesión, así que no necesita rol.
Es la única excepción a "verificación de rol al entrar" y es correcta por construcción.

### 1.5 Portal de Comercios — `src/app/comercios/(portal)/actions.ts`

Guarda: `requireRolComercio()`, que **redirige** a `/comercios/login` si no cumple.

| Acción | FormData | Devuelve |
|---|---|---|
| `buscarMiembro` | `numero_membresia` de 8 dígitos, `metodo` (`qr` o `numero`) | `{error?}` o `{miembro: MiembroEncontrado, metodo}` |
| `registrarVenta` | `numero_membresia` `sucursal_id` `promocion_id` `metodo_registro` `valor_compra` `valor_descuento` | `{error?}` o `{ok}` |

`registrarVenta` **recalcula el descuento en servidor** (`calcularDescuento` y
`calcularValorFinal`, de `src/lib/comercios/ventas.ts`): el valor que envía el formulario
es informativo, nunca autoritativo. El diseño puede mostrarlo; no puede depender de él.

### 1.6 Búsqueda para la paleta de comandos — `src/app/admin/actions.ts`

```ts
buscarMiembrosAction(termino: string): Promise<MiembroEncontrado[]>
```

Rol: `super_admin` o `empleado` (`requireRol`, que **redirige**). Devuelve lista vacía con
menos de 2 caracteres; tope duro de **8 resultados**. Es la única acción llamada
imperativamente desde el cliente (`src/components/shell/command-palette.tsx:15`).

### 1.7 La mutación que NO pasa por Server Action

`src/app/activar-cuenta/_components/activar-form.tsx:56` llama
`supabase.auth.updateUser({ password })` **desde el navegador**, con el cliente
`@/lib/supabase/client`. Es el único punto del producto donde una escritura no cruza una
Server Action. La sesión la deja el enlace de invitación de un solo uso; si no hay
sesión, el formulario pinta el estado `invalido` y no se muestra.

---

## 2. Formas de datos

### 2.1 Tipos que devuelven las acciones y llegan al render

```ts
// src/lib/miembros/buscar-miembros.ts:14 — la lista de /admin/miembros y la paleta
export type MiembroEncontrado = {
  id: number
  nombre: string                   // "Nombres Apellidos", ya compuesto
  numeroMembresia: string
  cedula: string
  estado: EstadoDerivado | null    // null = nunca tuvo membresía
}

// src/app/comercios/(portal)/actions.ts:10 — MISMO NOMBRE, forma DISTINTA (ver 5)
export type MiembroEncontrado = {
  id: number
  nombreCompleto: string
  numeroMembresia: string
  vigente: boolean
  membresiaId: number | null
  planNombre: string | null
}

// src/lib/miembros/membresias.ts:68 — el único eje de estado del producto
export type EstadoDerivado =
  | { activa: true;  diasRestantes: number }
  | { activa: false; motivo: 'vencida' | 'cancelada' | 'suspendida' }

// src/lib/auth/auth.ts:10 — lo que ve todo layout protegido
export type PerfilActual = {
  userId: string
  email: string | null
  rolId: number
  rolCodigo: RolCodigo
  rolNombre: string
  activo: boolean
}

// src/lib/miembros/requerir-miembro.ts:7
export type MiembroActual = { /* perfil, fila de miembros y membresía vigente */ }
```

Estados de formulario. Todos comparten la misma anatomía, un `error` opcional mas extras:

```ts
LoginState | LoginComercioState | LoginMiembroState  = { error?: string }
PasswordState                                        = { error?: string; ok?: boolean }
RegistrarVentaState                                  = { error?: string; ok?: boolean }
BuscarMiembroState    = { error?: string; miembro?: MiembroEncontrado; metodo?: MetodoRegistroVenta }
CrearComercioState    = { error?: string; ok?: boolean; email?: string }
CrearUsuarioState     = { error?: string; ok?: boolean; email?: string }
RegistrarMiembroState = { error?: string; ok?: boolean; numero?: string; correo?: string; nombre?: string }
EditarComercioState | EditarMiembroState | EditarUsuarioState
  | PlanState | PromocionState | SucursalState | RenovarState = { error?: string }
```

### 2.2 Enumeraciones cerradas

`src/lib/supabase/database.types.ts:13-24`

```ts
type RolCodigo           = 'super_admin' | 'empleado' | 'comercio' | 'miembro'
type TipoBeneficioCodigo = 'porcentaje' | 'dos_por_uno' | 'monto_fijo' | 'regalo'
type MetodoRegistroVenta = 'qr' | 'numero'
type TipoMembresia       = 'nueva' | 'renovada'
type EstadoMembresia     = 'activa' | 'vencida' | 'cancelada' | 'suspendida'
```

### 2.3 Filas que llegan del servidor

`src/lib/supabase/database.types.ts` declara 16 tablas y 1 función. Las que el frontend
lee de verdad:

```ts
miembros: {
  id: number; perfil_id: string | null; codigo_publico: string
  numero_membresia: string; nombres: string; apellidos: string; cedula: string
  telefono: string | null; direccion: string | null; ciudad_id: number | null
  registrado_por: number | null; fecha_registro: Timestamp
  created_at: Timestamp; updated_at: Timestamp; deleted_at: Timestamp | null
}

membresias: {
  id: number; miembro_id: number; plan_id: number
  tipo: 'nueva' | 'renovada'
  estado: 'activa' | 'vencida' | 'cancelada' | 'suspendida'   // NO leer en crudo
  fecha_inicio: string; fecha_fin: string   // 'YYYY-MM-DD' civil, NO timestamptz
  precio_pagado: number; comprobante_url: string | null
  vendido_por: number | null; membresia_anterior_id: number | null
}

comercios:   { id; perfil_id: string|null; marca_id; categoria_id; nombre;
               descripcion; logo_url; activo; deleted_at }
sucursales:  { id; comercio_id; ciudad_id; nombre: string|null; direccion;
               telefono; activo; deleted_at }
promociones: { id; comercio_id; tipo_beneficio_id; titulo; descripcion;
               valor: number|null; fecha_inicio: string|null;
               fecha_fin: string|null; activo; deleted_at }
planes_membresia: { id; nombre; descripcion; precio: number;
                    duracion_meses: number; activo; deleted_at }
ventas:      { id; miembro_id; membresia_id; sucursal_id; promocion_id;
               valor_compra; valor_descuento; valor_final;
               metodo_registro: 'qr'|'numero'; registrada_por_perfil: string|null;
               fecha_hora: Timestamp }
bitacora_actividad: { id; actor_id: string|null; accion: string; entidad: string;
                      entidad_id: number|null;
                      datos_anteriores, datos_nuevos: Record<string,unknown>|null;
                      fecha_hora: Timestamp }
empleados:   { id; perfil_id: string|null; nombres; apellidos;
               cedula: string|null; telefono; deleted_at }
perfiles:    { id: string /* uuid = auth.users.id */; rol_id: number; activo: boolean }
configuracion:  { id; clave: string; valor: string|null; descripcion: string|null }
marcas          { id; nombre; logo_url }
categorias      { id; nombre }
ciudades        { id; nombre; departamento }
roles           { id; codigo: RolCodigo; nombre; descripcion }
tipos_beneficio { id; codigo: TipoBeneficioCodigo; nombre; descripcion }
```

**Convención de borrado**: casi todo lleva `deleted_at` y toda consulta filtra
`.is('deleted_at', null)`. El borrado es lógico; no hay ninguna acción de borrado duro
expuesta al frontend.

**Dos ejes de apagado que no son lo mismo**, y que la interfaz mezcla con facilidad:
`comercios.activo` (el comercio no aparece en el catálogo) y `perfiles.activo` (la cuenta
no puede entrar). `admin/comercios/[id]/page.tsx` los expone como dos controles distintos,
con dos acciones distintas.

### 2.4 La única función RPC

```ts
buscar_miembro_comercio(p_numero: string) => {
  miembro_id: number
  nombres: string
  apellidos: string
  numero_membresia: string
  vigente: boolean
  membresia_id: number | null
  plan_nombre: string | null
}[]
```

Es la **única** vía por la que el Portal de Comercios ve datos de un miembro. Devuelve
`vigente` ya calculado; el portal no recibe la fila de `membresias` y **no puede derivar
el estado por su cuenta ni conocer la fecha de vencimiento**. Consumida en
`comercios/(portal)/actions.ts:41` y `:104`.

---

## 3. Estados de error que la API puede devolver

No hay códigos HTTP: los errores son **cadenas en español ya redactadas para el usuario**,
dentro del campo `error` del estado del formulario. El frontend las pinta tal cual dentro
de un `Alert` con `tone="danger"`.

| Clase de error | Ejemplo textual | Lo maneja el frontend hoy |
|---|---|---|
| Permiso, en acciones con estado | `No tienes permiso para realizar esta acción.` | Sí, `Alert` dentro del formulario |
| Permiso, en los `cambiarEstado*` | sin texto | Sí, pero **como navegación**: redirige a `/login?error=sin_permiso` y la página de login lee `searchParams.error` |
| Validación de campo | `La cédula es obligatoria.` · `Ingresa un correo electrónico válido.` · `El precio pagado debe ser un número mayor o igual a 0.` | Sí, pero **solo como banner global**. Ningún error se ata a su campo: `Field` acepta `error` y de sus **78 usos solo 1 lo pasa**, en la galería de desarrollo |
| Duplicado | `Ya existe un miembro con la cédula 123.` | Sí, banner global |
| Referencia inválida | `El plan seleccionado no existe o está inactivo.` · `La sucursal seleccionada no es válida.` | Sí |
| Regla de negocio | `La membresía de este miembro ya no está vigente.` · `Esa promoción ya no está vigente.` | Sí |
| Fallo de Postgres filtrado | `No se pudo registrar el miembro: {error.message}` | Sí, **y el mensaje crudo de Postgres se le muestra al usuario** |
| Sesión caducada | `Tu sesión expiró. Vuelve a iniciar sesión.` | Sí, solo en `cambiarPassword` |
| Credenciales | `Correo o contraseña incorrectos.` | Sí, con sacudida del formulario vía `:has(.alerta)` en `pantalla-auth.module.css:165` |
| Cuenta inactiva | `Tu cuenta está inactiva. Contacta al administrador.` | Sí |
| Portal equivocado | `Este acceso es exclusivo para comercios.` · `Esta cuenta no tiene acceso al portal administrativo.` | Sí |
| Colisión de número | `No se pudo generar un número de membresía único. Intenta de nuevo.` | Sí |
| Fallo de lectura en una página | silencioso | **No.** Las consultas de página desestructuran solo `data` e ignoran `error`; se renderiza el fallback vacío como si no hubiera filas. Solo `notFound()`, 22 usos, cubre el caso "no existe" |
| Excepción no capturada | genérico | Parcial: `src/app/admin/error.tsx` cubre `/admin`. **`/miembros`, `/comercios`, `/login` y `/activar-cuenta` no tienen `error.tsx`** |

**Lo que NO existe**: un campo que diga qué input falló; un código de error estable, todo
es texto libre en español; una lista de errores múltiples, siempre llega uno, el primero
que salta; y ninguna distinción entre error recuperable y no recuperable.

---

## 4. Capacidades que la API NO ofrece

Esto acota lo que el diseño puede proponer. Cada línea está verificada por ausencia.

| Capacidad | Estado | Evidencia |
|---|---|---|
| **Paginación** | **No existe, en ninguna forma.** Ni por desplazamiento ni por cursor | `.range(` no aparece ni una vez en `src/` |
| **Saber si una lista se truncó** | No. Todo se corta con `.limit()` sin avisar: 200 en bitácora, 100 en el buscador de miembros y el catálogo de comercios, 50 en el histórico de un miembro y en sucursales y promociones del portal de comercios, 8 en la paleta. Sin `count`, la interfaz **no sabe si sobran filas** | `admin/bitacora/page.tsx:146`, `miembros/(portal)/page.tsx:55`, `admin/miembros/[id]/page.tsx:140`, `admin/actions.ts:22` |
| **Ordenación elegible por el usuario** | No. El `.order()` es fijo en el código de cada página: `nombre`, `apellidos`, `fecha_fin` descendente, `fecha_hora` descendente | 30 usos de `.order(`, ninguno parametrizado |
| **Búsqueda por texto real** | Solo `ILIKE` con comodines sobre una columna. Sin `to_tsvector`, sin insensibilidad a acentos, sin ranking | `admin/comercios/page.tsx:67`, `miembros/(portal)/page.tsx:80` y `:96` |
| **Filtrar miembros por estado de membresía** | **No.** El estado se deriva **en memoria, después** de traer las filas | `src/lib/miembros/buscar-miembros.ts:99` |
| **Filtro por rango de fechas en listas** | Solo en `/admin/bitacora` y `/admin/metricas`. Miembros, comercios, planes y usuarios no aceptan fechas | `searchParams` de cada página |
| **Agregados en base de datos** | Parcial. Hay 3 `count: 'exact', head: true` en `/admin`. Todo lo demás se agrega **en Node** sobre las filas crudas | `src/lib/metricas/metricas.ts:30,74,113` |
| **Series temporales** | No. No hay agrupación por día, semana ni mes: `/admin/metricas` da totales de un rango, no una curva |
| **Historial de ventas de un miembro** | No hay página ni acción. `ventas` solo se lee agregada en métricas |
| **Borrado** | Ninguna acción borra. Todo es `activo` mas `deleted_at` |
| **Subida de archivos** | `comercios.logo_url` y `membresias.comprobante_url` son **texto**. No hay Supabase Storage ni un solo `input type="file"` en el repositorio |
| **Tiempo real o suscripciones** | No. Cero `supabase.channel(...)` |
| **Notificaciones al usuario** | Solo correo saliente vía MailerSend, para la invitación. No hay bandeja, ni push, ni centro de avisos |
| **Nombre propio del usuario de sesión** | `perfiles` **no guarda nombre**. El shell usa el correo como identidad y de ahí saca las iniciales del avatar | `src/app/admin/layout.tsx:49-51` |
| **Auditoría completa** | `registrarActividad` solo se invoca desde miembros, comercios y usuarios. La columna `accion` es `string` en la base, pero la aplicación solo escribe `alta`, `edicion` y `renovacion` | `src/lib/bitacora/bitacora.ts:53` |

### Restricción de interfaz que se comporta como una del contrato

`ToastProvider` se monta **solo dentro de `AppShell`**, es decir solo en `/admin`
(`src/components/shell/app-shell.tsx:72`). `useToast()` **lanza** fuera de ahí
(`src/components/ui/toast.tsx:50`). Cualquier flujo que se diseñe para el Portal de
Miembros, el Portal de Comercios o las pantallas de acceso **no puede usar toasts** sin
montar antes el provider en ese árbol.

---

## 5. Datos que llegan y no se usan (sobrefetching)

Candidatos a mejora **sin tocar el backend**: están todos en la zona de trabajo.

| Dónde | Qué sobra | Coste |
|---|---|---|
| `miembros/(portal)/page.tsx:56-58` | Se traen las 100 marcas, las 100 ciudades y todos los tipos de beneficio en cada visita, aunque el filtro esté vacío. Solo se usan como diccionario de nombres de los comercios que sí se muestran | 3 consultas y hasta 200 filas por render |
| `miembros/(portal)/page.tsx:50-55` | Además, la lista completa de comercios activos, solo para poblar el desplegable del filtro | 1 consulta redundante con la de resultados |
| `admin/miembros/[id]/page.tsx:128` | Historial completo con 7 columnas; la tabla pinta 4 | Crece sin techo con las renovaciones |
| `admin/metricas/page.tsx:130-138` | Se traen **todos** los empleados, sucursales, comercios y miembros para construir los diccionarios de nombres del agrupado en memoria | 4 consultas de tabla entera |
| Las **14 parejas** de ruta real y ruta interceptada | El bloque de consultas está **duplicado literalmente** en ambas. No es sobrefetching en ejecución, solo corre una, pero sí duplicación exacta del contrato de lectura: si una cambia y la otra no, el formulario recibe opciones distintas según por dónde entres | `admin/miembros/nuevo/page.tsx:12-21` frente a `admin/@modal/(.)miembros/nuevo/page.tsx:22-31` |
| `buscar_miembro_comercio` | Devuelve `membresia_id`, que solo se usa al insertar la venta, nunca en pantalla | Aceptable |

### Colisión de nombres a vigilar

Existen **dos tipos distintos llamados `MiembroEncontrado`**, con campos incompatibles
(`nombre` frente a `nombreCompleto`; `estado` frente a `vigente`):

- `src/lib/miembros/buscar-miembros.ts:14`, que consumen `/admin/miembros` y la paleta
- `src/app/comercios/(portal)/actions.ts:10`, que consume el Portal de Comercios

TypeScript no avisa porque nunca coinciden en el mismo archivo. Cualquier agente que mueva
código entre portales se lo va a encontrar.

---

## PROPUESTAS PARA BACKEND

Cruzan la frontera de `SCOPE.md` §2. **No se implementan aquí.** Ordenadas por lo que más
limita al diseño.

### P1 — Paginación con total, en las listas que pueden crecer

- **Qué**: que `buscarMiembros`, la bitácora y el catálogo de comercios acepten página y
  tamaño, y devuelvan las filas junto al total. `count: 'exact'` ya se usa en
  `src/app/admin/page.tsx:42`, así que el patrón existe en el repositorio.
- **Por qué la alternativa solo-frontend es peor**: hoy el `.limit(100)` corta en
  silencio. Un botón de "ver más" del lado del cliente **no puede existir** sin `range`, y
  paginar en memoria exige traerlo todo primero, que es justo lo que se quiere evitar.
- **Entretanto**: mostrar un aviso cuando el número de filas recibidas iguale al límite:
  "mostrando los primeros 100, afina la búsqueda". Es honesto y no cruza la frontera.

### P2 — Filtrar miembros por estado de membresía en la consulta

- **Qué**: un parámetro de estado (`activa`, `inactiva`, `porVencer`) en `buscarMiembros`,
  resuelto en SQL con la misma regla que `derivarEstadoMembresia`.
- **Por qué**: el estado se deriva **después** de traer las filas
  (`buscar-miembros.ts:99`), así que "ver solo los vencidos" hoy solo puede filtrar los
  100 que ya llegaron, y daría un recuento falso. Es el filtro más obvio de la pantalla y
  el único que el producto no puede ofrecer.
- **Entretanto**: filtrar en cliente el conjunto ya traído, **etiquetándolo** como "dentro
  de los N cargados". Nunca presentarlo como un total.

### P3 — Nombre y apellido asociados al perfil

- **Qué**: dos columnas en `perfiles`, o una vista que resuelva el nombre del actor según
  su rol.
- **Por qué**: `AppShell` muestra el correo como identidad y saca de ahí las iniciales del
  avatar (`src/app/admin/layout.tsx:49-51`). No hay forma solo-frontend de conocer el
  nombre de un `super_admin` sin fila en `empleados`: el propio código llama a ese caso
  "D5" (`src/app/admin/miembros/actions.ts:26`).
- **Entretanto**: seguir con el correo. Es lo que hay.

### P4 — Errores con el campo asociado

- **Qué**: que las acciones devuelvan también qué campo falló, no solo el texto.
- **Por qué**: `Field` ya acepta un `error` y lo pinta junto al input con
  `aria-describedby` y `aria-invalid` (`src/components/ui/field.tsx:29-39`), pero de sus
  **78 usos solo 1 lo pasa**, y es la galería de desarrollo (`app/dev/ui/gallery.tsx:336`).
  En producto, cero: el estado no dice qué campo falló.
  Adivinar el campo parseando el texto en español es frágil y se rompe al reescribir un
  mensaje.
- **Entretanto**: seguir con el banner global sobre el formulario.

### P5 — No devolver el mensaje de Postgres al usuario

- **Qué**: las plantillas del tipo "No se pudo registrar el miembro: ..." concatenan
  `error.message` y filtran nombres de restricción y de columna hasta la interfaz.
- **Por qué**: es texto de base de datos en una pantalla de negocio, imposible de traducir
  y de diseñar. **El hallazgo de seguridad es de `security-auditor`**; se anota aquí solo
  porque condiciona el copy de los estados de error.
- **Entretanto**: nada. Mostrarlo tal cual es lo que hay.

### P6 — Agregados y series en la base

- **Qué**: una función que devuelva ventas y altas **agrupadas por día** y por dimensión.
- **Por qué**: hoy `/admin/metricas` trae las filas crudas y agrupa en Node
  (`src/lib/metricas/metricas.ts`). Cualquier gráfico temporal multiplica el volumen
  transferido y no puede acotarse.
- **Entretanto**: mantener el panel en cifras totales del rango, sin curvas.
