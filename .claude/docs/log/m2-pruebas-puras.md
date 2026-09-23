# Log · m2-pruebas-puras

> Una entrada por tarea terminada. Formato: `## <tarea>` + qué se hizo, qué quedó fuera y por qué.

## `src/lib/miembros/volver-catalogo.ts` — 22 pruebas

Foco en el ataque, no en el camino feliz: URL absoluta a otro dominio, protocolo
relativo (`//evil.com` con y sin query/fragmento), `javascript:` (incluyendo
`JaVaScRiPt:`), `data:`, `\\evil.com`, `/\evil.com`, percent-encoding que esconde
protocolo relativo o `javascript:` o el propio `/miembros` (no se decodifica antes
de comparar, así que sigue rechazado — correcto), el truco `/miembros@evil.com`,
`/miembros/perfil` (ruta hermana legítima del portal pero no el catálogo), vacío,
`undefined`, array vacío. Casos legítimos: exacto, con query, con query+fragmento,
y `string[]` (toma el primer elemento, válido o no).

**No es un bug, pero quedó documentado con test explícito**: `/miembros#fragmento`
(fragmento SIN query) se rechaza y cae al catálogo por defecto. La firma solo
admite dos formas (`/miembros` exacto o `/miembros?...`); un fragmento solo no es
ninguna de las dos. Es coherente con el JSDoc del módulo ("Nada más pasa"), así
que se dejó como comportamiento verificado, no como bug a corregir — pero si
alguien esperaba que un enlace con ancla sobreviviera al botón «‹ Comercios»,
esto lo desmiente.

**No se encontró bug de seguridad real**: la implementación por lista blanca ya
cubre todos los vectores probados porque exige que la cadena entera empiece
literalmente por `/miembros` (una sola barra) — ninguna variante de esquema o de
protocolo relativo puede colarse delante de esa comprobación.

## `src/lib/comercios/logo-comercio.ts` — 12 pruebas

Cadena comercio → marca → `null`: comercio presente, comercio ausente con marca
presente, ambos ausentes, cadena vacía en comercio (cae a marca), solo-espacios
en comercio y en marca por separado (fila de `marcas` cargada a mano, sin
formulario), ambos vacíos, ambos solo-espacios, recorte de espacios sobrantes en
el valor devuelto (para comercio y para marca), y los dos casos base de cadena
simple. Sin bugs: la doble normalización (`??` + `trim` + comparación con `''`)
ya cubre exactamente los casos límite de la columna cargada a mano.

**Fuera de alcance de este módulo**: la cadena "inicial" mencionada en la tarea
(comercio → marca → inicial) no vive en `src/lib/comercios/logo-comercio.ts` —
ese módulo solo resuelve comercio → marca → `null`. La extracción de la inicial
(`nombre.trim().charAt(0).toUpperCase()`) está inline en
`src/components/ui/comercio-logo.tsx`, un Server Component sin lógica extraída
a función pura, y `src/components/**` es zona de solo lectura para esta tarea.
No se tocó. Si se quiere cubrir con Vitest, habría que extraerla a una función
pura en `src/lib/comercios/`, lo cual es una decisión de refactor que no me
corresponde tomar aquí.

## `src/lib/comercios/estanterias.ts` — 25 pruebas

`seleccionarNovedades`: bordes exactos de `MINIMO_CATALOGO_NOVEDADES` (7 → vacío,
8 → aparece, con 3/4 recientes en el borde de `MINIMO_RECIENTES`), borde exacto de
`DIAS_NOVEDAD` (90 días cuenta como reciente, 91 no), `TOPE_ESTANTERIA` con 12
comercios, y `createdAt` nulo/ilegible tratado como el más antiguo sin `NaN` en el
comparador.

**Bug real encontrado y NO corregido, porque no lo es** (documentado para que quede
explícito y nadie lo redescubra como bug): mis primeras tres pruebas asumían que
`seleccionarNovedades` devuelve solo el subconjunto "reciente". Falso: el filtro de
recientes únicamente decide SI la estantería se muestra; el contenido siempre es el
catálogo completo ordenado por fecha (hasta `TOPE_ESTANTERIA`). Corregidas las
aserciones, no el código — el comportamiento real es intencional y coherente con
el JSDoc ("las estanterías cuentan CATÁLOGO").

`seleccionarBeneficiosDelMomento`: bordes exactos de `MINIMO_COMERCIOS_CON_PROMOCION`
(1 comercio con muchas promos no basta) y `MINIMO_PROMOCIONES_DESTACADAS` (2+1=2 no
alcanza, 1+2=3 sí), comercios sin promoción excluidos del resultado, tope de 10.

`seleccionarDestacados`/`apoyoDestacados`: borde de `MINIMO_DESTACADOS` (2 vacío, 3
aparece), exclusión dura de comercios sin logo (incluso con beneficio), logo de
solo espacios tratado como ausente, los tres niveles de orden (beneficio >
descripción > resto), desempates en cascada (beneficios desc → fecha desc → nombre
asc con `localeCompare('es')`, no `id`), tope de 6, y las tres variantes de copy de
`apoyoDestacados`.

## `src/lib/miembros/navegacion-portal.ts` — 12 pruebas

`esDestinoActivo` para los dos destinos reales del portal (`/miembros`,
`/miembros/perfil`, tomados de `portal-nav.tsx`): raíz exacta, no-`startsWith`
ingenuo sobre `/miembros/perfil` como hijo falso, ficha de comercio como contenido
de Inicio, `/miembros/comercios` sin id, `/miembros/inactiva` sin match en ningún
destino, coincidencia de segmento sin separador (`/miembros/perfil2` no activa
`/miembros/perfil`), y sub-rutas propias de un destino que no es Inicio. Sin bugs.

### Resultado de verificación (los tres juntos, tras las correcciones)

```
tsc --noEmit   → limpio, sin salida
eslint .       → limpio, sin salida
vitest run     → 19 archivos, 218 pruebas, todas en verde
```

Base previa: 147 pruebas en 15 archivos. Aportadas en esta tarea: 4 archivos
nuevos, 71 pruebas (22 volver-catalogo + 12 logo-comercio + 25 estanterias + 12
navegacion-portal). Total confirmado por Vitest: 218 pruebas en 19 archivos.
