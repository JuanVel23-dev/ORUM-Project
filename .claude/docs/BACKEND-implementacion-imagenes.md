# Instrucciones de implementación — subida de imágenes (backend)

> **Documento de encargo.** El propietario ha decidido que la modificación de la base de
> datos y los permisos de subida los ejecuta el equipo de backend. Este archivo contiene
> lo que hay que hacer, en qué orden, y **el contrato exacto que el frontend espera** para
> que las dos partes encajen sin una segunda ronda.
>
> Complementa a [`PROPUESTA-BACKEND-imagenes.md`](./PROPUESTA-BACKEND-imagenes.md), que
> explica el *porqué*. Este explica el *cómo*.
>
> 2026-08-30 · rama `mejora-diseno`

---

## 0. Contexto en cinco líneas

Los comercios aliados aportarán sus logos. Hoy `comercios.logo_url` es `text` libre que
apunta a servidores de terceros: si el comercio reorganiza su web, el logo se rompe **en
el catálogo de ORUM**, delante del socio que paga. Se quiere alojar las imágenes en
Supabase Storage para controlar disponibilidad, peso y formato.

El rediseño del Portal de Miembros depende de esto para su capa de optimización, pero
**no está bloqueado**: el frontend funciona hoy con URLs externas y seguirá funcionando.
Esto es una mejora, no un prerrequisito.

---

## 1. Decisiones ya tomadas — no hace falta volver a discutirlas

| Decisión | Valor | Por qué |
|---|---|---|
| Bucket público | Sí | Los logos no son datos sensibles y el catálogo ya exige sesión para llegar a ellos |
| Límite de tamaño | **512 KB** | Un logo que no cabe en 512 KB está mal exportado |
| Formatos | `image/png`, `image/jpeg`, `image/webp` | |
| **SVG** | **EXCLUIDO** | Un SVG puede contener scripts; servido desde un bucket público del mismo origen es superficie de XSS. Si más adelante se quiere, va en un dominio aparte |
| Forma de entrega | **Migración versionada** | Ver §5 |

---

## 2. Migración SQL

Crear `supabase/migrations/<timestamp>_storage_logos.sql`.

### 2.1 Bucket

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos-comercios',
  'logos-comercios',
  true,
  524288,                                    -- 512 KB
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do nothing;
```

### 2.2 Convención de rutas — es lo que hace verificable la seguridad

```
logos-comercios/comercios/{comercio_id}/logo.{ext}
logos-comercios/marcas/{marca_id}/logo.{ext}
```

El identificador va **en la ruta** precisamente para que la política RLS pueda
compararlo contra el dueño de la sesión. No lo cambies sin reescribir las políticas.

### 2.3 Políticas RLS sobre `storage.objects`

```sql
-- LECTURA: pública.
create policy "logos_lectura_publica"
on storage.objects for select
using (bucket_id = 'logos-comercios');

-- ESCRITURA (administración): el rol que ya gestiona comercios.
create policy "logos_escritura_admin"
on storage.objects for all to authenticated
using (
  bucket_id = 'logos-comercios'
  and exists (
    select 1
    from public.perfiles p
    join public.roles r on r.id = p.rol_id
    where p.id = auth.uid()
      and p.activo
      and r.codigo = '<CODIGO_DEL_ROL_ADMIN>'   -- ← CONFIRMAR, ver aviso
  )
);
```

> **AVISO — no inventes el código de rol.** `roles.codigo` es `text UNIQUE` y no consta
> su valor en el frontend de forma literal. **Antes de escribir esta política, lee
> `src/lib/auth/` y usa exactamente el mismo criterio que `requireRol`.** Si aquí se
> define un segundo criterio de autorización que diverja del de la aplicación, se acaba
> con dos verdades sobre quién es administrador — que es como se cuelan los agujeros.

**Si más adelante se quiere que cada comercio suba su propio logo**, la política es la
misma con otro `with check`, comparando la carpeta contra su propio `comercio_id`:

```sql
and (storage.foldername(name))[1] = 'comercios'
and (storage.foldername(name))[2] = (
  select c.id::text from public.comercios c
  where c.perfil_id = auth.uid() and c.deleted_at is null
)
```

No hace falta para la primera versión. Ver §3.

---

## 3. Quién sube el archivo — el camino corto ya existe

**Recomendación: que lo suba la administración, extendiendo el flujo que ya hay.**

El Portal de Comercios es una herramienta de caja: sus únicas acciones son
`buscarMiembro` y `registrarVenta` (`src/app/comercios/(portal)/actions.ts`). Darles
subida de archivos significa construir pantalla, validación y permisos nuevos.

En cambio **la administración ya gestiona el logo**:

```
src/app/admin/comercios/actions.ts:27   const logo_url = String(formData.get('logo_url') ?? '').trim() || null
src/app/admin/comercios/actions.ts:93   crearComercio  → logo_url
src/app/admin/comercios/actions.ts:136  editarComercio → logo_url
```

Hoy ese campo es un `<input type="text">` donde alguien **pega una URL a mano**. El
cambio mínimo y correcto es sustituirlo por un selector de archivo: la Server Action
recibe el fichero, lo sube al bucket con el `comercio_id` que ya tiene, y guarda la URL
resultante en la misma columna de siempre.

**Ventaja**: no se toca el Portal de Comercios, no hay permisos nuevos que auditar, y
el diseño de administración —que el propietario ha dejado fuera del rediseño— apenas
cambia: un campo de formulario por otro.

### Qué debe hacer la acción, en orden

1. Validar tipo MIME y tamaño **en servidor**, no solo en el navegador.
2. Subir a `comercios/{comercio_id}/logo.{ext}` con `upsert: true` (sustituir el logo
   anterior, no acumular archivos huérfanos).
3. Obtener la URL pública y escribirla en `comercios.logo_url`.
4. Si la subida falla, **no dejar la columna a medias**: o se guarda la URL nueva o se
   conserva la anterior.
5. Registrar el cambio en `bitacora_actividad`, como hace el resto de mutaciones.

---

## 4. Contrato con el frontend — esto es lo que hay que respetar

Es la parte que decide si las dos mitades encajan. **Cúmplela literalmente.**

### 4.1 Qué se guarda en `comercios.logo_url`

**La URL pública completa**, no la ruta interna del bucket:

```
https://<proyecto>.supabase.co/storage/v1/object/public/logos-comercios/comercios/42/logo.webp
```

**Por qué la URL completa y no la ruta**: hoy la columna ya contiene URLs externas de
comercios que las tienen alojadas en su propia web. Guardar unas como ruta y otras como
URL obligaría al frontend a distinguirlas en cada render. Con URL completa, **el
frontend no cambia nada** y las dos fuentes conviven.

`ComercioLogo` (`src/components/ui/comercio-logo.tsx:24`) hace `<img src={logoUrl}>`
tal cual. Si se cumple esto, **funciona el día que se aplique la migración, sin
desplegar frontend**.

### 4.2 Lo mismo para `marcas.logo_url`

`marcas` tiene su propia columna `logo_url` y el rediseño va a usarla: un comercio sin
logo propio heredará el de su marca antes de caer al respaldo tipográfico. Misma
convención, carpeta `marcas/{marca_id}/`.

### 4.3 Qué necesita el frontend de vuelta, por escrito

Cuando esté aplicado, **comunicad estos tres datos**:

1. **El host exacto** del proyecto Supabase (el valor de `NEXT_PUBLIC_SUPABASE_URL` sin
   protocolo). Hace falta para `images.remotePatterns` en `next.config.ts`, que hoy
   **no tiene bloque `images`**.
2. **Confirmación de que el bucket es público** y no requiere URL firmada. Si se decide
   que sea privado, el frontend cambia sustancialmente: habría que generar URLs firmadas
   en servidor y expirarían. **Avisad antes, no después.**
3. **Si se normalizan las dimensiones** al subir (recorte a cuadrado, relleno). El
   diseño del catálogo depende de ello: los logos vienen en proporciones distintas y hay
   que decidir si los normaliza el backend al subir o el frontend al pintar. **Una de
   las dos, no las dos ni ninguna.**

---

## 5. Sobre las migraciones — leed esto aunque sea incómodo

`supabase/migrations/` contiene hoy **dos archivos**, ambos de la tanda de seguridad de
agosto de 2026. **No hay un solo `CREATE TABLE` en el repositorio.** El esquema se creó
directamente en Supabase y lo único que lo refleja en el código es
`src/lib/supabase/database.types.ts`, mantenido a mano y con `Relationships: []` en 15
de sus 16 tablas.

Consecuencias vigentes hoy: no hay entorno reproducible, ningún cambio de esquema pasa
por revisión, `database.types.ts` puede desviarse de la realidad en silencio, y deshacer
un cambio malo es manual.

**Este cambio es la ocasión natural para empezar a corregirlo.** No cuesta más aplicar
el SQL como migración versionada que pegarlo en el editor de Supabase, y a partir de ahí
existe un punto de partida.

---

## 6. Verificación antes de dar por cerrado

- [ ] Un usuario **sin** rol de administración **no puede** escribir en el bucket
- [ ] Un archivo de **más de 512 KB** se rechaza en servidor, no solo en el navegador
- [ ] Un archivo con extensión `.png` pero contenido distinto se rechaza
- [ ] Subir dos veces el logo del mismo comercio **sustituye**, no acumula
- [ ] La URL guardada abre en una ventana anónima, sin sesión
- [ ] Un comercio con logo externo antiguo **sigue viéndose** (no hay regresión)
- [ ] `database.types.ts` se regenera si cambió algo del esquema público
- [ ] La migración corre limpia sobre una base vacía

---

## 7. Lo que NO hay que hacer

- **No cambiar el nombre ni el tipo de `comercios.logo_url`.** El frontend depende de
  esa columna y de que siga siendo una URL utilizable directamente.
- **No hacer el bucket privado sin avisar.** Cambia el frontend por completo.
- **No admitir SVG** en esta versión.
- **No borrar los `logo_url` externos existentes** al migrar. Conviven.
- **No tocar `registrar_venta`** ni las revocaciones de agosto: están ahí por una
  auditoría de seguridad concreta.

---

## 8. Decisiones abiertas para quien implemente

1. **¿Normaliza el backend las dimensiones al subir?** Si sí, decid el tamaño y la
   política (recorte a cuadrado vs. relleno). Si no, lo resuelve el frontend con
   `object-fit: contain` en caja de proporción fija.
2. **¿Se extiende a `membresias.comprobante_url`?** Es el tercer campo `*_url` sin
   Storage detrás. No es urgente, pero si se crea el bucket conviene decidir los tres a
   la vez en lugar de repetir esta conversación dentro de dos meses.
