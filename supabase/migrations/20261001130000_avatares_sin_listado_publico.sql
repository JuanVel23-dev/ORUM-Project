-- ORUM · El bucket `avatares` deja de poder listarse sin sesión
--
-- Auditoría de seguridad del 1/10/2026. Las rutas de las fotos de socio ahora
-- llevan una clave aleatoria por subida (`miembros/{id}/{clave}/foto.{ext}`),
-- pero esa clave solo protege si nadie puede PEDIR LA LISTA de archivos del
-- bucket. Esta política le daba a cualquiera, sin sesión, permiso de lectura
-- sobre storage.objects del bucket, y con él el listado completo.
--
-- Quitarla NO rompe la visualización de las fotos: el bucket es público, y el
-- endpoint público (/storage/v1/object/public/avatares/…) sirve los archivos
-- sin consultar políticas de storage.objects. Lo que se pierde es solo el
-- listado y la lectura por API autenticada de objetos AJENOS.
--
-- Sigue vigente `avatares_escritura_propia` (ALL, authenticated), que cubre
-- también la lectura de la propia carpeta y la de administración.
--
-- Los otros buckets públicos (comercios, anuncios, recursos del sitio) NO se
-- tocan: son imágenes de marketing, no datos de personas.

drop policy "avatares_lectura_publica" on storage.objects;
