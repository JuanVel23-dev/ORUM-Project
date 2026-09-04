# Propuesta para backend — alojamiento de imágenes de comercios

> **Esto es una propuesta, no un cambio aplicado.** `SCOPE.md` §2 pone `supabase/**`
> en zona de solo lectura: ningún agente la ejecuta. La lleva una persona al lado
> backend, la revisa y decide.
>
> Redactada el 2026-08-29 · rama `mejora-diseno` · contexto: rediseño del Portal de Miembros

---

## Por qué

Los comercios aliados van a aportar sus propios logos. Hoy `comercios.logo_url` es
`text` libre y `ComercioLogo` (`src/components/ui/comercio-logo.tsx:24`) lo pinta con
un `<img>` crudo. Eso **ya funciona**, pero apunta a servidores de terceros.

Tres consecuencias que chocan de frente con el objetivo del rediseño —que el socio
perciba el club como confiable y cuidado:

1. **El logo desaparece cuando al comercio le da por reorganizar su web.** ORUM no
   controla la disponibilidad de una imagen que aparece en su propio catálogo.
2. **No hay control de peso ni formato.** Un PNG de 2 MB se descarga entero para
   pintarse a 48px. Con el catálogo lleno de logos, esto degrada la carga en móvil.
3. **`next/image` es inviable** mientras los dominios sean arbitrarios: exigiría
   declarar en `remotePatterns` cada host de cada comercio. Con un solo bucket, pasa
   a ser una línea de configuración.

## Qué se pide

Un bucket de Supabase Storage para logos de comercios y marcas, con políticas que
permitan a cada comercio subir **solo lo suyo**, y una restricción de peso y formato.

### 1. Bucket

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos-comercios',
  'logos-comercios',
  true,                                        -- lectura pública: el catálogo es privado, las imágenes no son sensibles
  524288,                                      -- 512 KB. Un logo que no cabe aquí está mal exportado
  array['image/png','image/jpeg','image/webp','image/svg+xml']
);
```

**Decisión pendiente sobre SVG**: `image/svg+xml` es ideal para logotipos (nítido a
cualquier tamaño, pesa nada) pero **un SVG puede contener scripts**. Servido desde un
bucket público en el mismo origen, es una superficie de XSS. Dos salidas: excluirlo
del `allowed_mime_types`, o servir el bucket desde un dominio distinto. **Recomiendo
excluirlo** en la primera versión: PNG y WebP resuelven el caso.

### 2. Convención de rutas

```
logos-comercios/comercios/{comercio_id}/logo.{ext}
logos-comercios/marcas/{marca_id}/logo.{ext}
```

El `comercio_id` en la ruta es lo que hace verificable la política de escritura.

### 3. Políticas RLS sobre `storage.objects`

```sql
-- Lectura: cualquiera. El bucket es público y el catálogo ya exige sesión para llegar aquí.
create policy "logos_lectura_publica"
on storage.objects for select
using (bucket_id = 'logos-comercios');

-- Escritura: un comercio solo escribe en su propia carpeta.
create policy "logos_escritura_propia"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'logos-comercios'
  and (storage.foldername(name))[1] = 'comercios'
  and (storage.foldername(name))[2] = (
    select c.id::text from public.comercios c
    where c.perfil_id = auth.uid() and c.deleted_at is null
  )
);

-- Actualizar y borrar: mismo criterio.
create policy "logos_actualizacion_propia"
on storage.objects for update to authenticated
using (
  bucket_id = 'logos-comercios'
  and (storage.foldername(name))[2] = (
    select c.id::text from public.comercios c
    where c.perfil_id = auth.uid() and c.deleted_at is null
  )
);
```

Las de administración (subir el logo de cualquier comercio, y las de `marcas/`) se
resuelven con el mismo patrón contra el rol del perfil. **Quien las escriba debe
comprobar cómo resuelve `requireRol` el rol de administración en `src/lib/auth/`**,
para no inventar un segundo criterio de autorización que diverja del de la aplicación.

### 4. Migración, no cambio manual

Hoy `supabase/migrations/` tiene **dos archivos**, ambos de la tanda de seguridad de
agosto, y **no hay un solo `CREATE TABLE` en el repositorio**: el esquema se creó
directamente en Supabase y solo existe reflejado a mano en
`src/lib/supabase/database.types.ts`.

Eso significa que hoy no hay entorno reproducible, ningún cambio de esquema pasa por
revisión, y deshacer uno malo es manual. **Si se va a tocar la base de datos para
esto, es el momento de empezar a hacerlo con migraciones versionadas.** Todo el SQL de
arriba debería entrar como `supabase/migrations/<timestamp>_storage_logos.sql`.

---

## Lo que NO hace falta pedir

Estas tres se pueden hacer hoy, solo con frontend, y **no dependen de esta propuesta**:

| Mejora | Por qué es viable ya |
|---|---|
| **Filtro por categoría** | `categorias` existe y `comercios.categoria_id` también. El catálogo simplemente no los selecciona ni los ofrece. |
| **Estantería "Nuevos en el club"** | `comercios.created_at` existe. Basta añadirlo al `select` de `page.tsx` y ordenar. |
| **Respaldo de logo por marca** | `marcas.logo_url` existe. `ComercioLogo` solo mira el del comercio; la cadena logo propio → logo de marca → inicial no cuesta backend. |

## Lo que sí queda bloqueado sin backend

| Bloqueado | Falta |
|---|---|
| **Estantería "Destacados"** | No existe columna de destacado ni de orden en ninguna tabla. Ordenar por `id` no es destacar. |
| **Catálogo completo y paginado** | `.range(` no aparece nunca en `src/`; el catálogo se trunca en silencio a 100 comercios (`page.tsx:86`). |

---

## Cambios de frontend que habilita, una vez aplicada

1. **`next.config.ts`** — añadir `images.remotePatterns` con el host del proyecto
   Supabase. Un solo dominio, no una lista abierta.
2. **`ComercioLogo`** — pasar de `<img>` crudo a `next/image`: formatos modernos,
   redimensionado y `sizes` correctos. Se puede quitar el `eslint-disable` de :23.
3. **`onError`** — hoy no lo hay: si una URL muere, el navegador pinta el icono de
   imagen rota, que es peor que el respaldo tipográfico. Debe caer a la inicial.
4. **Logos transparentes sobre tema oscuro** — los logotipos oscuros sobre PNG
   transparente desaparecen en la tarjeta oscura. Placa con fondo propio y relleno
   consistente. Es decisión de diseño, no de backend, pero solo se puede cerrar
   sabiendo qué formatos se admiten.
5. **Relación de aspecto** — `ComercioLogo` fuerza cuadrado (`width: size; height: size`),
   así que un logo apaisado se deforma. `object-fit: contain` dentro de caja fija.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| SVG con script en bucket público del mismo origen | Excluir `image/svg+xml`, o servir desde otro dominio |
| Política RLS mal escrita → un comercio pisa el logo de otro | La ruta lleva el `comercio_id` y la política lo verifica contra `perfil_id` |
| Divergencia entre esta autorización y la de `requireRol` | Escribir las políticas leyendo antes `src/lib/auth/` |
| Migrar sin versionar agrava el problema existente | Entra como migración en `supabase/migrations/` |
