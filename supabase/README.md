# Cómo aplicar los cambios de base de datos

> Para el propietario. Son **dos archivos, en este orden**. El segundo depende
> de una función que crea el primero (`es_administracion()`), así que invertirlos
> falla.

## Orden

| # | Archivo | Qué añade |
|---|---|---|
| 1 | `migrations/20260913120000_imagenes_y_avatares.sql` | Foto de portada del comercio, avatar de quien trabaja en el club, foto del socio, y los dos buckets de Storage |
| 2 | `migrations/20260914090000_favoritos_y_mas_usados.sql` | Favoritos del socio, «los que más usas», y la galería de imágenes de la ficha |
| 3 | `migrations/20260914140000_top_descuentos.sql` | El top de descuentos más usados del club (global). **Añadido después: si ya corriste los dos primeros, este es el único que te falta** |
| 4 | `migrations/20260925090000_recursos_sitio.sql` | **Lo nuevo del 25/09/2026.** La tabla `recursos_sitio` y el bucket `recursos-sitio`: la imagen principal de la portada, los carteles de promociones y los logotipos de ORUM, todo administrado desde `/admin/recursos` |

## Cómo se corren

**Opción A — desde el panel de Supabase** (la más rápida si no tienes la CLI):

1. Abre tu proyecto → **SQL Editor** → **New query**.
2. Pega el contenido del archivo 1 **entero** y ejecuta.
3. Repite con el archivo 2.

Los dos son **idempotentes**: usan `if not exists`, `on conflict do nothing` y
`create or replace`. Volver a ejecutarlos no rompe nada ni duplica datos, así que
si dudas de si uno se aplicó, córrelo otra vez.

**Opción B — con la CLI de Supabase**, si la tienes enlazada al proyecto:

```bash
supabase db push
```

## Después de aplicarlos, avísame de esto

1. **Que se aplicaron**, para regenerar `src/lib/supabase/database.types.ts`. Ese
   archivo se mantiene a mano y hay que mantenerlo al día con cada migración:
   hasta que se actualice, el código que use lo nuevo no compila.
   *(Al día: `recursos_sitio` ya está tipada, 25/09/2026.)*
2. **El host exacto** de tu proyecto Supabase (el valor de
   `NEXT_PUBLIC_SUPABASE_URL` sin el protocolo). Hace falta para
   `images.remotePatterns` en `next.config.ts`, que hoy no tiene bloque `images`.

## Qué NO hacen, a propósito

- **No borran nada.** Los `logo_url` externos que ya tienen algunos comercios
  siguen funcionando; las URLs de Storage y las de terceros conviven.
- **No admiten SVG** en los buckets. Un SVG puede contener scripts y, servido
  desde un bucket público del mismo origen, es superficie de XSS.
- **No tocan `registrar_venta`** ni las revocaciones de agosto: están ahí por una
  auditoría de seguridad concreta.

## Lo del 25/09/2026, con detalle

Son **dos archivos y son independientes**: puedes correr uno sin el otro.

### 1. `migrations/20260925090000_recursos_sitio.sql` — HACE FALTA

Sin esto, `/admin/recursos` se abre pero avisa en rojo de que falta la tabla, y
la página de inicio sigue funcionando exactamente como hoy (el héroe muestra el
collage de aliados y no hay apartado de promociones). Nada se rompe, pero nada
de lo nuevo funciona tampoco.

Crea:

- La tabla `public.recursos_sitio`, con RLS. Lectura pública **solo de lo que
  esté marcado como visible**; escritura solo para administración
  (`es_administracion()`, la misma función que ya usan los otros buckets).
- El bucket `recursos-sitio`: público, 2 MB por archivo, PNG/JPEG/WebP.
  **SVG no**, por lo mismo que en los otros dos: puede llevar scripts dentro.
  Si el logo que quieres subir es SVG, expórtalo a PNG.

Idempotente. Si dudas de si ya lo corriste, córrelo otra vez.

### 2. `scripts/planes-mensual-anual.sql` — YA ESTÁ APLICADO

Deja dos planes de membresía: **Mensual $30.000** (1 mes) y **Anual $250.000**
(12 meses). El archivo queda en el repositorio para dejar constancia y para
poder repetirlo en otro entorno; **contra tu base ya se ejecutó**.

Lo que hizo, exactamente:

| Plan | Antes | Ahora |
|---|---|---|
| Membresía ORUM | activo, $0, 1 mes | **retirado** |
| Premium | inactivo, $500, 2 meses | **retirado** |
| Platinum | activo, $230.000, 3 meses | **retirado** |
| Mensual | — | creado: $30.000, 1 mes, a la venta |
| Anual | — | creado: $250.000, 12 meses, a la venta |

**«Retirado» y no «borrado», y no es una licencia que me tomara.** Hay **13
membresías** apuntando a esos tres planes, y `membresias.plan_id` es clave
foránea: un `delete` habría fallado, y si la foránea hubiera sido en cascada
se habría llevado por delante el historial de pagos de socios reales.

Retirar es `activo = false` + `deleted_at`, que es justo lo que el producto ya
entiende por «ya no existe»:

- **Desaparecen de `/admin/planes`**, que filtra `deleted_at is null`.
- **No se pueden vender ni renovar**: las tres pantallas que ofrecen planes
  filtran `activo = true` y `deleted_at is null`.
- **El historial sigue en pie**: el carnet de un socio con membresía vigente
  busca su plan por `id`, sin filtrar el borrado, así que sigue diciendo
  «Platinum» a quien compró Platinum. Que dijera «—» sería mentir sobre lo que
  esa persona pagó.

Si algún día quieres que uno vuelva, es un `update` poniendo `deleted_at` a
`null` y `activo` a `true`. No se perdió nada.

---

## Nota sobre el estado del esquema

Antes de esta tanda, `supabase/migrations/` contenía **dos archivos**, ambos de
seguridad, y **ningún `CREATE TABLE`**: el esquema se creó a mano en el panel y
lo único que lo refleja en el código es `database.types.ts`, mantenido a mano.

Consecuencia viva: no hay entorno reproducible, ningún cambio de esquema pasa por
revisión, y `database.types.ts` puede desviarse de la realidad en silencio. Estos
dos archivos son el principio de la corrección, no la corrección entera.
