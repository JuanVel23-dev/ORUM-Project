# Propuesta para backend — portada de comercios (imagen del negocio)

> **Es una propuesta, no un cambio aplicado.** `SCOPE.md §2` pone `supabase/**` en zona de
> solo lectura: ningún agente la ejecuta. La corre una persona.
>
> 12/09/2026 · rama `mejora-diseno` · contexto: carrusel destacado del Portal de Miembros
> (`PLAN-carrusel-destacados.md`, propuesta **B9**)

---

## Por qué, en una frase

El propietario pidió un carrusel con **«imágenes del negocio o productos»** y la base de
datos no tiene dónde guardarlas: `comercios` tiene **una sola** columna de imagen,
`logo_url`, y `promociones` no tiene ninguna.

Verificado sobre `src/lib/supabase/database.types.ts`:

```
comercios     id, perfil_id, marca_id, categoria_id, nombre, descripcion,
              logo_url, activo, created_at, updated_at, deleted_at
promociones   id, comercio_id, tipo_beneficio_id, titulo, descripcion, valor,
              fecha_inicio, fecha_fin, activo, created_at, updated_at, deleted_at
categorias    id, nombre
```

Un logotipo no es una fotografía del negocio. La tarjeta del carrusel está escrita para
recibir la foto —estado **I1** del plan— y hasta que exista la columna se queda en el estado
**I2**, que es una portada tipográfica deliberada con el logo. Funciona, pero es el techo.

## Qué se pide

**Una columna.** Nada más, en esta primera versión.

```sql
-- Portada del comercio: una imagen 4:3 que representa al negocio.
-- La consume el carrusel destacado del Portal de Miembros y, mas adelante,
-- la cabecera de la ficha /miembros/comercios/[id].
-- Nullable a proposito: un comercio sin portada es el caso normal hoy y la
-- interfaz ya lo resuelve sin hueco (estado I2).
alter table comercios add column portada_url text;
```

Nombre de archivo sugerido, siguiendo la convención del repositorio
(`AAAAMMDDHHMMSS_descripcion.sql`):

```
supabase/migrations/20260912120000_add_portada_url_comercios.sql
```

### Por qué `text` nullable y no `not null`

Hoy ningún comercio tiene portada. Un `not null` obligaría a un valor de relleno, y un
valor de relleno es exactamente lo que produce la tarjeta a medio cargar que el diseño
evita: la interfaz necesita distinguir **«no hay portada»** de **«hay portada»** para elegir
entre I1 e I2.

### Por qué no se pide una tabla de galería todavía

El encargo dice «imágenes» en plural, y eso justificaría:

```sql
create table comercio_imagenes (
  id bigserial primary key,
  comercio_id bigint not null references comercios(id),
  url text not null,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
```

**No la recomiendo ahora**, por dos razones concretas:

1. Una portada por comercio da el 90 % del efecto visual con el 10 % del trabajo: es la
   imagen que se ve en el carrusel y en la tarjeta, que es donde está el encargo.
2. **No hay contenido para llenar una galería.** Hay 4 comercios y ninguno ha aportado una
   sola foto. Una tabla vacía con su RLS, su política de escritura y su interfaz de carga es
   trabajo que no se puede probar con datos reales.

Cuando los comercios estén subiendo portadas y pidan más de una, la tabla se añade sin tocar
`portada_url`: la portada sigue siendo la imagen canónica y la galería es adicional.

## Lo que esto NO resuelve, y es una dependencia real

`portada_url` guarda una URL. **Si esa URL apunta al servidor del comercio, hereda los tres
problemas que los logos ya tienen**, y multiplicados, porque una portada pesa mucho más que
un logotipo:

1. **Desaparece** cuando al comercio le da por reorganizar su web. ORUM no controla la
   disponibilidad de una imagen que ocupa el 70 % de la primera pantalla del socio.
2. **Sin control de peso ni formato.** Un JPG de 3 MB se descarga entero para pintarse en una
   tarjeta de 300px. Seis veces, en la primera pantalla, en móvil.
3. **`next/image` sigue siendo inviable** mientras los dominios sean arbitrarios: exigiría
   declarar cada host de cada comercio en `remotePatterns`.

Eso lo resuelve el bucket de `PROPUESTA-BACKEND-imagenes.md`, **propuesto el 29/08 y todavía
sin respuesta**. Con un bucket, `next/image` pasa a ser una línea de `next.config.ts` y el
peso y el formato quedan acotados en el servidor.

> **Recomendación de orden**: el bucket primero, `portada_url` después. Si se hace al revés,
> entran portadas de 3 MB alojadas en dominios ajenos y luego hay que migrarlas.

## Decisión sobre SVG, que se arrastra de la propuesta anterior

La propuesta del bucket recomienda **excluir `image/svg+xml`** del `allowed_mime_types`: un
SVG puede contener scripts, y servido desde un bucket público en el mismo origen es
superficie de XSS. Para una **portada** la decisión es más fácil que para un logo: una
fotografía nunca es SVG. **Excluirlo sin discusión aquí.**

## Qué cambia en la aplicación cuando la columna exista

Nada estructural: por eso se escribe la tarjeta antes.

- `comercio-card` y la tarjeta del carrusel añaden `portada_url` al `select` que ya hacen.
- El estado I1 se activa solo, por presencia del dato.
- Entra en vigor la regla de contraste de `PLAN-carrusel-destacados.md §7`: **ningún texto se
  apoya directamente sobre la imagen**. El nombre, la categoría y la insignia viven bajo la
  foto, sobre superficie sólida; lo único que monta encima es la placa del logo, que lleva su
  propio fondo opaco y tiene contraste ya firmado en `T4 §4.3`.

Esa última es la razón por la que la foto no puede entrar «y ya»: sin esa regla, cada
fotografía que suba un comercio es un fallo de contraste potencial, y `CLAUDE.md` fija AA con
cero fallos.

## Riesgo si no se hace

El carrusel se entrega y funciona, pero se queda en el estado I2 —logo sobre material— en el
100 % de las tarjetas. Es una pieza digna y bastante más atractiva que el catálogo actual,
**pero no es lo que se pidió**: «imágenes del negocio o productos» requiere esta columna, y
no hay forma de resolverlo desde el frontend.
