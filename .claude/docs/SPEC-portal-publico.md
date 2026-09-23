# Spec UX: Portal Público de ORUM
> ux-designer · 13/09/2026 · rama `mejora-diseno`
>
> Base: `CLAUDE.md` (rev. vigente), `.claude/docs/API-CONTRACT.md`,
> `.claude/docs/SPEC-pantallas-miembros.md` (v2), y el código real de
> `src/app/miembros/(portal)/**`, `src/components/ui/**`.
>
> **Esta spec no escribe código ni fija valores de token.** Decide flujo, los
> ocho/cinco estados de cada pieza, jerarquía, comportamiento responsive y copy
> literal. `design-system-architect` pone los números; `motion-ux-polish` las
> curvas; `accessibility-auditor` firma los contrastes nuevos que aquí se
> proponen (el CTA primario del Portal Público, resuelto como tinta — ver §6).

---

## 0. Qué decide esta spec, y qué no

El Portal Público es el **cuarto portal**, hoy inexistente. No hereda layout de
ningún otro: Miembros, Administración y Comercios exigen sesión desde su
primer byte; este no exige nada, y por eso no puede copiar su cromo ni su
arquitectura de overlay sin más — cada decisión que se aparta del patrón
existente está justificada en el sitio donde se toma, no al final.

Dos rutas nuevas, un solo cromo:

```
src/app/(publico)/layout.tsx        ← cabecera + <main> + pie públicos
src/app/(publico)/page.tsx          ← la landing, en "/"
src/app/(publico)/aliados/page.tsx  ← formulario de comercio aliado, en "/aliados"
```

El grupo de rutas `(publico)` no añade segmento a la URL: `/` y `/aliados`
quedan tal cual. Comparten un único layout porque son la misma fachada — si
`/aliados` tuviera su propio cromo, un visitante que llega por enlace directo
(compartido por WhatsApp) no reconocería que sigue en ORUM.

`src/app/page.tsx` (hoy `redirect('/miembros')`) se sustituye por la landing
real. `src/app/manifest.ts` **no cambia**: `start_url` sigue en `/miembros`,
porque quien instala la PWA ya es socio y el acceso directo debe abrir su
catálogo, no la fachada de captación.

---

## 1. El recorrido completo

```
Dominio raíz "/" ──────────────────────────────────────────────────────────┐
                                                                             │
  ¿hay sesión de miembro vigente?                                          │
    sí ──▶ redirect('/miembros')  (mismo patrón que /miembros/login)       │
    no ──▶ LANDING PÚBLICA                                                 │
             │                                                              │
             ├─ Héroe: propuesta de valor + CTA "Quiero ser socio"          │
             │     └─▶ WhatsApp (número de `configuracion.whatsapp_soporte`)│
             ├─ Cómo funciona (3 pasos)                                     │
             ├─ Vitrina de comercios aliados (carrusel, sin navegar)        │
             ├─ Cifras del club (condicional a que existan)                 │
             ├─ CTA final "Hazte socio hoy" (repite el de WhatsApp)         │
             ├─ CTA secundario "¿Tienes un negocio? Alíate con ORUM"        │
             │     └─▶ /aliados, interceptado por Overlay si hay JS         │
             │            │                                                 │
             │            ├─ vacío → enviando → éxito                      │
             │            └─ error de validación / error de envío           │
             └─ Pie: WhatsApp de soporte + tres puertas (socio · comercio ·  │
                     administración)                                        │
                                                                             │
Sin sesión, "Iniciar sesión" en la cabecera ──▶ /miembros/login             │
Enlace directo a "/aliados" (compartido, sin JS, o motor de búsqueda) ──────┘
      ──▶ página completa con el mismo formulario, mismo cromo
```

**Mínimo clic**: visitante → WhatsApp de alta, **un toque** desde el héroe y
otro desde el CTA final (el mismo botón, dos posiciones). Comercio interesado
→ formulario enviado, **cero navegaciones** con JS (overlay sobre la landing),
**una** sin JS (página `/aliados`).

---

## 2. Landing pública (`/`)

### 2.1 Objetivo del usuario

Alguien que **no sabe qué es ORUM** decide, en menos de un scroll de móvil,
si esto le sirve — y si le sirve, escribe por WhatsApp sin tener que buscar el
número en ningún otro sitio.

### 2.2 Orden de las secciones, y por qué ese orden

| # | Sección | Por qué va ahí |
|---|---|---|
| 1 | **Cabecera** | Ancla de marca y salida a "Iniciar sesión": quien ya es socio no debe leer una landing entera para encontrar su acceso. |
| 2 | **Héroe** | Propuesta de valor + CTA primario. Todo lo demás en la página existe para reforzar esta decisión, no para sustituirla: alguien que ya está convencido no debería tener que desplazarse. |
| 3 | **Cómo funciona (3 pasos)** | Resuelve la duda inmediata tras el héroe: "¿esto cómo se usa?". Va antes de la vitrina porque enseñar comercios sin explicar el mecanismo ("¿tengo que pagar en cada sitio?", "¿necesito una app?") genera más dudas que deseo. |
| 4 | **Vitrina de aliados** | Aquí se construye el deseo, con nombres y beneficios concretos — pero solo después de que el visitante entienda que necesita ser socio para usarlos. Enseñarla antes convertiría "quiero eso" en "¿y cómo lo consigo?", una pregunta que la sección 3 ya contestó. |
| 5 | **Cifras del club** | Prueba social. Va después de la vitrina porque una cifra sin ejemplos concretos delante no dice nada ("47 comercios" es abstracto; "47 comercios como Casa Duarte" es concreto). **Condicional**: si no hay cifras fiables, la sección no se renderiza — no se inventan números redondos. |
| 6 | **CTA final "Hazte socio hoy"** | Repite la acción del héroe. En una página que ya se desplazó varias pantallas, el CTA del héroe quedó arriba y fuera de vista: repetirlo al final es la razón de ser de esta sección y no redundancia. |
| 7 | **CTA secundario — comercios aliados** | Deliberadamente al final y visualmente subordinado: la audiencia de esta página es abrumadoramente gente que quiere **ser socia**, no negocios que quieren **aliarse**. Ponerlo antes competiría por la misma atención que el CTA que sí convierte a la mayoría. |
| 8 | **Pie** | Las tres puertas del sistema (socio, comercio, administración) y el WhatsApp de soporte. Es el único sitio del producto donde conviven las tres, porque es el único público: el resto de portales asumen que ya sabes cuál es el tuyo. |

### 2.3 Layout — escritorio (≥ 900px de `contenido`)

No es una landing de columna centrada estrecha por defecto: cada sección
aprovecha el ancho con la composición que le corresponde, y se justifica caso
por caso.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ORUM        Cómo funciona   Comercios aliados      [Iniciar sesión]  │ cabecera
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   Tu carnet para vivir la ciudad          ┌──────────────────────┐   │
│   distinto.                               │                      │   │
│                                            │   collage / cubierta │   │ héroe:
│   Un solo club, decenas de aliados         │   de 2-3 comercios   │   │ texto+CTA
│   en gastronomía, salud y belleza.         │   destacados         │   │ a la
│   Muestra tu carnet y listo.               │                      │   │ izquierda,
│                                            └──────────────────────┘   │ imagen a
│   [ Quiero ser socio ]  Ver comercios ↓                               │ la derecha
│                                                                        │
├──────────────────────────────────────────────────────────────────────┤
│                       Así funciona ORUM                               │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │ 3 columnas:
│   │ ① Hazte      │    │ ② Muestra   │    │ ③ Disfruta  │              │ el paso es
│   │   socio      │    │   tu carnet │    │   el        │              │ secuencial,
│   │              │    │              │    │   beneficio │              │ la columna
│   └─────────────┘    └─────────────┘    └─────────────┘              │ lo hace
│                                                                        │ evidente
├──────────────────────────────────────────────────────────────────────┤
│  Conoce a tus futuros aliados                    ← desliza →         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │ carrusel:
│  │Casa    │ │Estudio │ │Clínica │ │Taller  │ │  y     │             │ misma
│  │Duarte  │ │Vera    │ │Sonrisa │ │Andino  │ │ más…   │             │ geometría
│  │-20%    │ │2x1     │ │15% off │ │regalo  │ │(WhatsApp)│           │ que
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘             │ CarruselDestacados
├──────────────────────────────────────────────────────────────────────┤
│        47                    12                                       │
│   comercios aliados      ciudades                                     │ 2 cifras,
│                                                                        │ centradas,
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│           ¿Listo para empezar a ahorrar?                              │
│              [ Quiero ser socio, escribir por WhatsApp ]              │ CTA final,
│                                                                        │ ancho de
├──────────────────────────────────────────────────────────────────────┤ contenido
│   ¿Tienes un negocio?  Alíate con ORUM y llega a cientos de socios.   │
│                                              [ Postular mi negocio ]  │ CTA
├──────────────────────────────────────────────────────────────────────┤ secundario
│  ORUM          Soy socio → login   Tengo un comercio → login          │
│                Administro ORUM → login       Soporte: WhatsApp        │ pie
│  © 2026 ORUM                                                          │
└──────────────────────────────────────────────────────────────────────┘
```

**Por qué el héroe es dos columnas y no una franja centrada.** Hay contenido
real para poner al lado del texto —a diferencia del acceso, donde T2 justifica
la columna estrecha precisamente porque "no hay nada que poner al lado"—: aquí
sí lo hay, la propia vitrina de comercios adelantada como collage. Y la tarea
no es un formulario de dos campos, es persuasión, que se beneficia de más
superficie.

**Por qué "Cómo funciona" es tres columnas y no una lista vertical en
escritorio.** Tres pasos con el mismo peso se leen como secuencia horizontal
del mismo modo que se leería un cómic de tres viñetas; en columna vertical
larga en una pantalla ancha, el ojo pierde la relación entre los tres.

### 2.4 Layout — tablet (560–899px de `contenido`)

Hereda la **estructura de escritorio con menos columnas**, no la de móvil:

- Héroe: las dos columnas se apilan (texto arriba, imagen abajo) porque a 700px
  cada columna del héroe quedaría en ~340px, insuficiente para un titular de
  tres líneas sin partirlo mal.
- "Cómo funciona": pasa de 3 a **2 columnas** (`Grid min="220px"`, la tercera
  tarjeta baja de línea) — se prefiere sobre 3 columnas estrechas porque el
  paso ③ quedaría con menos aire que ① y ②, rompiendo la sensación de secuencia
  igualada.
- Vitrina: el carrusel muestra **dos tarjetas y una asomando** (mismo patrón
  que T4 en el catálogo de miembros, `--carril-tarjeta-w: min(46cqi, 340px)`).
- Cifras: se mantienen en fila si son dos; con tres o más, pasan a `Grid
  min="140px"`.

### 2.5 Layout — móvil (< 560px de `contenido`, lienzo canónico 375×667)

Una columna, en el orden ya fijado en §2.2, sin reordenar nada extra:

```
┌────────────────────────────┐
│ ORUM                  ☰   │ cabecera: wordmark + menú (§4)
├────────────────────────────┤
│  Tu carnet para vivir       │
│  la ciudad distinto.        │ h1, --t-display-1
│                              │
│  Un solo club, decenas de   │ lede
│  aliados. Muestra tu        │
│  carnet y listo.            │
│                              │
│ ┌──────────────────────┐    │ imagen/collage,
│ │  collage 2 comercios  │    │ 4:3, debajo del
│ └──────────────────────┘    │ texto — nunca
│                              │ detrás (ilegible
│ [ Quiero ser socio ]        │ bajo texto)
│ Ver comercios aliados ↓     │
├────────────────────────────┤
│  Así funciona ORUM          │ h2
│  ① Hazte socio               │
│  ② Muestra tu carnet         │ 1 columna,
│  ③ Disfruta el beneficio     │ apilados
├────────────────────────────┤
│  Conoce a tus futuros       │ h2
│  aliados                    │
│  ◀ desliza ▶                │ carrusel 1
│  ┌────────────────┐         │ tarjeta + asomo,
│  │ Casa Duarte     │··      │ igual que el
│  │ -20%            │        │ carrusel de
│  └────────────────┘         │ miembros
├────────────────────────────┤
│    47              12       │ 2 cifras en fila
│ comercios      ciudades     │ (caben a 375px)
├────────────────────────────┤
│  ¿Listo para empezar?       │
│  [ Quiero ser socio ]       │ CTA final,
│                              │ ancho completo
├────────────────────────────┤
│  ¿Tienes un negocio?        │
│  Alíate con ORUM.           │ CTA secundario,
│  [ Postular mi negocio ]    │ variant="secondary"
├────────────────────────────┤
│  Soy socio                  │
│  Tengo un comercio          │ pie: lista de
│  Administro ORUM            │ enlaces, no fila
│  Soporte por WhatsApp       │
│  © 2026 ORUM                 │
└────────────────────────────┘
```

**Punto de ruptura y por qué ahí**: la landing usa el mismo contenedor
`contenido` que el resto del producto (`container-type: inline-size` en el
`<main>` del layout nuevo, §7). Se reutilizan los **mismos umbrales que ya
audita T2** para el catálogo de miembros (560 / 900), porque son los mismos
componentes de base (`Grid`, `Carril`) los que se adaptan: inventar un tercer
juego de puntos de ruptura para la misma pieza visual sería la clase de
divergencia que `CLAUDE.md` prohíbe con `@container` frente a `@media`.

### 2.6 Jerarquía de encabezados

| Elemento | Nivel |
|---|---|
| Titular del héroe | `h1` — el único de la página |
| "Así funciona ORUM" | `h2` |
| "Conoce a tus futuros aliados" | `h2` |
| Nombre de cada comercio en la vitrina | `h3` (igual que en el catálogo real: el visitante que se haga socio reconoce la misma jerarquía) |
| "¿Listo para empezar a ahorrar?" | `h2` |
| "¿Tienes un negocio?" | `h2` |

Un `h1` por pantalla. Los tres pasos de "Cómo funciona" **no** son
encabezados: son una lista ordenada (`<ol>`) con el número como parte del
diseño visual y el texto del paso en `<strong>` seguido de una frase — un paso
de un proceso no es una sección con contenido propio, es una entrada de lista.

### 2.7 Acción primaria, secundaria y terciaria

Una sola acción primaria por pantalla, repetida dos veces (héroe y CTA final)
porque es **la misma decisión**, no dos decisiones distintas:

- **Primaria**: "Quiero ser socio" → WhatsApp. `Button variant="primary"`
  (tinta — ver §6, el Portal Público no está en la lista de pantallas
  habilitadas para el relleno dorado).
- **Secundaria**: "Ver comercios aliados" (ancla a la vitrina, dentro del
  héroe) y "Postular mi negocio" (abre `/aliados`). `variant="secondary"`.
- **Terciaria**: "Iniciar sesión" en la cabecera y los enlaces del pie.
  `variant="ghost"` o enlace de texto simple.

---

## 3. Formulario de comercio aliado

### 3.1 Dónde vive — la decisión y su porqué

**El formulario vive en una página real, `/aliados`, presentada dentro de un
`<Overlay>` (diálogo en escritorio, hoja en móvil) que se abre SIN navegar
cuando hay JavaScript, y cae a la página completa cuando no lo hay, cuando se
comparte el enlace directo, o cuando un buscador lo indexa.**

Dos frases de por qué, tal como se pidió:

1. La regla "formulario = overlay, no página" existe para no perder el
   contexto de una **lista de trabajo** (la ranura `@modal` cuelga de
   `app/admin/layout.tsx` exactamente por eso), y aquí no hay ninguna lista
   detrás que perder: es una landing de una sola pantalla de scroll, así que el
   overlay se implementa con estado local de cliente (`useState` en un
   componente pequeño), sin inventar una ranura de rutas interceptadas nueva
   para un único formulario público — el mismo razonamiento que ya evitó un
   overlay para "Más filtros" en el catálogo de miembros.
2. La página real en `/aliados` no es una alternativa al overlay sino su
   **respaldo obligatorio**: sin ella, un enlace de `/aliados` compartido por
   WhatsApp, un resultado de buscador, o un visitante sin JavaScript no
   tendrían manera de llegar al formulario, porque el disparador del overlay
   exige JavaScript para interceptar el clic.

**Mecánica exacta**: el botón "Postular mi negocio" es, en el marcado, un
`<Link href="/aliados">` real (funciona sin JS, es indexable, tiene URL
propia). Un componente cliente pequeño en la landing escucha el clic, hace
`preventDefault()`, y abre el `<Overlay>` con el mismo componente de
formulario **importado del propio `/aliados/page.tsx`**, para que no existan
dos formularios que puedan desincronizarse. Si el visitante llega ya en
`/aliados` (enlace directo), esa página se renderiza a pantalla completa con
el layout público de siempre (cabecera + pie), sin overlay: no hay landing
detrás que tapar.

**Cierre del overlay**: vuelve a la landing exactamente donde estaba —el botón
que lo abrió no navegó, así que no hay nada que restaurar—. En la página
completa, cerrar significa el botón «‹ Volver al inicio», visible siempre
sobre el formulario.

### 3.2 Objetivo del usuario

Un dueño o encargado de negocio, convencido por la sección de comercios
aliados o que llegó por recomendación, deja sus datos para que ORUM lo
contacte — sin crear cuenta, sin adjuntar documentos, en menos de un minuto.

### 3.3 Campos

| Campo | Tipo de control | Obligatorio | Validación |
|---|---|---|---|
| Nombre del comercio | `Input type="text"` | Sí | No vacío tras recortar espacios |
| Nombre de contacto | `Input type="text"` | Sí | No vacío |
| Cargo | `Input type="text"` | No | — |
| Teléfono | `Input type="tel" inputMode="tel"` | Sí | 7–10 dígitos tras quitar espacios/guiones (mismo criterio que valida WhatsApp) |
| Correo | `Input type="email"` | Sí | Formato de correo válido (`type="email"` + comprobación al salir del campo) |
| Ciudad | `Select`, opciones fijas (Bogotá, Medellín, Cali, Barranquilla, Otra) | Sí | Selección no vacía |
| Dirección | `Input type="text"` | No | — |
| Categoría | `Select`, opciones fijas (Gastronomía, Salud y bienestar, Belleza, Moda, Entretenimiento, Servicios profesionales, Otra) | Sí | Selección no vacía |
| Descripción breve | `Textarea`, máx. 280 caracteres con contador | Sí | No vacía, ≤280 caracteres |
| Enlace a redes o sitio web | `Input type="url"` | No | Si se llena, formato de URL válido |

**Por qué Ciudad y Categoría son listas fijas y no se leen de `ciudades` /
`categorias`.** Esas tablas hoy solo se consultan detrás de sesión
(`requireMiembroVigente`, `requireRolComercio`, admin). Leerlas sin sesión
exige una política de lectura anónima que no existe (§8, B1) — y el dato aquí
no necesita coincidir con un `id` de esas tablas: es un comercio que **todavía
no existe** en el sistema, así que el texto que declara es informativo para
quien lo revise por correo, no una referencia. Una lista fija, corta y
conocida evita depender de esa política de lectura y no bloquea esta pieza en
un cambio de backend.

**Por qué no hay casilla de tratamiento de datos.** Sería lo correcto en
Colombia (Ley 1581 de habeas data), pero exigiría enlazar una política de
tratamiento de datos que el producto no tiene todavía. Queda anotado como
pendiente **legal**, no de UX, en §9 — no se inventa un enlace a una página
que no existe.

### 3.4 Layout

**Escritorio**: dentro del `Modal` (ancho ~560px), dos columnas para los
campos cortos (Nombre del comercio / Nombre de contacto, Cargo / Teléfono,
Correo / Ciudad) y una columna para los largos (Dirección, Categoría,
Descripción, Enlace). El botón de envío ocupa el ancho del diálogo.

**Móvil**: una sola columna, todos los campos apilados, dentro de la `Sheet`
con `detent="large"` (el formulario no cabe cómodo en `medium` sin desplazar
de inmediato, y aquí sí conviene la pantalla completa porque es la única
tarea del momento).

### 3.5 Los cinco estados

**Vacío** — Cuándo: al abrir el formulario, ningún campo tocado.
Qué se muestra: los diez campos con placeholder, sin ningún error, botón
"Enviar postulación" habilitado (no deshabilitado a la espera de validez: eso
oculta al usuario qué falta). Copy del título: "Alía tu negocio con ORUM".
Apoyo: "Cuéntanos de tu negocio y te contactamos para evaluar la alianza."
Acciones: enviar, cerrar (✕ o «‹ Volver al inicio»).

**Enviando** — Cuándo: tras pulsar "Enviar postulación", antes de la
respuesta del servidor. Qué se muestra: el botón entra en `loading` (spinner,
`aria-busy`, deshabilitado por construcción vía `Button`); los campos se
deshabilitan visualmente pero **conservan su valor** (no se limpia nada
todavía); no hay pantalla intermedia adicional. Copy del botón: "Enviando…".
Previene doble envío por construcción (`disabled={loading}` en `Button`), no
requiere lógica extra.

**Éxito** — Cuándo: la Server Action confirma el envío del correo. Qué se
muestra: el formulario se sustituye por una confirmación dentro de la misma
superficie (mismo `Modal`/`Sheet`, no una navegación nueva), con un icono de
confirmación, sin campos. Copy: título "Recibimos tu postulación" — cuerpo
"Nuestro equipo revisará la información de **{nombre del comercio}** y te
escribirá a **{correo}** o **{teléfono}** en los próximos días." Acción única:
"Volver al inicio" (cierra el overlay o, en `/aliados`, navega a `/`).

**Error de envío** — Cuándo: la Server Action falla (MailerSend no responde,
error de red). Recuperable: el formulario **conserva todo lo tecleado** y
muestra `Alert tone="danger"` sobre los campos. Copy: "No pudimos enviar tu
postulación. Revisa tu conexión y vuelve a intentar." Acción: el mismo botón
"Enviar postulación" reintenta con los mismos datos, sin retipear nada.

**Error de validación** — Cuándo: al enviar con campos obligatorios vacíos o
con formato inválido (correo, teléfono, URL, descripción > 280). El error va
**al campo** (`Field error=`), no a un banner global — es una decisión de
cliente y aquí sí se conoce el campo exacto, a diferencia de los formularios
de `/admin` que dependen de un backend que no lo informa (P4 en
`API-CONTRACT.md`). Validación **al salir del campo** (`onBlur`) para correo,
teléfono y URL —formatos que solo tienen sentido evaluar con la entrada
completa—, y **al enviar** para los campos vacíos —marcar "obligatorio"
mientras el usuario todavía escribe su primera letra sería regañarlo por
adelantado—. El envío se bloquea y el foco salta al primer campo con error.

### 3.6 Copy de los campos

| Campo | Etiqueta | Placeholder | Error |
|---|---|---|---|
| Nombre del comercio | Nombre del comercio | Ej. Casa Duarte | Escribe el nombre de tu negocio. |
| Nombre de contacto | Tu nombre | Ej. María Duarte | Escribe tu nombre. |
| Cargo | Cargo (opcional) | Ej. Propietaria | — |
| Teléfono | Teléfono o WhatsApp | Ej. 3001234567 | Escribe un teléfono válido, de 7 a 10 dígitos. |
| Correo | Correo electrónico | Ej. contacto@tunegocio.com | Escribe un correo electrónico válido. |
| Ciudad | Ciudad | Selecciona tu ciudad | Selecciona una ciudad. |
| Dirección | Dirección (opcional) | Ej. Cra 15 #93-47 | — |
| Categoría | Categoría del negocio | Selecciona una categoría | Selecciona una categoría. |
| Descripción breve | ¿Qué ofrece tu negocio? | Cuéntanos en pocas palabras qué vende o qué servicio presta. | Cuéntanos brevemente qué ofrece tu negocio. |
| Enlace a redes o web | Instagram o sitio web (opcional) | Ej. instagram.com/tunegocio | Escribe un enlace válido. |

Botón de envío: **"Enviar postulación"** → en vuelo, **"Enviando…"**.
Botón de cierre: **"Volver al inicio"** (página completa) / icono ✕ con
`aria-label="Cerrar"` (overlay).

---

## 4. Cabecera y pie públicos

### 4.1 Cabecera

Distinta a propósito de la del Portal de Miembros: esa cabecera sirve a
alguien que **ya entró** (wordmark + navegación de dos pestañas + avatar);
esta sirve a alguien que **todavía no ha decidido entrar**.

**Escritorio**: wordmark a la izquierda (enlaza a `/`, no a ningún catálogo);
al centro-derecha, dos anclas de texto ("Cómo funciona", "Comercios
aliados") que desplazan suavemente a su sección; a la derecha, **"Iniciar
sesión"** en `variant="ghost"` → `/miembros/login`. No lleva avatar ni menú:
nadie tiene sesión activa en esta pantalla (si la tuviera, `/` ya redirigió).

**Móvil**: wordmark + un botón de menú (☰, `aria-label="Abrir menú"`) que abre
una `Sheet` pequeña (`detent="medium"`) con las mismas cuatro entradas: Cómo
funciona, Comercios aliados, Iniciar sesión, y — a diferencia de la cabecera
de escritorio — también "¿Tienes un negocio? Alíate" para que esa acción no
dependa de desplazar hasta el final en un menú que ya está abierto encima de
todo. **No hay avatar**: es el mismo motivo por el que no lo hay en
escritorio, no una limitación de espacio.

La cabecera es pegajosa (`position: sticky`) como la del portal de miembros,
por consistencia de producto, pero **no** reserva `env(safe-area-inset-top)`
con la urgencia de N3 en la spec de miembros: esta pantalla no se instala como
PWA (`start_url` sigue en `/miembros`), así que nunca se ve bajo
`black-translucent`. Se reserva igualmente por higiene en cualquier navegador
con muescas, pero no es un hallazgo bloqueante.

### 4.2 Pie

Único lugar del producto donde conviven las tres puertas. Estructura, de
arriba abajo: wordmark pequeño; una lista de enlaces —**"Soy socio"** →
`/miembros/login`, **"Tengo un comercio"** → `/comercios/login`,
**"Administro ORUM"** → `/login`—; el enlace de **"Soporte por WhatsApp"**
(mismo número de `configuracion.whatsapp_soporte` que el resto del portal);
y el aviso de derechos, `© {año actual} ORUM`.

**Por qué son enlaces de texto y no botones**: son tres salidas de igual peso
para tres audiencias distintas que ya saben lo que buscan — competir por
atención con `Button` sería tratarlas como conversión, y son navegación.

**Relación con `PantallaAuth`**: el pie **no** intenta imitarla ni
reemplazarla. Las tres pantallas de acceso siguen siendo su propio umbral
oscuro con halo dorado, y el pie del Portal Público solo les señala el camino
— es la puerta de entrada al edificio, no el vestíbulo. El único acoplamiento
real es que **el copy de los tres enlaces coincide** con el `titular` de cada
`PantallaAuth` ("Portal de Miembros", "Herramienta de comercios",
"Administración"), para que el visitante reconozca el destino antes de hacer
clic.

---

## 5. Estados de la landing

### 5.1 No hay comercios activos (o la vitrina llega vacía)

**Cuándo**: la consulta de comercios activos devuelve cero filas — sea porque
de verdad no hay ninguno, sea porque la política de lectura anónima aún no
está habilitada (§8, B1: hoy esa consulta corre detrás de sesión en todos sus
consumidores existentes, y sin política nueva devolvería cero filas en
silencio, el mismo patrón ya documentado en `API-CONTRACT.md` §3).

**Qué se muestra**: la sección "Conoce a tus futuros aliados" **no se
renderiza** — ni encabezado, ni carrusel vacío, ni una tarjeta de relleno. La
sección de cifras tampoco, porque depende de los mismos datos. La landing
sigue siendo completa y honesta con lo que sí puede mostrar: héroe, cómo
funciona, CTA de alta, CTA de alianza y pie. **No se pinta ningún mensaje de
"aún no hay comercios" en una landing pública** — a diferencia del catálogo de
miembros, aquí ese texto no tiene a quién dirigirse todavía y restaría
confianza justo en la primera impresión de alguien que no conoce la marca.

**Distinción importante**: si la causa real es la política de lectura
ausente (no la ausencia real de comercios), este estado se ve idéntico al
vacío legítimo y **miente por omisión** — ORUM sí tiene aliados, el
visitante nunca lo sabe. Por eso B1 (§8) no es una mejora, es un bloqueante:
la vitrina y las cifras no deben lanzarse a producción sin resolver la
lectura anónima primero.

### 5.2 Falta `configuracion.whatsapp_soporte`

**Cuándo**: la fila no existe o `valor` es nulo/vacío.

**Qué se muestra**: el CTA primario **no puede quedar roto ni desactivado**
—es la conversión de toda la página—. Cae a un `mailto:` no es una opción real
(no hay bandeja de correo comercial definida) y a un formulario propio
tampoco (duplicaría `/aliados` con otro propósito). La resolución de producto
es que **esta fila de configuración se trata como dato obligatorio del
lanzamiento**, no como un dato que pueda faltar en producción — igual que
`.claude/docs/SPEC-pantallas-miembros.md` ya asume su presencia para el menú
del portal. En desarrollo o si por error llegara a faltar, el botón
**degrada a enlace `tel:` no configurado is peor que nada**; la decisión es
que el build falla de forma visible en desarrollo (un `console.error` marcado
y un halo de aviso solo bajo `NODE_ENV !== 'production'`), y en producción el
CTA oculta su ícono de WhatsApp y apunta al pie, donde vive el único enlace de
respaldo: **"Escríbenos"** → mismo destino que tenga configurado el correo del
formulario de aliados. Esto se documenta como caso límite operativo (§9), no
como una pantalla de error de cara al usuario.

### 5.3 Un socio con sesión vigente llega a `/`

**Cuándo**: `getPerfilActual()` devuelve `rolCodigo === 'miembro'` y la
membresía deriva vigente.

**Qué se muestra**: nada de esta landing — `redirect('/miembros')` antes de
pintar nada, exactamente el mismo patrón que ya usa `LoginMiembroPage`. No es
una nueva pantalla de "ya tienes sesión, ¿quieres ir a tu portal?": esa
pantalla intermedia sería un clic más para alguien cuyo destino ya se conoce
con certeza.

**Deliberadamente no se redirige** a quien tiene sesión de `empleado`,
`super_admin` o `comercio`: esos roles no tienen relación con esta landing (no
son "socios" del club de beneficios) y ver la fachada pública no les estorba;
si llegaron aquí a propósito, la cabecera y el pie ya les ofrecen su acceso.

**Un socio con sesión pero membresía vencida** (`miembro` inactivo) **tampoco
se excluye del redirect**: se le manda igual a `/miembros`, que resuelve por
su cuenta hacia `/miembros/inactiva`. Repetir esa lógica aquí duplicaría una
regla que ya vive en un solo sitio.

---

## 6. El oro en esta landing

**El Portal Público no está en la lista de pantallas habilitadas para el
relleno dorado de acción.** `CLAUDE.md` habilita el relleno `--action-gold`
en "el Portal de Miembros y las seis pantallas de acceso" — la landing y
`/aliados` no son ninguna de las dos cosas. Por tanto:

- **El CTA primario ("Quiero ser socio") es `Button variant="primary"`
  (tinta)**, exactamente como en Administración y en la Herramienta de
  Comercios. No es una pérdida: es la misma regla aplicada con consistencia a
  un portal nuevo que nadie había clasificado todavía.
- **Nota para quien implemente**: `src/components/ui/badge.tsx` conserva un
  comentario que dice *"el oro se repliega a… y el CTA comercial del Portal
  Público"* — es exactamente la frase que `CLAUDE.md` retiró explícitamente
  ("ese portal y ese CTA nunca se construyeron. Se retira la referencia").
  Al construir esta landing, ese comentario debe actualizarse o borrarse: hoy
  describe una excepción que ya no existe, y dejarlo invita a que alguien la
  reintroduzca sin volver a leer la norma vigente.

**Dónde SÍ vive el oro aquí**, todo no-accionable:

- **Wordmark** de la cabecera (texto, marca, no botón).
- **Anillo de `:focus-visible`** en todo interactivo — igual que en el resto
  del producto.
- **Hairline** opcional bajo el héroe o entre secciones, como recurso de
  separación de marca (decisión de `design-system-architect`, no de esta
  spec).
- **`Badge tone="gold"` en la píldora de beneficio** de cada tarjeta de la
  vitrina ("−20 %", "2×1") — oro **difuso**, ya precedentado en
  `ComercioCard`/`CarruselDestacados` del portal de miembros: la cifra va
  dentro de la píldora, así que el color nunca es el único portador del
  significado.

**Dónde NO va**: ningún botón con texto encima, ninguna tarjeta ni fondo de
sección, ninguna de las dos cifras (son números de negocio, no marca — usan
`Cifra`, que ya tipografía el valor en la escala tabular sin color propio), y
el icono/numeral de los tres pasos de "Cómo funciona" (son secuencia, no
marca: colorearlos de oro codificaría "importancia" por color, que
`CLAUDE.md` prohíbe cuando el color es el único portador).

**Presupuesto**: con el CTA en tinta, el único oro sólido candidato
desaparece de esta pantalla. Lo que queda es oro difuso (wordmark de texto,
badges de beneficio, anillo de foco) — muy por debajo del 5 % incluso sumado.
No hace falta medir sobre captura para esta landing porque, a diferencia del
carnet o del acceso, **no hay ninguna pieza de relleno sólido en juego**: el
presupuesto se cumple por diseño, no por ajuste posterior.

---

## 7. Adaptación: `@container`, y el layout nuevo que hace falta

`src/app/(publico)/layout.tsx` declara, en su `<main>`, el mismo contrato que
ya usa el portal de miembros:

```css
.main {
  container-type: inline-size;
  container-name: contenido;
}
```

Todas las secciones de la landing (héroe, pasos, vitrina, cifras, CTAs)
consultan **ese** contenedor, nunca `@media`, por la misma razón ya fijada en
`CLAUDE.md`: el ancho útil de `contenido` no es el del viewport. En esta
landing la diferencia es más simple que en `/miembros` porque **no hay barra
lateral** — pero da igual: escribir un `@media` "porque total aquí coinciden"
es exactamente el atajo que la norma prohíbe, porque dejaría de coincidir en
cuanto alguien reutilizara la sección en otro sitio con cromo distinto.

La vitrina reutiliza literalmente el patrón de `--carril-tarjeta-w` de
`carrusel-destacados.module.css` (§2.3 y §2.4 arriba), con los mismos tres
anchos de contenedor (móvil / 481px / 901px) — no se inventa una cuarta
escala para la misma pieza visual.

---

## 8. Inventario de componentes

### 8.1 Reutilizados tal cual

`Button` (variants `primary`, `secondary`, `ghost`) · `WhatsAppButton` ·
`Card` (`interactive` para las tarjetas de la vitrina) · `Badge` (`tone="gold"`
en la píldora de beneficio) · `Carril` / `CarrilPista` (geometría del
carrusel) · `ComercioLogo` (variante `tarjeta`) · `Field` · `Input` ·
`Select` · `Textarea` · `Alert` · `Cifra` · `Overlay` (`Modal` en escritorio,
`Sheet` en móvil) · `Grid` · `Stack` · `Section` · `Divider`.

### 8.2 Nuevos, y por qué ninguno existente sirve

| Componente | Vive en | Por qué es nuevo |
|---|---|---|
| `EncabezadoPublico` | `src/app/(publico)/_components/` | La cabecera del portal de miembros (`layout.tsx` de `(portal)`) está acoplada a `requireRolMiembro()`, al avatar de sesión y al menú de cuenta. No hay sesión que envolver aquí: es una pieza distinta, no una variante. |
| `PiePublico` | `src/app/(publico)/_components/` | Ningún otro portal tiene pie: el shell de administración y el del portal de miembros terminan en la barra de navegación, no en un pie de enlaces. Es la única pantalla del producto que necesita uno. |
| `HeroPublico` | `src/app/(publico)/_components/` | `PageHeader` (de `layout.tsx` genérico) está pensado para una página de trabajo dentro de una app —título + descripción + una acción—, no para un bloque de marketing con dos columnas, dos CTAs jerarquizados y una imagen. Forzarlo produciría un `PageHeader` con props que no le corresponden. |
| `ComoFunciona` | `src/app/(publico)/_components/` | Sin componente base propio: se compone con `Grid` + tarjetas simples (no `Card`, porque no llevan superficie propia — son texto sobre el fondo de la sección, y `CLAUDE.md` prohíbe que un componente reutilizable imponga su propia tarjeta). Es composición, no una pieza de sistema nueva. |
| `VitrinaPublica` | `src/app/(publico)/_components/` | Visualmente hermana de `CarruselDestacados`, pero **no interactiva** (las tarjetas no enlazan a `/miembros/comercios/[id]`, porque un visitante anónimo no puede entrar ahí: caería en un `requireRolMiembro()` que lo manda al login, un clic muerto). Además consume un tipo de datos más delgado, `ComercioVitrina` (`id`, `nombre`, `categoriaNombre`, `ciudades`, `logoUrl`, `beneficioDestacado`), sin depender de `ComercioListado` del catálogo de miembros — importar un tipo de esa ruta desde una ruta pública invertiría la dependencia, el mismo motivo por el que `CarruselDestacados` vive en `_components/` de su propia ruta y no en `ui/`. |
| `FormularioAliado` | `src/app/(publico)/aliados/_components/` | Formulario nuevo, campos nuevos, Server Action nueva. Se comparte entre `/aliados/page.tsx` (página completa) y el `Overlay` de la landing importándolo desde el alias `@/app/(publico)/aliados/_components/formulario-aliado` — un único componente, dos superficies. |
| `AliadosOverlayTrigger` | `src/app/(publico)/_components/` | Client Component pequeño: intercepta el clic del `<Link href="/aliados">`, abre `Overlay` con `useState`, y renderiza dentro `<FormularioAliado>`. Es la única pieza de la landing que necesita `'use client'`; todo lo demás —héroe, pasos, vitrina, pie— es Server Component puro. |

### 8.3 Server Action nueva

```ts
enviarSolicitudAliado(prevState: SolicitudAliadoState, fd: FormData)
  => Promise<SolicitudAliadoState>
// SolicitudAliadoState = { error?: string; ok?: boolean }
```

Sin tabla ni bandeja (decisión ya tomada por el propietario): construye el
correo con una función nueva en `src/lib/correo/` —hermana de
`construirCorreoInvitacion`, mismo patrón— y lo envía al correo del
administrador vía `enviarCorreoInvitacion`... **no**, vía una función propia
`enviarCorreoSolicitudAliado`, porque el remitente y el destinatario se
invierten (aquí el destinatario es interno, no un socio nuevo). El
destinatario sale de una variable de entorno (p. ej.
`MAILERSEND_ADMIN_EMAIL`), no de `configuracion`: es un dato de despliegue,
no de negocio, y no necesita administrarse desde la base de datos.

---

## 9. Casos límite

- **Descripción de 280 caracteres exactos**: el contador cambia de tono
  (`--text-2` → `--warning`) a partir de 260, sin bloquear el envío hasta
  pasar de 280.
- **Teléfono con indicativo internacional** (`+57 300 123 4567`): se acepta,
  la validación cuenta solo dígitos tras quitar `+`, espacios y guiones.
- **Enlace sin protocolo** (`instagram.com/tunegocio` sin `https://`): se
  acepta y el envío antepone `https://` antes de guardarlo en el cuerpo del
  correo — no se le pide al dueño de un negocio que sepa qué es un protocolo.
- **Doble envío por doble clic**: resuelto por construcción (`Button` con
  `loading` deshabilita el control).
- **El visitante cierra el overlay a mitad de escritura**: no hay
  confirmación de "¿seguro que quieres salir?" — es una landing pública sin
  fricción de producto, y los datos no se pierden de un modo costoso (puede
  reabrir y volver a escribir en segundos). Añadir esa confirmación sería
  fricción donde `CLAUDE.md` pide menos clics.
- **JavaScript deshabilitado**: el CTA de alianza navega de verdad a
  `/aliados` (Link real); el envío del formulario funciona porque las Server
  Actions con `<form action={...}>` no dependen de JavaScript en el cliente.
  El único elemento que no funciona sin JS es la ficha de la propia landing —
  el carrusel usa scroll nativo, que tampoco necesita JS.
- **Sesión que expira mientras el visitante llena `/aliados`**: no aplica —
  este formulario no exige sesión de ningún tipo.
- **Cero comercios y cero configuración de WhatsApp a la vez** (entorno de
  desarrollo recién clonado): la landing sigue siendo válida y navegable —
  vitrina y cifras ocultas (§5.1), CTA con el aviso de desarrollo de §5.2 — y
  no lanza ningún error de render.

---

## 10. Notas para el implementador

- Todas las páginas nuevas son **Server Components** sin `requireRol` (son
  públicas por definición); el único `'use client'` que exige la landing es
  `AliadosOverlayTrigger`, y el único que exige `/aliados` es
  `FormularioAliado` (necesita `useActionState` para el estado de envío).
- El `<h1>` de `/aliados` en su presentación de página completa es el titular
  del formulario ("Alía tu negocio con ORUM"), no un segundo `h1` compitiendo
  con el de la cabecera pública (la cabecera no lleva `h1`, solo el wordmark
  como enlace).
- **Verificar en el navegador desde las dos entradas**: clic en "Postular mi
  negocio" desde la landing (debe abrir el overlay, sin cambiar la URL en la
  barra salvo que se decida sincronizarla con `history.pushState` — no
  obligatorio) y visita directa a `/aliados` (debe verse la página completa
  con cabecera y pie). Es el mismo tipo de comprobación de dos orígenes que
  `CLAUDE.md` exige para las rutas interceptadas de `/admin`, aunque aquí el
  mecanismo sea otro.
- El comentario obsoleto de `src/components/ui/badge.tsx` sobre "el CTA
  comercial del Portal Público" debe corregirse al tocar esta zona (§6).
- Reutilizar literalmente los tres anchos de `--carril-tarjeta-w` de
  `carrusel-destacados.module.css` para `VitrinaPublica`, no reinventarlos.
- Pendiente **legal, no de UX**: decidir si `/aliados` necesita aviso de
  tratamiento de datos personales (Ley 1581) antes de salir a producción.

---

## PROPUESTAS PARA BACKEND

### B1 — Lectura pública (sin sesión) de comercios activos, sus promociones vigentes y sus marcas

- **Qué**: una política de lectura anónima (RLS) —o una vista pública
  restringida a columnas no sensibles— sobre `comercios` (`id`, `nombre`,
  `categoria_id`, `logo_url`, `marca_id`, `activo`), `promociones` (`id`,
  `comercio_id`, `titulo`, `tipo_beneficio_id`, `valor`, vigencia) y `marcas`
  (`id`, `nombre`, `logo_url`). Sin credenciales de teléfono, correo, ni
  ningún dato de un miembro.
- **Por qué la alternativa hoy no basta**: `createClient()` usa la clave
  anónima con sesión por cookies (`src/lib/supabase/server.ts`), y hoy
  **todos** los consumidores de esas tablas están detrás de
  `requireMiembroVigente`, `requireRolComercio` o un rol de administración.
  Sin una política nueva, la consulta de la vitrina pública devuelve cero
  filas **en silencio** — el mismo patrón de fallo ya documentado en
  `API-CONTRACT.md` §3 para otras páginas, aquí con una consecuencia peor: la
  landing mentiría por omisión sobre si ORUM tiene aliados.
- **Mejora que aporta**: es la pieza que convierte la landing de "página de
  marketing genérica" a "vitrina real", que es literalmente el encargo.
- **Entretanto**: la vitrina y la sección de cifras **no se renderizan**
  (§5.1) — no se sustituyen por datos inventados ni por una versión "de
  mentira" con nombres de ejemplo, que rompería la confianza en cuanto un
  visitante reconociera que ningún comercio de la lista existe.

### B2 — Conteos públicos agregados (comercios activos, ciudades con cobertura)

- **Qué**: dos números de solo lectura, sin política nueva más allá de la que
  pide B1 (son un `count` sobre las mismas tablas).
- **Por qué**: la sección de cifras (§2.2, punto 5) depende de B1; no es un
  requisito adicional de esquema, solo de la misma política de lectura ya
  pedida — se anota por separado porque es la pieza que el propietario dijo
  explícitamente "si las hay": hoy, sin B1, no las hay.
- **Entretanto**: la sección de cifras no se renderiza (mismo criterio que
  B1, no se inventan números redondos).

### B3 — Bandeja o registro mínimo de solicitudes de comercio aliado

- **Qué**: aunque la decisión del propietario es correo sin tabla, una fila
  mínima (`solicitudes_aliados`: nombre, contacto, teléfono, correo, ciudad,
  categoría, `created_at`, `atendida boolean`) resolvería lo que un correo no
  resuelve: si el correo de MailerSend falla silenciosamente (como ya ocurre
  hoy con `enviarCorreoInvitacion`, que solo hace `console.error` y no
  informa al remitente), la solicitud **desaparece sin dejar rastro** en
  ningún sitio consultable.
- **Por qué la alternativa de hoy (solo correo) es más frágil**: un comercio
  que llenó el formulario y nunca recibe respuesta no tiene manera de saber
  si ORUM lo ignoró o si el correo se perdió, y ORUM tampoco tiene forma de
  auditar cuántas solicitudes ha recibido en total.
- **Entretanto**: se acepta el riesgo que ya acepta el resto del producto con
  MailerSend (la invitación de un miembro nuevo tiene el mismo punto ciego) y
  se documenta aquí para que no sea una sorpresa si una solicitud "se
  pierde".
