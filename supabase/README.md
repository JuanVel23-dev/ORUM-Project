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
   archivo se mantiene a mano y hoy **no** conoce las tablas ni columnas nuevas:
   hasta que se regenere, el código que las use no compila.
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

## Nota sobre el estado del esquema

Antes de esta tanda, `supabase/migrations/` contenía **dos archivos**, ambos de
seguridad, y **ningún `CREATE TABLE`**: el esquema se creó a mano en el panel y
lo único que lo refleja en el código es `database.types.ts`, mantenido a mano.

Consecuencia viva: no hay entorno reproducible, ningún cambio de esquema pasa por
revisión, y `database.types.ts` puede desviarse de la realidad en silencio. Estos
dos archivos son el principio de la corrección, no la corrección entera.
