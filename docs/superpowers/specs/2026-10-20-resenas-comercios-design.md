# Reseñas de comercios — diseño

Fecha: 20/10/2026. Encargo del cliente: dejar implementada desde ya la función.

## Intención

Los socios califican a los comercios aliados con estrellas y un mensaje opcional. Esas reseñas aportan confianza a otros socios que eligen dónde usar su beneficio, y dan a cada comercio y al administrador una vía de respuesta pública. El cliente lo pidió como parte del producto, no como experimento.

## Qué se decidió (con el propietario)

1. **Quién reseña**: solo un socio que tenga al menos una venta registrada en ese comercio (en cualquiera de sus sucursales).
2. **Una reseña por socio y por comercio** (no por sucursal). El socio puede editarla.
3. **Estrellas**: el pedido decía "0 a 5". Decisión mía, no confirmada explícitamente: **1 a 5 enteras**; "0" no existe porque equivale a "sin calificar". El propietario aprobó el resumen que lo decía.
4. **Mensaje opcional**: se puede enviar solo con estrellas.
5. **Quién las ve**: todos los socios, en la ficha de cada comercio, con promedio, cantidad y lista. El comercio las ve en su portal; el administrador, por comercio.
6. **Comercio**: puede responder cada reseña (una respuesta, editable). No puede borrar reseñas.
7. **Administrador**: ve las reseñas por comercio, puede eliminarlas y puede responder con su perfil.
8. **Si responden ambos**, se muestran las dos respuestas, la del administrador identificada como de ORUM.

## Decisiones mías (a revisar)

- El socio **puede borrar su propia reseña**.
- El **portal público no las muestra** (no se mencionó).
- Una reseña eliminada por el administrador se **borra de verdad** ("eliminar"); se registra en la bitácora existente.
- Solo reseñan socios con **membresía vigente** en el momento de escribir o editar (misma regla que el resto del portal de miembros, `derivarEstadoMembresia`).
- Solo se puede reseñar un comercio **activo y no eliminado**; si luego sale del club, sus reseñas dejan de mostrarse con la ficha.

## Decisiones menores tras la revisión (mías, a revisar)

- **Qué es una venta válida**: cualquier fila de `ventas` del socio en una sucursal de ese comercio; no se exige que su membresía siga vigente al leerla, solo al escribir la reseña.
- **Membresía vencida o socio dado de baja**: la reseña existente sigue mostrándose; el socio con membresía vencida no puede crear ni editar, pero sí borrar la suya. Si el socio se elimina, sus reseñas se borran en cascada.
- **Comercio fuera del club**: sus reseñas se ocultan a los socios; el comercio y el administrador las siguen viendo. Los datos se conservan.
- **Respuestas**: el comercio y el administrador tienen cada uno UNA respuesta por reseña, editable y borrable por su autor. La del administrador se muestra como "ORUM" (sin nombre del empleado). Puede responder cualquier administrador o empleado con acceso al panel de comercios (el constructor confirma el rol exacto). Eliminar una reseña y responder quedan en la bitácora.
- **Mensaje**: opcional; si existe, entre 1 y 500 caracteres, sin enlaces ni marcado. Un mensaje vacío al editar equivale a quitar el texto y dejar solo las estrellas.
- **Promedio y conteo**: se calculan en vivo con una función/vista agregada en la base (sin contadores guardados), para que editar o borrar nunca deje cifras desfasadas.
- **Tabla ausente**: las tres superficies ocultan la sección de reseñas si la tabla aún no existe.

## Decisiones confirmadas después de la revisión

- **Identidad del autor**: los demás socios ven nombre e inicial del apellido ("María G."). El comercio y el administrador ven al autor completo.
- **Borrado real**: cuando un socio borra su reseña, la fila se elimina de la base de datos, sin borrado lógico, y las respuestas del comercio y del administrador se van con ella. El socio puede volver a reseñar después. El borrado del socio no deja anotación en la bitácora.
- **Eliminación por el administrador** (mía, a revisar): también es borrado real. La bitácora registra quién, de qué comercio y cuándo, sin guardar el texto de la reseña.

## Metas

- Reseñar es rápido: desde la ficha, un overlay (regla de ORUM: formulario = overlay, no página).
- La regla "solo quien compró" la garantiza **la base de datos** (RLS/trigger), no solo la interfaz: el POST directo a PostgREST no debe poder saltársela, como ya se hizo con `fn_validar_venta`.

## No metas

- Fotos en reseñas, votos de "útil", reportes de reseñas, notificaciones por correo, respuestas anidadas o hilos.
- Reseñas por sucursal o por promoción.
- Mostrarlas en el portal público.
- Orden configurable más allá del básico.

## Anti-metas (sería un fracaso aunque "funcione")

- Que alguien sin compra pueda dejar reseña saltándose la interfaz.
- Que un comercio pueda borrar o editar reseñas ajenas, o responder reseñas de otro comercio.
- Que el promedio sea incorrecto tras editar o borrar.
- Que se rompa el diseño v6 de ORUM (ver `CLAUDE.md`): tokens, sombra sin bordes, oro con sus límites de contraste, `prefers-reduced-motion`, `:hover` solo bajo `hover: hover`.

## Restricciones del proyecto

- Next.js App Router, Server Components + server actions con verificación de rol; Supabase con RLS.
- Migración SQL idempotente en `supabase/migrations/`, estilo de `20261013120000_publicidad.sql`. El esquema se aplica a mano; el código debe tolerar que la tabla aún no exista (precedente: `obtenerPublicidadPublica` devuelve `null`).
- Pruebas automatizadas solo de funciones puras (promedio, validación de estrellas y mensaje, etc.) en `src/lib/`.
- Fechas: `timestamptz` formateado en `America/Bogota`.
- Nada de `style={{}}` ni valores literales: todo por tokens y `.module.css`.
- La ficha del socio es `src/components/comercios/ficha-comercio.tsx` (compartida con la pública) y se alimenta desde `src/app/miembros/(portal)/comercios/[id]/page.tsx`; las reseñas se añaden solo en la superficie de miembros.
- El cliente de servidor sin `service_role` para portales de usuario; las acciones del comercio toman el comercio de la SESIÓN (`obtenerMiComercio`), nunca del formulario.
- Las acciones de moderación y respuesta sueltan la caché pertinente (`updateTag`) si la ficha se cachea.

## Piezas

1. **Datos**: tabla de reseñas (socio, comercio, estrellas 1–5, mensaje opcional, fechas, única por socio+comercio); respuesta del comercio y respuesta del administrador (con quién y cuándo); RLS y/o trigger que exige venta previa y membresía vigente; promedio y conteo calculables sin traer toda la lista.
2. **Socio**: bloque de reseñas en la ficha (promedio, lista, respuestas); botón "Reseñar / Editar mi reseña" solo si tiene compra; overlay con estrellas y mensaje; borrar la propia.
3. **Comercio**: sección en su portal con sus reseñas y responder/editar respuesta.
4. **Administración**: vista de reseñas por comercio (probablemente como pestaña de la ficha de comercio en el panel), eliminar y responder.

## Lo que queda al constructor

Nombres de tablas y columnas, si la respuesta va en la misma fila o en tabla aparte, paginación y orden de la lista, textos de interfaz, ubicación exacta en el portal de comercios y en el panel, esquema visual de las estrellas dentro del sistema v6, y el detalle de los esqueletos/estados vacíos y de error.
