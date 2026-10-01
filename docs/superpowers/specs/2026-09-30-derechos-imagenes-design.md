# Derechos sobre las fotos de los socios — diseño

Fecha: 30/09/2026 · Estado: **decisiones del propietario incorporadas; pendiente de su aprobación final**

## 1. Objetivo

Los socios personalizan su perfil subiendo una foto que se muestra en su carnet
y se guarda en un bucket público (`avatares`). Hoy el único control es técnico
(formato, peso y que los bytes sean una imagen). No hay control de derechos, ni
declaración del usuario, ni forma de retirar una foto ante un reclamo.

Éxito = ORUM puede **demostrar** que cada socio declaró tener derecho sobre su
foto, **reduce** técnicamente lo que puede subirse, y **puede retirar** una foto
y atender un reclamo de derechos de autor con un procedimiento público y
trazable.

## 2. Lo que este diseño NO promete

- **Ningún sistema detecta «copyright» con fiabilidad** sobre una imagen
  cualquiera. Este diseño combina una capa legal, una barrera técnica parcial y
  un procedimiento de retirada; no es un detector.
- **La comprobación de «una sola cara» no es seguridad.** Corre en el navegador,
  así que se puede saltar, y no impide subir la foto real de un tercero. Reduce
  el caso accidental (logos, memes, arte, capturas); la protección jurídica la
  da la declaración.
- **No es asesoría legal.** Los textos nuevos son un borrador y deben ser
  revisados por un abogado de propiedad intelectual antes de publicarse. No se
  afirma que ORUM cumpla la DMCA (ley de EE. UU.) ni la norma colombiana
  equivalente; se implementa el mecanismo habitual de aviso y retirada.

## 3. Alcance

Incluye: declaración obligatoria al subir, una sola cara, retirada desde el
admin, página pública de reclamos y cláusula en los Términos.

No incluye (decisión tomada): búsqueda inversa en internet, formulario propio de
reclamos, contador de reincidencias en la interfaz, registro de agente designado
ante la Oficina de Derechos de Autor de EE. UU. (trámite externo, lo decide el
propietario con su abogado).

Fotos que **no** son de socios (logos, portadas y galerías de comercios,
imágenes de anuncios, avatar de usuarios del panel) quedan fuera: las sube
personal del club o comercios aliados, no el socio.

## 4. Piezas

### 4.1 Declaración al subir

- Casilla obligatoria en el editor del socio (`perfil/foto/_components/editor-foto.tsx`):
  «Confirmo que soy yo quien aparece en esta foto y que tengo derecho a usarla.»
  con enlace a los Términos y a la página de reclamos.
- «Guardar» permanece deshabilitado sin la casilla, **y** la acción de servidor
  `guardarMiFoto` rechaza la subida si el campo `declaracion` no llega (la
  comprobación del navegador es solo comodidad).
- Al guardar con éxito se escribe `miembros.foto_declaracion_at = now()` en la
  **misma** actualización que `foto_url`: no existe foto nueva sin declaración.
- Ruta del administrador (`admin/miembros/[id]/foto`, que sube la foto en nombre
  del socio): mismo control, con el texto «Confirmo que el socio me entregó esta
  foto y tiene derecho a usarla.» Quien declara queda en la bitácora
  (`actor_id`).
- Fotos existentes (2 hoy): quedan con `foto_declaracion_at = null`. No se les
  exige nada retroactivo; declaran en su próximo cambio.

### 4.2 Una sola cara (navegador)

- Al elegir el archivo, antes de habilitar el encuadre, se detectan caras en el
  navegador. Resultado → veredicto puro: `una` (continúa), `ninguna`,
  `varias`, `no_disponible`.
- `ninguna` y `varias` bloquean con mensaje y botón «Elegir otra foto».
- **`no_disponible`** (navegador antiguo, el modelo no cargó) **no bloquea**: se
  permite continuar, porque la capa legal sigue cubriendo y bloquear a un socio
  legítimo por un fallo técnico es peor. Decidido por el propietario.
- Tecnología propuesta: `@mediapipe/tasks-vision` (`FaceDetector`, modelo
  BlazeFace corto, del orden de cientos de KB), cargada con `import()` dinámico
  solo al abrir el editor, con el modelo y el WASM **alojados en el propio
  sitio** (`public/`), sin CDN de terceros. Se valida el tamaño real y el
  soporte en el plan de implementación; si no cumple, se evalúa otra librería.
- La imagen no sale del dispositivo en este paso.

### 4.3 Retirada desde el admin

- En la ficha del miembro, junto a «Cambiar foto», botón «Retirar foto» con
  motivo obligatorio: `reclamo_derechos`, `contenido_inapropiado`,
  `peticion_del_socio`. Abre un overlay de confirmación (regla del proyecto:
  los formularios no navegan).
- Acción de servidor `retirarFotoMiembro(miembroId, motivo)`: **exige rol
  `super_admin` y nada más** (decisión del propietario: por ahora solo el
  administrador retira; los empleados pueden cambiar la foto pero no retirarla).
  El botón tampoco se muestra a empleados, pero la autorización real es la de la
  acción, no la del botón. Valida el motivo contra la lista cerrada.
- Efecto: borra los objetos de Storage en todas las extensiones posibles
  (`borrarObjeto`), pone `foto_url = null` y `foto_declaracion_at = null`, y
  escribe en la bitácora existente con `registrarCambioImagen`
  (`contexto: { accion: 'retirada', motivo }`). El carnet vuelve a mostrar las
  iniciales.
- Hay que verificar en la implementación que la URL antigua deja de servirse:
  la subida usa `cacheControl` de un año y el objeto pasa por la CDN.

### 4.4 Página «Reclamos por derechos de autor»

- Ruta pública `/derechos-de-autor`, armada con `PaginaLegal` como
  `/terminos` y `/privacidad`; enlazada desde el pie (junto a Términos y
  Privacidad) y desde la cláusula nueva.
- Contenido: qué puede reclamarse; los datos que debe traer un aviso (obra
  protegida, enlace a la imagen, datos de contacto, declaración de buena fe,
  firma); correo de contacto; compromiso de retirar con prontitud; política de
  infractores reincidentes.
- Solo texto y un correo. Sin formulario.
- **Buzón: un alias nuevo de la cuenta del admin** (propuesto
  `derechos@cluborum.com`; el nombre lo elige el propietario). Los reclamos
  llegan a la bandeja del admin sin crear otra cuenta ni otra licencia de
  Workspace, y la dirección pública deja de ser la personal del admin.
- **No es el mismo alias que ya existe.** `no-reply@cluborum.com`
  (`GMAIL_FROM_EMAIL`) es un alias de **envío**, para el correo automático de
  invitaciones y recuperaciones, y su nombre dice que nadie lo atiende. Este es
  de **recepción** y se atiende. Ese alias existente no se reutiliza ni se
  modifica.
- **Este diseño no envía ningún correo.** La página solo muestra la dirección
  como enlace `mailto:`, así que no toca `src/lib/correo/correo.ts` ni las
  variables `GMAIL_*`.
- La dirección se lee de `configuracion` (clave nueva `correo_reclamos`), igual
  que `whatsapp_soporte`, para poder cambiarla sin desplegar.
- **Dependencias externas, fuera del código y antes de publicar la página:**
  1. Crear el alias en Workspace (Consola de administración → Directorio →
     Usuarios → admin → Alias de correo).
  2. Comprobar que el dominio recibe correo (registros MX de Google en
     Cloudflare) enviando una prueba al alias y viendo que llega a la bandeja.
  3. Recomendado: añadirlo en Gmail como «Enviar como», para responder a quien
     reclama desde esa misma dirección y no desde la del admin.

### 4.5 Cláusula en los Términos

Apartado nuevo «Contenido que subes» tras la actual §8: el socio declara ser
titular o tener permiso; ORUM puede retirar contenido ante un reclamo; las
cuentas con infracciones repetidas pueden suspenderse. Se renumeran las
secciones siguientes y se actualiza la fecha. Borrador marcado para revisión
legal.

## 5. Datos

Una migración, pequeña:

```sql
alter table public.miembros add column foto_declaracion_at timestamptz;
```

- Sin política nueva: la columna la escribe el servidor con `service_role`,
  igual que `foto_url`. `miembros_self_select` ya limita la lectura.
- Tras aplicarla, regenerar `database.types.ts`.
- Se muestra el SQL al propietario antes de aplicarlo en producción.
- La retirada usa `bitacora_actividad`; no hay tabla nueva.

## 6. Límites de esa seguridad

- La declaración y la fecha son **prueba**, no prevención.
- Borrar la foto no borra copias que alguien ya haya guardado ni lo servido por
  cachés externas.
- El bucket `avatares` sigue siendo público (es lo que permite mostrar el
  carnet); este diseño no cambia eso.

## 7. Pruebas

Solo funciones puras (norma del proyecto), en `src/lib/imagenes/`:

- veredicto de caras (`una` / `ninguna` / `varias` / `no_disponible`) desde un
  número de detecciones y un estado de disponibilidad;
- validación de motivo de retirada (lista cerrada, rechaza cualquier otro);
- exigir declaración (`on`/ausente/valores raros → solo un valor afirmativo
  pasa).

Manual, en navegador real: flujo completo de subida con y sin casilla, foto sin
cara, con varias, navegador sin soporte; retirada y que la URL antigua deja de
cargar; la página de reclamos y sus enlaces; vista móvil.

## 8. Decisiones del propietario

Resueltas:

1. Alias de reclamos: `derechos@cluborum.com`, **ya creado en Workspace** según
   el propietario. Antes de publicar la página se comprueba de extremo a extremo
   (un correo de prueba que llegue a la bandeja del admin).
2. Si la detección facial no puede ejecutarse, el socio **continúa**.
3. **Solo `super_admin` retira fotos**, por ahora.

Pendiente, fuera del código:

4. El abogado está revisando los textos legales (cláusula de los Términos,
   página de reclamos, política de reincidentes). Se implementan como borrador y
   **no se publican hasta tener su visto bueno**; el texto final puede cambiar.
