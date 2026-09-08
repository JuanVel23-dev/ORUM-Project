'use client'

import { useEffect, useRef } from 'react'
import { CAMPO_TURNSTILE, TURNSTILE_SITE_KEY_PRUEBA } from '@/lib/auth/turnstile'
import styles from './turnstile.module.css'

/*
  Widget de Cloudflare Turnstile.

  Va DENTRO de un <form>: al resolverse, inyecta un input oculto
  `cf-turnstile-response` que viaja con el envío y que la server action valida
  antes de tocar Supabase.

  Si la site key no está configurada se usa la llave de prueba oficial de
  Cloudflare (siempre pasa), así el desarrollo local funciona sin cuenta. En
  producción hay que definir `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
*/

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TURNSTILE_SITE_KEY_PRUEBA
const URL_API = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileAPI = {
  render: (el: HTMLElement, opciones: Record<string, unknown>) => string
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileAPI
  }
}

// El <script> se carga una sola vez para toda la página, aunque monten varios
// widgets o se navegue entre pantallas de acceso.
let promesaScript: Promise<void> | null = null

function cargarScript(): Promise<void> {
  if (promesaScript) return promesaScript
  promesaScript = new Promise((resolver, rechazar) => {
    const s = document.createElement('script')
    s.src = URL_API
    s.async = true
    s.onload = () => resolver()
    s.onerror = () => rechazar(new Error('No se pudo cargar Turnstile'))
    document.head.appendChild(s)
  })
  return promesaScript
}

export function Turnstile() {
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let widgetId: string | null = null
    let cancelado = false

    cargarScript()
      .then(() => {
        if (cancelado || !contenedor.current || !window.turnstile) return
        widgetId = window.turnstile.render(contenedor.current, {
          sitekey: SITE_KEY,
          theme: 'auto',
          language: 'es',
          'response-field-name': CAMPO_TURNSTILE,
        })
      })
      .catch(() => {
        // Fail-closed: sin widget no hay token y la server action rechaza el
        // envío. No hay nada que hacer aquí salvo no romper el render.
      })

    return () => {
      cancelado = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [])

  return <div ref={contenedor} className={styles.caja} />
}
