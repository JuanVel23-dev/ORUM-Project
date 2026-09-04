import { ChevronDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import styles from './filtros-form.module.css'

type Opcion = { id: number; nombre: string }

/** Un desplegable del formulario, con el diccionario del que saca sus opciones. */
type FiltroSelect = {
  id: string
  name: string
  etiqueta: string
  /** Texto de la opción "sin filtrar". Cambia de género según el filtro. */
  todas: string
  valor: string
  opciones: Opcion[]
}

/**
 * Mínimo de opciones para que un desplegable se renderice.
 *
 * DOS, no una. Con una sola ciudad —Bogotá, el caso real— se pintaba un
 * control que no puede discriminar nada: un filtro que solo puede dar un
 * resultado no es un filtro, es una etiqueta con forma de control.
 */
const MINIMO_OPCIONES = 2

export function FiltrosForm({
  q,
  marcaId,
  ciudadId,
  categoriaId,
  marcas,
  ciudades,
}: {
  q: string
  marcaId: string
  ciudadId: string
  /** No tiene control aquí: lo eligen los chips. Viaja escondido. */
  categoriaId: string
  marcas: Opcion[]
  ciudades: Opcion[]
}) {
  /*
    "Comercio" ya no está. Duplicaba la búsqueda —`q` hace ILIKE sobre el
    nombre—, y con cien opciones era peor buscador que un campo de texto:
    escribir tres letras es menos trabajo que abrir un selector de cien. Era,
    además, lo que más ocupaba el primer pantallazo.

    "Categoría" tampoco: subió a la fila de chips, donde filtra de un toque en
    vez de abrir → elegir → "Filtrar".
  */
  const selects: FiltroSelect[] = [
    {
      id: 'f-marca',
      name: 'marca_id',
      etiqueta: 'Marca',
      todas: 'Todas',
      valor: marcaId,
      opciones: marcas,
    },
    {
      id: 'f-ciudad',
      name: 'ciudad_id',
      etiqueta: 'Ciudad',
      todas: 'Todas',
      valor: ciudadId,
      opciones: ciudades,
    },
  ].filter((f) => f.opciones.length >= MINIMO_OPCIONES)

  const nombresRenderizados = new Set(selects.map((f) => f.name))

  /*
    Filtros vivos en la URL que NO tienen control visible en este formulario:
    la categoría (que eligen los chips) y cualquier desplegable que no llegue
    al umbral de dos opciones. Viajan como campos ocultos porque este formulario
    es `method="get"` y lo que no está dentro NO SE ENVÍA: sin esto, pulsar
    Enter en la búsqueda borraría la categoría que el socio acaba de elegir.
  */
  const ocultos = [
    { name: 'categoria_id', valor: categoriaId },
    { name: 'marca_id', valor: marcaId },
    { name: 'ciudad_id', valor: ciudadId },
  ].filter((c) => c.valor !== '' && !nombresRenderizados.has(c.name))

  const hayFiltros = Boolean(q || marcaId || ciudadId || categoriaId)

  /* Abierto si alguno de SUS controles está activo: nunca puede haber un
     filtro aplicado y escondido detrás de un triángulo cerrado. */
  const desplegableAbierto = selects.some((f) => f.valor !== '')

  return (
    /* GET, no POST: los filtros quedan en la URL, se comparten y sobreviven a
       un refresco. Funciona sin JavaScript. */
    <form method="get" className={styles.filtros}>
      {ocultos.map((c) => (
        <input key={c.name} type="hidden" name={c.name} value={c.valor} />
      ))}

      <div className={styles.campoBusqueda}>
        <label className={styles.etiqueta} htmlFor="f-buscar">
          Buscar
        </label>
        {/*
          `type="search"` da el botón nativo de limpiar en iOS —un toque menos—
          y `enterkeyhint` hace que la tecla del teclado diga "buscar" en vez de
          "intro". El corrector y las mayúsculas automáticas se apagan: un
          nombre de comercio no es una frase.

          El alto de 16px en puntero grueso lo garantiza `--t-control-size`, sin
          el cual Safari iOS hace zoom al enfocar y descoloca la rejilla ya
          pintada.
        */}
        <Input
          id="f-buscar"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Busca un comercio o un beneficio"
          startIcon={<Search size={16} />}
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
        />
      </div>

      {selects.length > 0 && (
        /*
          Un `<details>` DENTRO del mismo formulario: cerrado sigue enviando los
          controles que contiene, funciona sin JavaScript y no necesita
          overlay —la ranura `@modal` vive solo en `app/admin/layout.tsx`, y
          crear una aquí sería inventar arquitectura para dos desplegables—.
        */
        <details className={styles.masFiltros} open={desplegableAbierto}>
          <summary className={styles.resumen}>
            Más filtros
            <ChevronDown size={16} aria-hidden className={styles.triangulo} />
          </summary>

          <div className={styles.cuerpo}>
            {selects.map((f) => (
              <div key={f.id}>
                <label className={styles.etiqueta} htmlFor={f.id}>
                  {f.etiqueta}
                </label>
                <Select id={f.id} name={f.name} defaultValue={f.valor}>
                  <option value="">{f.todas}</option>
                  {f.opciones.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </Select>
              </div>
            ))}

            <div className={styles.acciones}>
              <Button type="submit" variant="secondary">
                Filtrar
              </Button>
            </div>
          </div>
        </details>
      )}

      {/*
        "Limpiar" vive FUERA del desplegable, y esto es una desviación
        consciente de la spec, que lo ponía dentro junto a "Filtrar".

        El motivo: dos de los filtros no tienen control en este formulario. La
        categoría la eligen los chips y el texto vive en la búsqueda, cuyo
        botón nativo de limpiar no envía nada. Con los diccionarios de hoy
        —cero marcas y una sola ciudad— el `<details>` NI SIQUIERA SE
        RENDERIZA, así que un "Limpiar" encerrado ahí dentro sería un reset
        total inalcanzable justo en el caso real. Aquí aparece en cuanto hay
        algo que limpiar y desaparece cuando no.
      */}
      {hayFiltros && (
        <div className={styles.acciones}>
          <Button href="/miembros" variant="ghost" icon={<X size={16} />}>
            Limpiar
          </Button>
        </div>
      )}
    </form>
  )
}
