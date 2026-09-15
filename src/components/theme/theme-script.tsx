/**
 * Script anti-flash.
 *
 * Se inyecta en `<head>` y se ejecuta de forma SÍNCRONA antes del primer
 * pintado, estampando `data-theme` en `<html>`. Sin esto, una carga con tema
 * oscuro muestra un fogonazo blanco: el error más visible y más común de los
 * conmutadores de tema.
 *
 * No puede ser un componente de React con efectos: los efectos corren después
 * del pintado, que es justo lo que hay que evitar.
 *
 * ⚠️ ESTE ARCHIVO NO PUEDE EXPORTAR NADA MÁS QUE EL COMPONENTE.
 *
 * Tenía dentro `THEME_STORAGE_KEY` y los tipos, y `theme-provider` —que lleva
 * `'use client'`— los importaba de aquí. Un import arrastra el módulo entero,
 * así que este `<script>` viajaba al navegador dentro del bundle de cliente: se
 * enviaban bytes que no se usan, y React avisaba en consola de que había
 * encontrado una etiqueta `script` al renderizar en el cliente.
 *
 * Lo compartido vive ahora en `theme-constantes.ts`, que no tiene JSX y no
 * pertenece a ninguno de los dos mundos. Si vuelves a añadir una constante
 * aquí, vuelve el aviso.
 */
import { THEME_STORAGE_KEY } from './theme-constantes'

// Minificado a mano y sin dependencias: corre antes que cualquier bundle.
const script = `(function(){try{
var m=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';
var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.setAttribute('data-theme',d?'dark':'light');
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
