# Novedades del club (anuncios) — diseño

> Fecha: 2026-09-23
> Estado: aprobado, listo para plan de implementación.

## Intención

El administrador necesita anunciar dos cosas a los socios: un beneficio nuevo
en el club, o una actualización general de ORUM que valga la pena compartir.
El anuncio debe poder verse desde el Portal Público (quien todavía no es
socio) y desde el Portal de Miembros (quien ya lo es), y el admin decide por
cada anuncio a cuál o cuáles de los dos portales llega.

## Por qué se llama `anuncios` y no `novedades` en el código

`src/lib/comercios/estanterias.ts` ya usa la palabra "novedades" para un
concepto distinto: los comercios recién sumados al club
(`seleccionarNovedades`, la estantería "Nuevos en el club" del catálogo de
miembros). Para no tener dos conceptos distintos con el mismo nombre en el
código — lo que rompe un `grep` y confunde a quien lea después —, la tabla, el
dominio (`src/lib/anuncios/`) y las rutas de administración
(`/admin/anuncios`) usan "anuncios". De cara al socio y al admin, la etiqueta
de interfaz sigue siendo **"Novedades"**: es una decisión interna, invisible
en el producto.

## 1. Modelo de datos

```sql
create table anuncios (
  id bigint generated always as identity primary key,
  titulo text not null,
  cuerpo text not null,
  imagen_url text,
  mostrar_publico boolean not null default true,
  mostrar_miembros boolean not null default true,
  activo boolean not null default true,
  creado_por uuid references usuarios(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

- `imagen_url` es un puntero administrado por Storage, igual que
  `comercios.logo_url` / `comercios.portada_url`: se llena exclusivamente al
  subir un archivo al bucket público nuevo `imagenes-anuncios`, nunca por
  texto libre. Confirmado contra el esquema real de `comercios` y el listado
  de buckets existentes (`imagenes-comercios`, `avatares`, ambos públicos).
- `mostrar_publico` / `mostrar_miembros` son independientes: el admin marca
  uno, otro o ambos. Al menos uno debe quedar marcado (validación de
  servidor).
- Sin `fecha_fin`: se desactiva a mano con `activo`, igual que
  `planes_membresia`. Sin borrado definitivo desde la interfaz — solo el
  soft-delete de `deleted_at`, coherente con el resto del esquema, sin acción
  de UI que lo dispare en esta tanda.
- Sin relación con `comercios`: el cuerpo es texto libre. Si el admin quiere
  mencionar un comercio, lo nombra en el texto.

### RLS

- `anuncios_admin` — `ALL` para `{authenticated}` con `es_admin()`. Igual que
  `comercios_admin` / `planes_admin`.
- `anuncios_public_select` — `SELECT` para `{anon, authenticated}` con
  `activo AND deleted_at IS NULL`. Necesaria porque el Portal de Miembros lee
  con `createClient()` (atado a RLS); el Portal Público lee con
  `createAdminClient()` y se la salta, pero la política debe existir para que
  el primero funcione. Calcada de `comercios_public_select`.

## 2. CRUD en Administración

Mismo patrón que `planes_membresia` — sin piezas nuevas de arquitectura.

- **Navegación**: entrada "Novedades" (ícono `Megaphone`) en el grupo
  "Administración" del sidebar (`nav-config.ts`), visible solo para
  `super_admin`. Un empleado no publica anuncios.
- **Lista** `/admin/anuncios` — `DataList`: Título, Alcance (badges según
  `etiquetaAlcance`), Estado (activo/inactivo), Creado. Acciones:
  `AccionEstado` para activar/desactivar, y "Editar" en el menú.
- **Crear** `/admin/anuncios/nuevo` + gemela
  `@modal/(.)anuncios/nuevo` — overlay con Título, Cuerpo (textarea) y dos
  checkboxes de alcance. Nace `activo = true`. Validación de servidor: título
  y cuerpo obligatorios, al menos un checkbox de alcance marcado (si no:
  "Elige al menos un portal donde mostrarla.").
- **Editar** `/admin/anuncios/[id]/editar` + gemela `@modal` — mismos campos,
  más la sección de imagen al final del mismo overlay, con `SubidaImagen`
  (el mismo componente que ya sube el logo de un comercio). Va en editar y no
  en crear porque la ruta de Storage necesita el `id` — la misma razón por la
  que el logo de un comercio se sube después de crearlo, no en su alta.
- **Acciones de servidor**: `src/app/admin/anuncios/actions.ts`
  (`crearAnuncio`, `editarAnuncio`, `cambiarEstadoAnuncio`) calcadas de
  `planes/actions.ts`; `src/app/admin/anuncios/imagen-actions.ts`
  (`guardarImagenAnuncio`) calcada de `guardarImagenComercio`, con el bucket
  `imagenes-anuncios`.

## 3. Lectura en los dos portales

- **Consulta compartida** — `src/lib/anuncios/consultas.ts`:
  `obtenerAnunciosVisibles(supabase, portal)` filtra `activo`, `deleted_at is
  null` y la columna de alcance correspondiente, `order by created_at desc`.
- **El banner** — `AnuncioBanner`, componente de cliente pequeño que recibe
  por props el anuncio más reciente ya resuelto en el servidor. Franja de
  ancho completo arriba del contenido, tono `cacao` en las dos portadas —la
  misma franja negra que ya usan el héroe de la landing y el "Top del club"
  de miembros—, ícono `Megaphone` en oro, botón de cerrar. Se cierra con
  `usePreferenciaLocal('anuncio-cerrado-{id}', false)`: la clave lleva el
  id, así que un anuncio nuevo (id distinto) reaparece aunque el socio haya
  cerrado el anterior, sin tabla ni escritura de servidor. Entrada con fade +
  `scale(0.95 → 1)`, nunca `scale(0)`.
- **La página "Novedades"** — `/novedades` (dentro de `(publico)`) y
  `/miembros/novedades`: lista completa con `Card` por anuncio (imagen si
  tiene, título, cuerpo completo, fecha), más reciente primero. `EmptyState`
  si todavía no hay ninguna.
- **Navegación**: se añade `{ href: '/novedades', texto: 'Novedades' }` a
  `ANCLAS` (afecta cabecera y menú móvil público) y un tercer destino
  "Novedades" a `DESTINOS` en `portal-nav.tsx` (afecta nav de escritorio y
  tab bar de miembros). `esDestinoActivo` no cambia.

## 4. Pruebas

Solo funciones puras, según la norma del proyecto. `etiquetaAlcance(mostrarPublico,
mostrarMiembros): string` vive en `src/lib/anuncios/` y se prueba igual que
`navegacion-portal.test.ts`. El resto —formularios, subida de imagen,
banner— se verifica a mano en el navegador.

## Fuera de alcance (explícito)

- Sin segmentación por plan de membresía.
- Sin notificación push ni correo.
- Sin editor de texto enriquecido — cuerpo en texto plano.
- Sin galería — una sola imagen por anuncio.
- Sin borrado definitivo desde la interfaz.
- Sin fecha de expiración automática.
- Sin enlace a un comercio.
