# Auditoría de experiencia móvil · 13/09/2026

> Emitida por `mobile-ux-specialist` sobre el árbol de `mejora-diseno` tras merge de
> `origin/main`. El agente no tiene permiso de escritura; el volcado lo hace el orquestador
> sin alterar el contenido. Auditoría **por código**: la automatización de navegador de esta
> máquina no redimensiona la ventana (deuda conocida nº3 de `CLAUDE.md`).

**Conteo** — Bloqueante: 0 · Serio: 2 · Moderado: 3 · Menor: 2

## Hallazgos

| # | Sev | Archivo:línea | Problema | Arreglo |
|---|---|---|---|---|
| 1 | SERIO | `src/app/comercios/(portal)/portal.module.css:16-29` | La cabecera `sticky` no reserva `env(safe-area-inset-top/left/right)`, a diferencia de la del Portal de Miembros. Con `appleWebApp.statusBarStyle: 'black-translucent'` y `viewport-fit: cover` globales (`src/app/layout.tsx`), un cajero que añada `/comercios` a su pantalla de inicio en iOS ve la marca y el nombre del comercio bajo la barra de estado | Replicar `src/app/miembros/(portal)/portal.module.css:89-92` |
| 2 | SERIO | `src/app/comercios/(portal)/_components/confirmar-venta-form.tsx:172-182` | El campo «Descuento» es `readOnly` pero sigue siendo `type="number"` enfocable: el cajero toca para editar, el teclado numérico se abre sin poder escribir nada, y tapa el total justo cuando necesita verlo | Convertirlo en texto mostrado, con `<input type="hidden">` si el valor debe viajar en el `formData` |
| 3 | MODERADO | `src/app/miembros/login/_components/login-form.tsx:34-44` | `autoFocus` en el número de membresía: en Android Chrome (a diferencia de iOS Safari) dispara el teclado virtual al cargar, sin gesto del usuario, tapando «Iniciar sesión» en pantallas cortas | Decisión del propietario: quitarlo o aceptar el compromiso |
| 4 | MODERADO | `src/app/comercios/(portal)/_components/confirmar-venta-form.tsx:148-159` | `valor_compra` y `valor_descuento` usan `type="number"`: en Android aparece teclado con `+`, `-` y `,` en vez del numérico puro, y los spinners nativos son blanco de toque parásito en un campo que se usa de pie con una mano | `type="text"` con `inputMode="numeric"` y `pattern` |
| 5 | MODERADO | `src/app/comercios/(portal)/portal.module.css:98-107` | `.main` no aplica `max(--space-4, env(safe-area-inset-left/right))`; en horizontal con muesca lateral el formulario de venta puede quedar bajo el bisel. Impacto menor porque el manifest fija `orientation: portrait`, pero eso no cubre el navegador suelto | Añadir los `max()` laterales |
| 6 | MENOR | `carrusel-destacados.module.css` (F5 de `V9-requisitos-dispositivo.md`) | El carrusel no compensa `safe-area-inset-right` en su sangrado. Confirmado **no peligroso**: nunca invade zona insegura | Opcional |
| 7 | MENOR | `src/app/comercios/(portal)/_components/escaner-qr.tsx` | Sin verificar en dispositivo real que el `aspect-ratio: 1` del visor no recorte el QR en cámaras con FOV distinto entre gamas de Android | Prueba física |

## Confirmado correcto (no son hallazgos)

Objetivos táctiles · `dvh` · `safe-area` · `DataList` convirtiendo tablas en tarjetas ·
`scroll-snap` · ausencia de `backdrop-filter` en filas de lista. Todos resueltos y
documentados en el Portal de Miembros (T4/V9). **Es el patrón que falta replicar en
Comercios** (hallazgos 1 y 5).

## Veredicto por portal

- **Miembros** — ergonomía de pulgar, safe areas, teclado y gestos resueltos con un nivel de
  detalle inusual (barra inferior, carrusel, ficha, filtros). Sin bloqueantes.
- **Comercios** — funcionalmente sólido para uso a una mano, pero le falta la misma disciplina
  de safe-area que ya tiene Miembros, y dos campos numéricos tienen fricción de teclado que un
  cajero de pie notará en producción.
- **`admin/miembros/numeros`** — correctamente integrado (overlay `@modal` gemelo presente,
  `DataList` con `hideOnMobile`, sin scroll horizontal). Sin hallazgos nuevos de esa rama.

## Requiere dispositivo real

El zoom de teclado en Android con `autoFocus`; el comportamiento de `readOnly` con
`type="number"` en iOS frente a Android; y el recorte de cámara del escáner QR en gama media
y baja.
