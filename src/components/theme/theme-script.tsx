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
 */

export const THEME_STORAGE_KEY = 'orum-theme'

/** Los tres modos son estados reales. `system` no es "ausencia de elección". */
export type ThemeMode = 'system' | 'light' | 'dark'

/** Tema efectivo ya resuelto: lo que de verdad se pinta. */
export type ResolvedTheme = 'light' | 'dark'

// Minificado a mano y sin dependencias: corre antes que cualquier bundle.
const script = `(function(){try{
var m=localStorage.getItem('${THEME_STORAGE_KEY}')||'system';
var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.setAttribute('data-theme',d?'dark':'light');
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
