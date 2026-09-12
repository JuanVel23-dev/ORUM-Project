import { redirect } from 'next/navigation'

/**
 * Raíz del sitio.
 *
 * Envía al Portal de Miembros. El proyecto tiene TRES portales —Miembros,
 * Administración y la Herramienta de Comercios—, así que la raíz tiene que
 * elegir uno, y el elegido es el del socio: es quien escribe el dominio a
 * secas, y es también el destino de `start_url` de la aplicación instalable
 * (`manifest.ts`). Que las dos puertas lleven al mismo sitio es deliberado.
 *
 * Antes iba a `/admin`, con el comentario «por ahora el proyecto solo tiene el
 * Portal Administrativo». Eso dejó de ser cierto y nadie actualizó el destino:
 * un socio que escribía el dominio aterrizaba en el acceso administrativo con
 * `?error=sin_permiso`, que se lee como «no eres bienvenido» y no como «esta
 * no es tu puerta».
 *
 * Quien trabaja en el club sigue entrando por `/admin` o `/comercios`, que es
 * lo que tiene guardado. Si no hay sesión válida, cada portal manda a su
 * propio acceso.
 */
export default function Home() {
  redirect('/miembros')
}
