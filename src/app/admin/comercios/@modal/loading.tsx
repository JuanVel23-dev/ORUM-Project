/**
 * Carga de la ranura `@modal`.
 *
 * Sin este archivo, Next caería al `loading.tsx` de la sección —el esqueleto
 * de la tabla— y lo renderizaría dentro del hueco del modal, apareciendo
 * debajo de la lista.
 */
export { OverlayCargando as default } from '@/components/shell/overlay-cargando'