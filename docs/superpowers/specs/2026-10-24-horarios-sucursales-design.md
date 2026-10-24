# Horarios de atención por sucursal — diseño

Fecha: 24/10/2026 · Estado: **borrador, esperando aprobación** · Sin código escrito.

## Por qué

Hoy la ficha de un comercio (pública y del socio) dice dónde están sus sedes pero
no cuándo atienden. El socio no sabe si llega a una puerta cerrada. Cada
sucursal puede tener un horario distinto, así que el horario vive en la sucursal.

La dirección ya existe por sucursal (`sucursales.direccion`, opcional) y
**no se vuelve obligatoria** (decisión del propietario, 24/10/2026).

## Qué se quiere (dicho por el propietario)

- Horario **por sucursal**, estructurado, por día de la semana.
- **Pausa de almuerzo opcional**, con su franja.
- **Festivos**: UNA sola regla por sucursal («Festivos: cerrado» o «Festivos:
  10:00 a 16:00») que vale para todos los festivos. Sin fechas sueltas.
- Dos sucursales del mismo comercio pueden tener horarios distintos; nada se
  hereda entre ellas.

## Fuera de alcance

- Excepciones por fecha concreta («24 de diciembre: cerrado») y cierres
  temporales. Posible fase 2 si los comercios lo piden.
- Hacer la dirección obligatoria.
- Cambiar el horario de las sucursales ya existentes: quedan **sin horario**
  hasta que alguien lo cargue, y la ficha simplemente no muestra nada (igual que
  hoy con una sede sin dirección).

## Modelo de datos

Tabla nueva `sucursal_horarios`, una fila por sucursal y «día»:

| Columna | Tipo | Notas |
|---|---|---|
| `sucursal_id` | bigint, FK `sucursales(id)` ON DELETE CASCADE | |
| `dia` | smallint | 1 = lunes … 7 = domingo, **8 = festivos** |
| `abre` | time | `null` = cerrado ese día |
| `cierra` | time | `null` si `abre` es `null` |
| `almuerzo_desde` | time null | opcional |
| `almuerzo_hasta` | time null | opcional; las dos o ninguna |

PK `(sucursal_id, dia)`. Una sucursal sin filas = «sin horario cargado».
Una fila con `abre null` = «cerrado» (distinto de no tener fila).

Reglas que debe garantizar la base (CHECK/trigger), no solo la interfaz:
`dia` entre 1 y 8; `abre` y `cierra` ambos o ninguno; el almuerzo, ambos o
ninguno y solo si hay `abre`; y el almuerzo cae **dentro** de la jornada.

Reglas de horas (mi decisión, ver «Decisiones mías»): `cierra` menor que `abre`
significa que cierra **pasada la medianoche** (bares, restaurantes). «Abierto
24 horas» tiene que poder expresarse; la representación la elige quien lo
construya, pero debe quedar probada.

La migración se aplica a mano (como las demás). El código debe aguantar la base
sin la tabla —leer sin horarios, no romper la ficha— igual que
`obtenerPublicidadPublica` hace con `publicidad`.

## Lógica pura (probada)

En `src/lib/comercios/`, sin dependencias de React ni de Supabase, con pruebas
(regla del repo: pruebas solo de funciones puras):

- Validar un horario (rangos, almuerzo dentro de jornada, cierre tras medianoche).
- Calendario de **festivos de Colombia** calculado por código (Ley Emiliani:
  festivos trasladados al lunes + los que dependen de la Pascua), para cualquier
  año, sin tabla que mantener a mano.
- `estadoAhora(horario, instante)`: abierta / en pausa de almuerzo / cerrada,
  y cuándo cambia. **Siempre en hora de Colombia** (`America/Bogota`), nunca la
  del navegador ni la del servidor. Un festivo usa la fila 8 y **no** la del día
  de la semana.
- Agrupar días iguales para mostrarlos («Lun–vie 9:00–18:00»).

## Dónde se edita

1. **Panel de administración**: el formulario de sucursal ya existente
   (`SucursalForm`, se abre en overlay) gana una sección «Horario». Es overlay,
   no página (regla del repo), y valida campo a campo con `useValidacion`.
2. **Herramienta de Comercios («Mi negocio»)**: **fuera de alcance por ahora**
   (propietario, 24/10/2026). El horario lo carga solo el super administrador.
   Fase posterior si se quiere que el comercio lo mantenga.

Interfaz del editor (a validar en navegador, no en papel): una fila por día con
interruptor abierto/cerrado y dos horas; ayuda para copiar un horario a varios
días; interruptor de almuerzo con su franja; fila aparte de festivos. Campos de
hora con su borde (excepción de formularios del `CLAUDE.md`), objetivos
táctiles ≥44px, y `SelectMenu`/`Switch` del sistema, sin tercera familia
tipográfica ni colores literales.

## Dónde se ve

Ficha pública y ficha del socio, bajo la dirección de cada sede
(`FichaComercio` → `SedeFicha` gana el horario). Muestra la semana agrupada, el
día de hoy resaltado y una línea «Abierto ahora · cierra a las 6:00 p. m.» /
«En pausa de almuerzo · reabre a las 2:00 p. m.» / «Cerrado · abre mañana a las
9:00 a. m.». El estado nunca va solo en color: punto lleno/hueco **y** texto.

**Ojo de rendimiento/caché**: la ficha pública sale de caché (`updateTag('publico')`).
Un «abierto ahora» calculado en el servidor se quedaría viejo. El cálculo del
estado va en un componente de cliente pequeño que recibe el horario ya
resuelto; el resto de la ficha sigue siendo Server Component. Sin parpadeo:
el servidor pinta la semana, el cliente añade solo la línea de estado.

Cuando los datos cambian, las acciones sueltan la caché con `updateTag('publico')`.

## Bitácora

Cambiar un horario se anota en `bitacora_actividad` como el resto de ediciones
de sucursal (entidad `sucursal`).

## Decisiones mías (el propietario no las pidió; corregir si no gustan)

- Una fila por día, con almuerzo **por día** en la base. La interfaz ofrece
  poner el mismo almuerzo a todos los días abiertos para no repetirlo siete veces.
- Cierre pasada la medianoche permitido (`cierra < abre`).
- Festivos de Colombia calculados por código, no cargados a mano.
- Sin horario cargado = no se muestra nada (no «Cerrado»).
- Formato de hora de 12 h con a. m./p. m. en pantalla; 24 h en la base.

## Preguntas abiertas (del propietario)

Ninguna. (Resuelta: el horario se edita solo desde el admin.)

## Verificación esperada

`tsc`, `eslint`, `vitest` y `next build` en verde (comandos del `CLAUDE.md`);
pruebas de la lógica pura, incluidos festivos de varios años y cierre tras
medianoche; script SQL de verificación en `supabase/verificacion/`; y, antes
de darlo por hecho, **mirarlo renderizado** en 1366, 820 y 390 px, con y sin
horario cargado, y con la tabla ausente.
