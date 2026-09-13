# Plan de mejora y rediseño · 13/09/2026

> Complemento de [`DIAGNOSTICO-2026-09-13.md`](./DIAGNOSTICO-2026-09-13.md), que dice qué
> está mal. Este dice en qué orden se arregla y por qué ese orden.
>
> Regla que gobierna la secuencia: **nada que dependa de una migración sin aplicar puede
> estar en el camino crítico**. El propietario todavía no ha tocado la base de datos, y una
> pantalla que se ve vacía el día del despliegue es peor que una pantalla que no existe.

---

## Las seis olas

| Ola | Qué | Depende de | Bloquea a |
|---|---|---|---|
| **O1** | Corrección de los 20 defectos verificados (diseño, a11y, móvil) | — | Nada. Va primero porque son bugs, no preferencias |
| **O2** | Portal Público: landing `/` + formulario de aliados `/aliados` | — | — |
| **O3** | Rediseño de la Herramienta de Comercios | O1 (safe areas y campos numéricos ya arreglados ahí) | — |
| **O4** | Cierre del Portal de Miembros: carnet, `inactiva`, pruebas | — | El juicio estético final |
| **O5** | Imágenes y avatares: subida real, portadas, fotos de perfil | Migración aplicada por el propietario | La vitrina «bonita» del portal público |
| **O6** | Verificación en dispositivo real y cierre | O1–O5 | — |

O1, O2 y O3 son independientes entre sí y se ejecutan en paralelo sobre archivos disjuntos.
O5 es la única que depende de una acción humana fuera del repositorio.

---

## O1 — Corregir lo que está roto

Veinte puntos, todos verificados leyendo el código, ninguno especulativo. Agrupados:

**Bugs de CSS y movimiento.** El borde con gradiente de `ficha.module.css:210` (CSS inválido
que nunca se pinta) · `ProgressBar` haciendo `transition: width` · literales en `Switch` y en
el `@media print` del carnet · `outline: none` sin sustituto en `menu.module.css`.

**`@media` que deben ser `@container contenido`.** Tres módulos. Con una cautela escrita en la
orden: `Card` se usa en los cuatro portales, así que antes de cambiarlo hay que comprobar que
existe contenedor ancestro en todos. Un `@container` sin contenedor **nunca casa**, y sería
peor que el `@media` que sustituye.

**Accesibilidad.** El `aria-live` que le falta al resultado de búsqueda en la caja —el único
fallo WCAG real— · `Sheet` etiquetando el `div` interno en vez del `<dialog>` · `Toast` que no
pausa con foco de teclado · filtros sin `aria-current` · `Button size="sm"` sin ampliación
táctil · `AccionEstado` sin `aria-pressed` · `Alert` sin `key` · `Badge` donde toca
`StatusBadge`.

**Móvil.** Safe areas de la cabecera y el `main` de Comercios · el campo «Descuento» que abre
teclado sin dejar escribir · los dos campos numéricos con teclado sucio en Android.

**Lo que deliberadamente NO entra en O1**, porque es decisión del propietario y no un defecto:
quitar el `Badge tone="gold"` del beneficio, y quitar el `autoFocus` del login de miembros.

---

## O2 — Portal Público

No existe hoy: `src/app/page.tsx` es un `redirect('/miembros')`, así que quien escribe el
dominio a secas sin ser socio aterriza en una puerta que no es la suya.

Spec completa en [`SPEC-portal-publico.md`](./SPEC-portal-publico.md). Ocho secciones, en un
orden que tiene razón de ser: **cómo funciona va ANTES que la vitrina**, porque el deseo sin
mecanismo no convierte —primero se entiende qué es el club, luego se desea lo que ofrece.

Tres decisiones tomadas en la orden de implementación, no en la spec:

1. **La lectura anónima se resuelve con `createAdminClient()`, no con una política RLS nueva.**
   La spec lo marcó como bloqueante porque `comercios` y `marcas` hoy solo se leen con sesión.
   Pero depender de SQL sin aplicar significa desplegar una landing vacía. El cliente de
   servicio ya se usa así en las páginas de `admin/@modal/`, corre solo en servidor y se limita
   a columnas públicas.
2. **El CTA primario va en tinta, no en oro.** `CLAUDE.md` retiró explícitamente al Portal
   Público de la lista de pantallas habilitadas para relleno dorado — y el comentario de
   `badge.tsx:139` todavía cita la frase retirada, que hay que corregir.
3. **La solicitud de aliado NO puede ser «best-effort».** El correo de bienvenida actual se
   traga los fallos en silencio; este no puede, porque una solicitud perdida en silencio es un
   comercio aliado perdido. Si el envío falla, el usuario ve el error y una salida por WhatsApp.

El formulario vive en página real `/aliados` presentada dentro de `<Overlay>`, no como ruta
interceptada: la ranura `@modal` es exclusiva de `app/admin/layout.tsx` y crear otra para un
único formulario público sería inventar arquitectura. No hay lista de trabajo detrás que
perder, que es lo que la regla del overlay protege.

---

## O3 — Herramienta de Comercios

Es el portal con menos deuda técnica y más deuda de diseño: se desvía poco del sistema
—buena base— pero nunca recibió una pasada de dirección de arte.

El criterio no es «que se parezca al de miembros», es **quién lo usa**: un empleado de pie en
la caja, con una mano, con el cliente delante. Continúa el lenguaje visual del Portal de
Miembros (materiales, filos, jerarquía) pero **no copia su barra inferior**: aquel tiene dos
destinos y este tiene uno, y darle navegación sería inventar sitios a los que ir.

Spec en [`SPEC-rediseno-comercios.md`](./SPEC-rediseno-comercios.md). El corazón es la tarjeta
de resultado del socio: tiene que leerse a un metro, de un vistazo, con el pulgar tapando
parte de la pantalla.

---

## O4 — Cerrar el Portal de Miembros

| Tarea | Qué |
|---|---|
| **Carnet (H1)** | La pantalla que el socio enseña en la caja, hoy montada sobre `Card` y `PageHeader` genéricos. `perfil/loading.tsx` ya dibuja el esqueleto de la pantalla que debería existir: ahí está la forma que hay que construir. **El `QrCode` no se toca**: negro sobre blanco en los dos temas, o se rompe el escaneo delante del cliente |
| **`inactiva` (H3)** | `variant="primary"` → `brand`. Es la única pantalla del portal con un motivo comercial claro, y hoy informa en vez de invitar |
| **Pruebas (H5)** | `logo-comercio.ts`, `estanterias.ts`, `navegacion-portal.ts`, `volver-catalogo.ts`. Empezar por el último: **sanea una redirección abierta** y es el que más lo necesita |
| **Respaldo del logo (H4)** | Exige navegador: comprobar si Chrome pinta un glifo de rotura junto al texto alternativo |
| **View Transitions (H6)** | Habilitadas y sin un solo `view-transition-name`. Es deuda declarada, no un olvido: primero hay que decidir entre qué pares de pantallas hay continuidad real |
| **Datos de prueba (H7)** | Con 4 comercios y 0 promociones vigentes no se renderiza ninguna estantería y todas las tarjetas caen al estado vacío. **Sembrar datos antes de pedir juicio estético**, o el juicio será sobre el estado vacío |

---

## O5 — Imágenes y avatares

La migración ya está escrita: `supabase/migrations/20260913120000_imagenes_y_avatares.sql`.
**Nadie la ha aplicado**, y hasta que se aplique nada de esta ola funciona.

Qué añade:

- `comercios.portada_url` — la foto ancha del carrusel. Distinta del logo, que es una marca
  sobre fondo neutro pintada con `contain` en placa de proporción fija.
- `perfiles.avatar_url` — la foto de quien trabaja en el club. Vive en `perfiles` y no en una
  tabla por rol porque la bitácora y los reportes muestran al **autor** de una acción, y el
  autor es un perfil.
- `miembros.foto_url` — la foto del socio. Va en `miembros` y no en `perfiles` porque
  `miembros.perfil_id` es nullable: alguien registrado en el mostrador, antes de activar su
  acceso, tiene que poder tener foto igual.
- Dos buckets, no uno: `imagenes-comercios` (1 MB, lo sube la administración) y `avatares`
  (512 KB, lo sube su dueño). Los límites y las políticas de escritura son distintos, y
  mezclarlos obligaría a la política más laxa de las dos.
- `public.es_administracion()` — espejo **exacto** de `requireRol('super_admin','empleado')`.
  Dos verdades sobre quién es administrador es como se cuelan los agujeros.

SVG queda excluido a propósito: puede contener scripts y, servido desde un bucket público, es
superficie de XSS.

Después de aplicarla hay tres frentes de interfaz: sustituir el `<input type="text">` donde
hoy se pega una URL a mano por un selector de archivo en los formularios de administración;
dar al socio y al administrador una forma de cambiar su foto; y mostrar avatar + nombre en
bitácora y reportes. Y una tarea que no es de interfaz: regenerar `database.types.ts`.

---

## O6 — Lo que solo cierra un dispositivo real

La automatización de navegador de esta máquina no redimensiona la ventana, así que estos
puntos no se pueden cerrar desde aquí y **no deben marcarse como hechos**:

zoom de teclado en Android con el `autoFocus` del login · `readOnly` con `type="number"` en
iOS frente a Android · recorte de cámara del escáner QR en gama media y baja · lector de
pantalla real sobre `Sheet` en móvil · zoom al 200% con la barra lateral en rail · el glifo de
rotura del logo · y el **presupuesto del oro ≤5%**, que se mide sobre captura, nunca se estima.

---

## Riesgo que conviene tener presente

`supabase/migrations/` contiene hoy dos archivos, ambos de la tanda de seguridad de agosto.
**No hay un solo `CREATE TABLE` en el repositorio**: el esquema se creó a mano en Supabase y lo
único que lo refleja en el código es `database.types.ts`, mantenido a mano. Consecuencia viva:
no hay entorno reproducible y `database.types.ts` puede desviarse de la realidad en silencio.
La migración de O5 es la ocasión natural para empezar a corregirlo, pero no lo corrige del
todo.
