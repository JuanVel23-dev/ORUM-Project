# Log · m3-carnet-pausa

> Una entrada por tarea terminada. Formato: `## <tarea>` + qué se hizo, qué quedó fuera y por qué.


---

## A · El carnet (`/miembros/perfil`) — 13/09/2026

### Hecho

**`perfil/page.tsx`** — reescrita la pantalla según §6.3.
- Fuera `PageHeader`: encabezado propio con `h1` a `--t-display-2` («Mi
  carnet») y lede a `--t-footnote` («Muestra este código en la caja.»), que es
  lo que pide la aritmética de §6.3. `PageHeader` es cromo de ficha de
  administración y era la mitad de por qué el carnet no parecía un carnet.
- Orden nuevo: wordmark ORUM → nombre → plan → **QR** → número → estado +
  vigencia fundidos en un bloque. El QR sube: es lo que se enseña.
- `Card padding="lg" variant="brand" principal`. Es la ÚNICA superficie con
  trazo de 2px de la pantalla.
- QR a `size={160}` con 32px de zona de silencio (4,2 módulos; el relleno por
  defecto de la primitiva daba 1,7 y la norma pide 4).
- «Cómo usarlo»: tres pasos en `<ol>`, texto plano, + salida de soporte por
  WhatsApp. En escritorio ocupa la segunda columna; en móvil y tableta queda
  debajo. Es lo que mata el hueco muerto, no un relleno.
- El teléfono de soporte se lee de `configuracion` en el mismo `Promise.all`
  que el plan. El plan NO se aísla en `<Suspense>` (§6.7).
- `hoyBogota()` local sustituido por `hoyISO()` de `@/lib/shared/fecha`: era
  la misma función copiada, y el commit `1548c1e` ya hizo esa unificación en
  admin.
- Intactos y verificados los tres irreversibles: `QrCode` negro sobre blanco,
  estado vía `derivarEstadoMembresia`, fechas civiles con `Date.UTC` +
  `timeZone: 'UTC'`.

**`perfil/perfil.module.css`** — reescrito.
- Eliminada entera la consulta de contenedor a 620px y el `grid-template-columns:
  1fr auto`. El carnet es UNA columna a todos los anchos y mide 460px fijos.
- `@container contenido (min-width: 900px)` reparte 460 + 32 + 380 = 872 y
  alinea a la izquierda (§6.5).
- `@media print`: se imprime solo el carnet; pierde sombra y queda con 1px de
  `var(--n-1000)`. **Comprobado que no arrastra ningún `#000`**: el único
  literal del sistema sigue viviendo en `qr-code.module.css`. Se añadió el
  mismo tratamiento al wordmark del carnet, que con tema oscuro activo se
  imprimiría en dorado claro sobre folio blanco.

**`perfil/_components/carnet-aparece.tsx`** (nuevo) — envoltorio de cliente de
tres líneas útiles con `animate(el, {…}, SPRING_POP)`.

**`perfil/loading.tsx`** — corregido a la forma nueva.

### El esqueleto NO coincidía con la spec

La pista decía que `loading.tsx` ya dibujaba la forma acordada. **No era así**:
dibujaba la forma ANTERIOR —`.cuerpo` a dos columnas, datos a la izquierda, QR
de 232px a la derecha, y su propio comentario lo declaraba («filo dorado, datos
a la izquierda y QR a la derecha, que bajo 620px pasa a columna centrada»)—.
Lo que ya estaba bien era su *principio*: reutilizar el módulo CSS de la página
para que la silueta no pueda desviarse. §6.7 es explícita («Hay que corregirlo:
no es una tabla y debe replicar la forma nueva —una columna, QR arriba—»), así
que **se corrigió el esqueleto**, no la página. El hueco del QR pasa de 232px
(200 + 2×16) a 224px (160 + 2×32).

### Choques spec ↔ dirección v2, y cómo se resolvieron

1. **Filo dorado de 2px (spec §6.3) vs. «2px solo para tinta» (v2 §2.2).**
   Gana v2 en lo visual: el filo lo pone `variant="brand"` de la primitiva y
   mide 1px; el 2px es el trazo de tinta de `principal`. v2 §2.4 lo dice
   literalmente: sobre papel blanco basta 1px donde antes hacía falta 2.
2. **`variant="brand"` tiñe el borde de oro al 45 %.** A 2px de grosor eso
   gastaría el presupuesto de oro y dejaría la superficie peor definida. Se
   corrige a `--border-strong` desde el módulo de la página, con doble clase
   (0,2,0) porque el orden entre dos módulos CSS en el bundle no está
   garantizado. Mismo mecanismo para `--radius-xl` y para la zona de silencio
   del QR.
3. **«Cómo usarlo» dentro de una caja (sketch de §6.5) vs. el riesgo de la
   cuadrícula de cajas (v2 §6).** Decidido: **sin `Card`**. Con el carnet a
   2px al lado, una segunda tarjeta con trazo lo degradaría a «una caja más».
   La respuesta de v2 ante la duda es quitar, no añadir.
4. **El botón de WhatsApp: §6.5 lo sitúa en la columna de escritorio.** Se
   renderiza a todos los anchos (en móvil, debajo). Ocultarlo con
   `display: none` lo quitaría también del lector de pantalla, y el socio que
   está en la caja con un problema es exactamente quien lo necesita. §6.5 ya
   concede que aquí la segunda puerta es legítima.

### Fuera de alcance (no tocado)

- **`@media print` no puede ocultar la cabecera ni la barra inferior del
  portal**: viven en `portal.module.css`, fuera de mi alcance. §6.6 las quiere
  a `display: none` al imprimir. Falta esa regla; la pide el bloque C.
- `copiar.module.css:57` declara `:hover` **fuera** de `@media (hover: hover)`,
  lo que `CLAUDE.md` prohíbe (en táctil se queda pegado tras el toque). No es
  mío; queda anotado.
- `copiar.module.css:11` fija `letter-spacing: 0.03em` en `.valor`, así que el
  tracking de 0,06em de `.numero` no llega al número. Se ve bien; corregirlo
  exige tocar la primitiva.

---

## B · La pantalla de pausa (`/miembros/inactiva`) — 13/09/2026

> Entrada escrita por el orquestador: el agente completó el bloque y cayó al
> tope de sesión antes de registrarlo. Lo que sigue se verificó leyendo el
> código resultante, no el informe.

### Hecho

- **El giro de tono de §7.2.** «Pausa» es reversible; «no activa» es un
  veredicto. Antes decía «No encontramos una membresía vigente asociada a tu
  cuenta», que es correcto y frío: describe un fallo de búsqueda en una base de
  datos, no una situación del socio.
- **Copy por motivo (§7.4)**, con tres variantes más la genérica. Ninguna culpa
  al socio: no se escribe «no has pagado» ni «tu pago no se procesó».
- **`variant="brand"`** en el botón de WhatsApp. Es el recorrido del cliente y
  la única pantalla del portal con motivo comercial; el oro de acción está
  habilitado con los ratios ya firmados.
- **La tarjeta lleva `principal`**: es la única superficie de la pantalla, así
  que es ella quien lleva el trazo de 2px.
- **El motivo se deriva con `derivarEstadoMembresia`**, nunca leyendo
  `membresias.estado` en crudo. Y si el estado derivado saliera activo —solo
  ocurre si alguien escribe esta URL a mano— **no se inventa un motivo**: cae en
  la variante genérica.
- **«Cerrar sesión», nuevo y necesario.** Quien entró con la cuenta equivocada,
  o ya pagó por otro canal, no tenía forma de salir sin descubrir el menú del
  avatar — y pedirle eso en la pantalla que acaba de darle una mala noticia es
  de mal diseño. Va dentro de un `<form>` para que la server action funcione sin
  JavaScript.
- **Sin teléfono de soporte la pantalla dejaba de ser un callejón**: se añade la
  instrucción de contactar al punto de inscripción, y «Cerrar sesión» sube a
  `primary` para que siga habiendo una acción.

### Lo que la spec pedía y NO se pudo cumplir

§7.4 pedía «se canceló el {fecha}» para la variante cancelada. **No hay de dónde
sacar esa fecha**: `membresias` no guarda cuándo se canceló, y `fecha_fin` es el
fin del periodo pagado, no la cancelación. Usarla ahí sería una afirmación
falsa, así que la frase va sin dato. Anotado como propuesta para backend.

---

## C · Movimiento — 13/09/2026

> Entrada del orquestador, misma razón.

- `carnet-aparece.tsx`: envoltorio de cliente que anima la entrada del carnet
  con `animate(el, {…}, SPRING_POP)` — el preset con rebote es exactamente para
  esto, algo que **aparece**.
- Entrada escalonada de los datos vía `Stack escalonado`.
- `data-motion-esencial` donde corresponde; `prefers-reduced-motion` con
  equivalente no vestibular, no con ausencia de feedback.

### Cerrado por el orquestador, fuera del alcance del agente

- **`@media print` ahora oculta la cabecera y la barra inferior del portal.**
  Lo pedía §6.6 y el agente no podía: esas dos clases viven en
  `portal.module.css`. Sin esta regla, imprimir el carnet sacaba dos franjas de
  tinta que se comen el papel. Se añade además `padding: 0` al `.main`, o la
  hoja sale con el hueco en blanco que el cromo oculto reservaba.
- **`copiar.module.css:57` tenía `:hover` fuera de `@media (hover: hover)`.** En
  táctil el hover no se va al levantar el dedo, así que el botón de copiar se
  quedaba con trazo permanente justo después de usarlo — que es cuando el socio
  mira la pantalla para comprobar que copió.

### Sigue abierto

`copiar.module.css:11` fija `letter-spacing: 0.03em` en `.valor`, así que el
tracking de 0,06em del número del carnet no llega. Se ve bien; corregirlo exige
cambiar la primitiva para todos sus consumidores.
