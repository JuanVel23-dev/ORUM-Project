/*
  Service worker de ORUM.

  POR QUÉ ESTÁ ESCRITO A MANO Y NO CON SERWIST
  --------------------------------------------
  Casi todas las rutas de esta app son dinámicas y exigen sesión: no hay un
  "app shell" estático que valga la pena precachear. Lo que sí aporta un SW
  aquí es (1) hacer la app instalable, (2) servir los assets con hash desde
  caché y (3) tener una pantalla decente sin conexión. Eso son ~60 líneas.

  A cambio se gana lo importante: control explícito de qué NO se cachea. En
  un panel con datos de clientes, guardar por error una respuesta autenticada
  en la caché del navegador sería un fallo de privacidad, no un bug de
  rendimiento.

  REGLA DE ORO: aquí nunca se guarda HTML de páginas autenticadas ni ninguna
  respuesta de Supabase.
*/

const VERSION = 'orum-v1'
const CACHE_ESTATICO = `${VERSION}-estatico`
const CACHE_ASSETS = `${VERSION}-assets`

/** Lo mínimo para poder mostrar algo sin conexión. */
const PRECARGA = ['/offline', '/icons/orum.svg']

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_ESTATICO)
      .then((cache) => cache.addAll(PRECARGA))
      // Activa la versión nueva sin esperar a que se cierren las pestañas
      // viejas. Es seguro porque no se cachea HTML: no hay riesgo de mezclar
      // una página vieja con assets nuevos.
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((nombre) => !nombre.startsWith(VERSION))
            .map((nombre) => caches.delete(nombre)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request

  // Solo GET: un POST a una server action jamás debe tocar la caché.
  if (peticion.method !== 'GET') return

  const url = new URL(peticion.url)

  // Otro origen = Supabase (o cualquier API externa). Pasa de largo: sus
  // respuestas llevan datos de clientes y tokens de sesión.
  if (url.origin !== self.location.origin) return

  // Rutas de datos del propio servidor: tampoco se cachean.
  if (url.pathname.startsWith('/api')) return

  // Assets con hash en el nombre: su contenido no cambia nunca sin cambiar la
  // URL, así que servirlos desde caché no puede quedar obsoleto.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    evento.respondWith(
      caches.match(peticion).then(
        (enCache) =>
          enCache ??
          fetch(peticion).then((respuesta) => {
            if (respuesta.ok) {
              const copia = respuesta.clone()
              caches.open(CACHE_ASSETS).then((cache) => cache.put(peticion, copia))
            }
            return respuesta
          }),
      ),
    )
    return
  }

  // Navegación: SIEMPRE red primero. Si falla, se muestra la pantalla sin
  // conexión — nunca una versión cacheada de una página con datos.
  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion).catch(() =>
        caches.match('/offline').then(
          (offline) =>
            offline ??
            new Response('Sin conexión', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            }),
        ),
      ),
    )
    return
  }

  // Todo lo demás va a la red sin intermediarios.
})
