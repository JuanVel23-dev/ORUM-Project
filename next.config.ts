import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Habilita <ViewTransition> de React para transiciones de ruta con
    // elemento compartido. Validado en la Fase C: compila y no rompe nada.
    // Las transiciones concretas se aplican pantalla por pantalla en la
    // Fase E, cuando cada ruta tenga su diseño definitivo y se sepa qué
    // elemento debe persistir entre ellas.
    viewTransition: true,
  },
}

export default nextConfig
