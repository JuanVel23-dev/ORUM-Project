# Pendientes — cierre de sesión del 30/09 al 01/10/2026

Estado: **todo commiteado en `main` (6 commits locales por delante de
`origin/main`, aún SIN `git push`)**. El merge de `explorar` está cerrado
(`d97243c`): estructura nueva de GitHub + el SEO local repuesto. `tsc` y
`eslint .` limpios, 386/386 pruebas y `next build` completo en verde.

Fuera de los commits, a propósito: `docs/superpowers/specs/2026-09-23-anuncios-novedades-design.md`
(ya venía modificado antes de esta sesión, no es de esta tanda), `graphify-out/`
y `repomix-output.xml` (generados).

---

## Qué se hizo en esta sesión (para ubicarse)

| Tema | Estado |
|---|---|
| «Mis movimientos» (`/miembros/movimientos`) | Código hecho, sin ver en pantalla |
| Derechos de fotos: declaración, una sola cara, retirada (solo `super_admin`), `/derechos-de-autor`, cláusula 9 de Términos | Código hecho y revisado; migración aplicada |
| Caché de 60 s de los datos públicos (`datos-publicos.ts`) | Código hecho, sin medir en vivo |
| Índices de `bitacora_actividad` | Aplicado y verificado |
| Fotos de socio con ruta de clave aleatoria + sin listado público + 2 fotos movidas | Aplicado y verificado |
| Permisos de 3 funciones + 2 índices duplicados borrados | Aplicado y verificado |
| Endurecimiento menor (políticas, índices FK, `anon` sin escritura) | Aplicado y verificado |

Migraciones en `supabase/migrations/` (todas ya aplicadas en producción):
`20260930120000_derechos_fotos`, `20261001120000_indices_bitacora`,
`20261001130000_avatares_sin_listado_publico`,
`20261001140000_permisos_funciones_e_indices_duplicados`,
`20261001150000_endurecimiento_menores`.

Plan de la funcionalidad de derechos: `docs/superpowers/plans/2026-09-30-derechos-imagenes.md`.
Especificación: `docs/superpowers/specs/2026-09-30-derechos-imagenes-design.md`.

---

## 1. Tuyos

### Urgente
- [ ] **Hacer `git push` de `main`** (6 commits por delante de `origin/main`). No lo
  hice yo: publicar a un repositorio compartido lo decides tú. Si `DanielBullaUsaquen`
  es otra persona, conviene avisarle antes del refactor de `explorar` reconciliado con el SEO.
- [ ] **Desplegar** cuando hagas el push (las migraciones ya están en producción; el
  código nuevo no).

### Antes de probar
- [ ] **Reiniciar el servidor de desarrollo.** Se añadieron rutas bajo `@modal`;
  sin reiniciar, «Retirar foto» puede abrirse como página completa en vez de
  encima de la ficha.

### Pruebas manuales de derechos de fotos
(La lista completa está en la Task 8 del plan.)
- [ ] Socio: subir una foto marcando la casilla; «Guardar» debe estar apagado sin ella.
- [ ] Una imagen sin cara (por ejemplo un logo) debe bloquearse; una con varias caras también.
- [ ] Si la detección falla (bloquear `/mediapipe/*` en las DevTools), la foto debe poder continuar.
- [ ] Admin: la pantalla `/admin/miembros/[id]/foto` tiene casilla y detección.
- [ ] `super_admin`: «Retirar foto» aparece solo con foto y se abre encima de la ficha; la retirada queda en `/admin/bitacora` con su motivo.
- [ ] `empleado`: **no** ve el botón «Retirar foto».
- [ ] `/derechos-de-autor` muestra el correo; `/terminos` tiene la sección 9; el pie enlaza la página. Revisar también en móvil.
- Ya medido (no hace falta repetirlo): tras **borrar** un archivo, la CDN deja de
  servirlo en menos de 60 segundos. Mover un archivo **no** purga la caché.

### Correo y textos legales
- [ ] **Probar el correo:** enviar un mensaje a `derechos@cluborum.com` y confirmar que llega a la bandeja del admin.
- [ ] **Abogado:** la sección 9 de los Términos, la página `/derechos-de-autor` y la política de reincidentes. Al recibir su visto bueno:
  - quitar `robots: { index: false }` y el párrafo «Borrador pendiente de revisión legal» de `src/app/(publico)/derechos-de-autor/page.tsx`;
  - quitar la nota de borrador del comentario de `src/app/(publico)/terminos/page.tsx`;
  - añadir `/derechos-de-autor` a `PAGINAS_FIJAS` en `src/app/sitemap.ts`.

### Panel de Supabase (no los puedo ver yo)
- [ ] **Activar la protección contra contraseñas filtradas** (Auth). Probablemente requiere un plan de pago.
- [ ] **Confirmar dos límites del plan gratuito:** si el proyecto se pausa tras días de inactividad y qué copias de seguridad incluye. Para un club en producción, cualquiera de las dos sería un riesgo.

### Decisión
- [ ] **Entorno de pruebas sin pagar.** El plan gratuito no incluye ramas. Opciones:
  - un segundo proyecto gratuito de Supabase como entorno de prueba;
  - Supabase local con Docker.
  Mientras tanto seguimos con el método de mostrar cada SQL antes de aplicarlo y
  verificar después contra la API real.

---

## 2. Míos (cuando me lo pidas)

- [ ] **Verificación visual** de todo: «Mis movimientos» (incluido el botón de icono en móvil), el editor de fotos con casilla, la retirada, la página de reclamos y los Términos. En esta máquina la automatización de navegador no pinta bien: lo más fiable es que lo veas tú y me pases capturas.
- [ ] **Comprobar que el caché de 60 s funciona:** en Supabase → Logs → Postgres, recargar la portada varias veces y ver una sola lectura por minuto.
- [x] **`pnpm build` completo** — hecho el 01/10/2026, en verde. Si falla con un error de
  `.next/dev/types/validator.ts`, es caché vieja del servidor de desarrollo: borra `.next/dev`.

---

## 3. Decisiones tomadas que conviene recordar

- **Cambios del admin en la fachada pública:** pueden tardar hasta 60 segundos en
  verse. Si algún día quieres «al instante», basta añadir `revalidateTag('publico')`
  en las acciones del admin (la etiqueta `publico` ya está puesta).
- **Comercios cerrados en «Mis movimientos»:** salen como «Comercio no disponible»
  porque la RLS de `comercios`, `sucursales` y `promociones` solo deja leer lo activo.
  La solución sin aflojar la RLS sería una función de base de datos acotada a las
  ventas de cada socio. La dejaste para más adelante.
- **Código nuevo sin desplegar:** las migraciones ya están en producción, pero el
  código nuevo no. La base es compatible con el código antiguo, así que no hay
  riesgo en el intermedio. Despliega el código cuando el merge esté resuelto.
- **Retirada de fotos:** solo `super_admin`. Los empleados pueden cambiar la foto
  pero no retirarla.
- **Si la detección facial no puede ejecutarse**, el socio continúa (la capa legal
  sigue aplicando).
- **`/derechos-de-autor`** está en `noindex` y fuera del sitemap hasta el visto bueno legal.

---

## 4. Mejoras futuras (no urgentes)

- [ ] **Bucket de fotos privado con URLs firmadas.** Conviene antes de crecer, o si
  tu abogado considera las fotos de socios como datos personales sensibles
  (Ley 1581). Hoy las rutas llevan una clave aleatoria y no se pueden listar, pero
  siguen siendo públicas para quien conozca la dirección.
- [ ] **Límite de peticiones con Cloudflare** (la «fase 2»: proxy en el portal
  público, reglas y rate limiting en los logins).
- [ ] **Detección de caras con fotos enormes:** reducirlas antes de analizarlas
  (hoy la detección es síncrona y una foto de 25 MB puede congelar la pantalla un momento).
- [ ] **Peso de `public/mediapipe/`:** unos 23 MB en el repositorio (WASM 22,7 MB +
  modelo 230 KB). Solo se descarga al abrir el editor de la foto.
- [ ] **Menores del linter que se dejaron a propósito:**
  - 27 avisos de políticas permisivas múltiples;
  - políticas que llaman a `es_admin()` por cada fila;
  - seis claves foráneas de auditoría sin índice (`creado_por`, `actor_id`,
    `registrada_por_perfil`…);
  - los avisos de «índice sin uso» (se ignoran con tan pocos datos);
  - el bucket `comprobantes`, que ningún código usa y no tiene límite de tamaño;
  - dos índices únicos de cédula con criterios distintos (`miembros_cedula_key` total
    y `miembros_cedula_unica` parcial): la cédula de un socio borrado no se puede reutilizar.
- Las funciones `es_admin`, `es_administracion`, `es_super_admin`, `es_mi_miembro`
  y `rol_actual` siguen ejecutables por `anon` **a propósito**: las evalúan las
  políticas RLS y revocarlas podría romper el acceso en silencio.
