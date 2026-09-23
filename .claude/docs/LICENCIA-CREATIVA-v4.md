# Licencia creativa · 14/09/2026

> **Encargo literal del propietario:** «Puedes quitar restricciones, mientras se
> vea bien el producto final. Estamos diseñando, no tenemos que estar ligados a
> reglas.»
>
> Este documento **levanta** las restricciones autoimpuestas que estaban frenando
> el resultado, y deja por escrito las pocas que siguen — no por dogma, sino
> porque romperlas hace que el producto se vea **peor**, que es justo lo que el
> encargo quiere evitar.

---

## 1. Levantadas — diseña con esto libre

| Regla | Estado | Qué se puede hacer ahora |
|---|---|---|
| **Presupuesto del oro ≤5 %** | **Levantada** | El oro puede ocupar lo que la pantalla pida. Una franja entera de cacao con titular dorado es legítima |
| **Una sola cosa con trazo grueso por pantalla** | **Levantada** | Jerarquía libre |
| **«La sombra es jerarquía, no decoración»** | **Levantada** | Puede decorar |
| **El serif solo en `h1`** | **Levantada** | Display, cifras, etiquetas ceremoniales, lo que funcione |
| **`@container contenido`, nunca `@media`** | **Levantada** | Usa lo que resuelva mejor. El `@container` sigue siendo más correcto donde la barra lateral cambia el ancho útil, pero deja de ser obligatorio |
| **Rebote solo tras gesto con momento** | **Levantada** | El movimiento puede tener carácter |
| **Formulario siempre en overlay** | **Levantada** | Si una pantalla propia queda mejor, pantalla propia |
| **Primario en tinta en Administración** | **Levantada** | Puede llevar oro si mejora. (En la Herramienta de Comercios conviene seguir sobrio: se usa de pie, en una caja, con el cliente esperando — pero es criterio, no prohibición) |
| **Sin literales de color fuera de tokens** | **Relajada** | Preferir tokens sigue siendo mejor para mantener el sistema, pero un literal puntual bien comentado ya no es un bug |
| **Sin autoplay** | Ya levantada | Con pausa, que es lo que la hace usable |

---

## 2. Las que siguen, y por qué cada una hace que se vea MEJOR

Ninguna de estas es estética. Todas son «el producto funciona o no».

### Legibilidad
**Contraste AA en texto.** Un titular dorado a 1,99:1 —el de Ferrero, medido— no
se lee elegante: se lee borroso, y en un teléfono al sol no se lee en absoluto.
Es la restricción que más protege el «se ve bien». Es también la que nos llevó al
hallazgo bueno: el oro sobre cacao, que es más bonito que sobre crema.

### Que se pueda usar
**`:focus-visible` en todo interactivo.** Sin él, quien navega con teclado no
sabe dónde está. Y al no haber bordes, el foco es además lo único que marca el
límite de un control.

**Objetivos táctiles ≥44px en móvil.** Un corazón de 20px se falla una de cada
tres veces. Eso no se percibe como «diseño fino», se percibe como que la
aplicación no responde.

**`prefers-reduced-motion`.** Hay gente a la que el movimiento le produce mareo
real. No significa quitar el feedback: significa darlo sin desplazamiento.

### Que se sienta rápido
**Solo `transform` y `opacity`.** Animar `width`, `height` o `margin` recalcula
el layout en cada fotograma. En el teléfono de gama media donde el socio abre
esto, es la diferencia entre fluido y a tirones — y una animación a tirones se ve
peor que ninguna animación.

### Que no mienta
Estas tres ya costaron caro una vez:

- **`QrCode` negro sobre blanco en los dos temas.** Invertirlo rompe el escaneo
  en algunos lectores, y el fallo ocurre en la caja delante del cliente.
- **El estado con `derivarEstadoMembresia`.** `membresias.estado` tiene default
  `'activa'` y nada la actualiza al vencer: leerla en crudo le diría «Activa» en
  verde a quien lleva meses sin pagar.
- **Fechas civiles con `Date.UTC` y `timeZone: 'UTC'`.** Leerlas en Bogotá las
  retrasa un día, y el carnet llegó a anunciar el vencimiento antes de tiempo.

---

## 3. El criterio que sustituye a las reglas levantadas

Sin reglas hace falta un juicio. Este:

> **¿La pantalla dice su dato más rápido, o más lento, por culpa de esta
> decisión?**

El socio abre el catálogo **para resolver algo**: saber dónde le hacen descuento
hoy. El lujo va en el cromo, en el carnet y en el escaparate público. La lista de
comercios puede ser preciosa, pero sigue siendo una lista que se lee de un
vistazo.

Y el de Emil Kowalski para el movimiento, que no es una regla sino una pregunta:
**¿cuántas veces al día va a ver el usuario esta animación?** Lo que se ve
cientos de veces no se anima nunca; lo raro puede deleitar.
