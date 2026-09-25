import {
  Briefcase,
  Camera,
  Car,
  Coffee,
  Dumbbell,
  Ellipsis,
  Flower2,
  GraduationCap,
  Hand,
  Hotel,
  IceCreamCone,
  Laptop,
  Paintbrush,
  Palette,
  PawPrint,
  Salad,
  Scissors,
  Shirt,
  ShoppingBasket,
  Sofa,
  Sparkles,
  Stethoscope,
  Tag,
  Ticket,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import {
  claveIconoCategoria,
  type ClaveIconoCategoria,
} from '@/lib/comercios/iconos-categoria'

/*
  EL GLIFO DE CADA CATEGORÍA  ·  encargo nº 10
  ---------------------------------------------------------------------------
  Vive en `components/ui/` y no en el `_components/` del portal de miembros
  porque ahora lo usan DOS portales: el catálogo del socio y el directorio
  público (`/explorar`). Una ruta pública importando de una ruta privada
  invertiría la dependencia.

  Server Component: es una tabla de consulta y un `<svg>`. Cero JavaScript en el
  cliente.

  `Record<ClaveIconoCategoria, LucideIcon>` — el tipo es exhaustivo A PROPÓSITO.
  Si alguien añade una clave en `iconos-categoria.ts` y olvida su glifo aquí, la
  compilación falla. Es la única forma de garantizar lo que el encargo exige:
  **nunca un hueco**.

  Los iconos se eligieron para que se distingan ENTRE SÍ a 14px, que es donde
  viven. Dos glifos parecidos a ese tamaño valen lo mismo que ninguno: por eso
  salud lleva fonendoscopio y no un corazón —que ya es el de favoritos— y
  mercado lleva cesta y no carrito —que es lo que la gente asocia a "comprar
  aquí"—.
*/
const GLIFOS: Record<ClaveIconoCategoria, LucideIcon> = {
  comida: UtensilsCrossed,
  cafe: Coffee,
  mercado: ShoppingBasket,
  salud: Stethoscope,
  belleza: Sparkles,
  deporte: Dumbbell,
  moda: Shirt,
  viajes: Hotel,
  educacion: GraduationCap,
  tecnologia: Laptop,
  vehiculos: Car,
  mascotas: PawPrint,
  ocio: Ticket,
  hogar: Sofa,
  servicios: Briefcase,
  fotografia: Camera,
  saludable: Salad,
  heladeria: IceCreamCone,
  spa: Flower2,
  /* El pincel del esmalte. Maquillaje lleva la paleta: a 20px un pincel y
     una paleta no se confunden, dos brochas sí. */
  unas: Paintbrush,
  maquillaje: Palette,
  estilista: Scissors,
  masajes: Hand,
  otros: Ellipsis,
  /* EL RESPALDO. Una etiqueta: no promete un tipo de negocio, solo dice "esto
     es una categoría". Nunca se devuelve `null`. */
  generico: Tag,
}

/**
 * El icono de una categoría, por su nombre.
 *
 * Siempre `aria-hidden`: la etiqueta de texto va al lado, SIEMPRE. El encargo lo
 * dice y la norma del proyecto también —icono **+** texto, nunca icono solo—,
 * así que un `aria-label` aquí haría que el lector de pantalla leyera dos veces
 * lo mismo.
 */
export function IconoCategoria({
  nombre,
  className,
  size = 14,
}: {
  nombre: string | null | undefined
  className?: string
  size?: number
}) {
  const Glifo = GLIFOS[claveIconoCategoria(nombre)]
  return <Glifo size={size} aria-hidden="true" className={className} />
}
