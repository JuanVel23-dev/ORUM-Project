import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import fotoMarca from '@/components/ui/marca/foto-hero.webp'
import { AdornoEstrella, LogoOrum } from '@/components/ui/marca/marca'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import { ENTRADA, retardoEntrada } from '@/lib/shared/revelado'
import styles from './pantalla-acceso.module.css'

/*
  LAS PUERTAS DE ORUM  ·  con el estilo del Portal Público (03/10/2026)
  ---------------------------------------------------------------------------
  Encargo del propietario: «un rediseño total de este login; utiliza el
  estilo de diseño del portal principal».

  Hasta hoy `/miembros/login` era `PantallaAuth`: la tarjeta oscura con halo
  que comparten las pantallas de acceso. El socio llega aquí desde la fachada
  —«Iniciar sesión» en su cabecera— y pasaba de una portada clara con foto,
  Playfair y oro a una pantalla negra que parecía otro producto. Ahora la
  puerta del socio ES la fachada:

    · A un lado, la FOTO DE MARCA del héroe, con el logotipo en plata y un
      titular en el serif de display con su acento en cursiva dorada.
    · Al otro, el formulario sobre BLANCO, con el título de sección de la
      fachada (`TituloSeccion`: estrella y última palabra en cursiva dorada).
    · En el teléfono la foto va arriba y el formulario monta sobre ella con
      las esquinas redondas, como «Así es como te unes» sobre el héroe.

  Nació como la puerta del socio. El mismo día el propietario pidió «el
  mismo estilo de login a todos los logins, pero que cada uno tenga un
  mensaje diferente para diferenciarlos»: ahora es la envoltura de TODAS las
  pantallas de acceso (socios, comercios, administración y la activación de
  cuenta), y reemplaza a la antigua `PantallaAuth` oscura. Vuelven a cambiar
  todas a la vez; lo único que varía es la `puerta`, que elige el mensaje
  sobre la foto (`MENSAJES`), más el titular, el apoyo y los campos.

  Los formularios de dentro siguen tomando sus clases de `estilosAuth`
  (`pantalla-auth.tsx`): la sacudida al fallar depende de que `.formulario` y
  `.alerta` salgan del mismo módulo, y esas clases no dependen del tema.

  Siempre en claro (`data-theme="light"`), como la fachada.
*/

/** A quién le habla la foto. Cada puerta dice lo suyo: es lo que las distingue. */
export type PuertaAcceso = 'socio' | 'comercio' | 'admin' | 'activar' | 'recuperar'

type Mensaje = { insignia: string; frase: string; acento: string; bajada: string }

/* `frase` + `acento` forman una sola oración; el acento va en cursiva dorada. */
const MENSAJES: Record<PuertaAcceso, Mensaje> = {
  socio: {
    insignia: 'Apoya lo local · te da más',
    frase: 'Tus beneficios,',
    acento: 'siempre a mano',
    bajada: 'Tu carnet, los comercios aliados y lo que has ahorrado, en un solo lugar.',
  },
  comercio: {
    insignia: 'Comercios aliados',
    frase: 'Tu negocio,',
    acento: 'más cerca de tus clientes',
    bajada: 'Valida el carnet de cada socio y registra sus compras en segundos.',
  },
  admin: {
    insignia: 'Equipo ORUM',
    frase: 'El club,',
    acento: 'bajo control',
    bajada: 'Socios, comercios aliados y membresías, gestionados desde un solo panel.',
  },
  activar: {
    insignia: 'Te damos la bienvenida',
    frase: 'A un paso de',
    acento: 'estar dentro',
    bajada: 'Elige tu contraseña y tu cuenta queda lista para usar.',
  },
  recuperar: {
    insignia: 'Recupera tu acceso',
    frase: 'Vuelve a entrar,',
    acento: 'sin complicaciones',
    bajada: 'Una contraseña nueva y sigues donde lo dejaste.',
  },
}

type Props = {
  /** Qué puerta es: elige el mensaje sobre la foto. */
  puerta: PuertaAcceso
  /** El `<h1>` de la pantalla. La última palabra sale en cursiva dorada. */
  titular: string
  /** Una línea que dice con qué se entra. */
  apoyo?: string
  /** Nota de ayuda bajo el formulario. */
  pie?: ReactNode
  children: ReactNode
}

export function PantallaAcceso({ puerta, titular, apoyo, pie, children }: Props) {
  const mensaje = MENSAJES[puerta]

  return (
    <div className={styles.pantalla} data-theme="light">
      {/* ── LA FOTO DE MARCA ─────────────────────────────────────────────── */}
      <div className={styles.foto}>
        {/* Decorativa (`alt=""`): la misma del héroe de la portada. */}
        <Image
          className={styles.fotoImagen}
          src={fotoMarca}
          alt=""
          fill
          sizes="(min-width: 900px) 52vw, 100vw"
          quality={80}
          placeholder="blur"
          preload
        />
        <div className={styles.velo} aria-hidden="true" />

        <div className={styles.fotoContenido}>
          {/* Arriba: el logotipo y la vuelta al inicio. La vuelta vive AQUÍ y
              no bajo el formulario: allí alargaba el panel y obligaba a
              desplazar en un portátil. */}
          <div className={styles.barra}>
            <Link href="/" className={styles.marca} aria-label="ORUM, ir al inicio">
              <LogoOrum variante="plata" className={styles.logo} preload />
            </Link>
            <Link href="/" className={styles.volver}>
              <ArrowLeft size={15} aria-hidden="true" className={styles.volverFlecha} />
              Volver al inicio
            </Link>
          </div>

          <div className={styles.mensaje}>
            <p className={[styles.insignia, ENTRADA].join(' ')} style={retardoEntrada(1)}>
              <AdornoEstrella tono="plata" />
              {mensaje.insignia}
            </p>
            {/* No es un encabezado: el `h1` de la pantalla es el del
                formulario. Esto es la frase de la marca. */}
            <p className={[styles.frase, ENTRADA].join(' ')} style={retardoEntrada(2)}>
              {mensaje.frase} <em className={styles.acento}>{mensaje.acento}</em>
            </p>
            <p className={[styles.bajada, ENTRADA].join(' ')} style={retardoEntrada(3)}>
              {mensaje.bajada}
            </p>
          </div>
        </div>
      </div>

      {/* ── EL FORMULARIO ────────────────────────────────────────────────── */}
      <main className={styles.panel}>
        <div className={[styles.columna, ENTRADA].join(' ')} style={retardoEntrada(2)}>
          <header className={styles.cabecera}>
            <TituloSeccion como="h1" texto={titular} tamano="bloque" />
            {apoyo && <p className={styles.apoyo}>{apoyo}</p>}
          </header>

          {children}

          {pie && <p className={styles.pie}>{pie}</p>}
        </div>
      </main>
    </div>
  )
}
