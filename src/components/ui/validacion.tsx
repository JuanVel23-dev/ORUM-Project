'use client'

import { useState, type FocusEvent, type FormEvent } from 'react'
import { Alert } from '@/components/ui/alert'
import { errorDe, validarTodo, type ReglasFormulario, type Valores } from '@/lib/validacion/reglas'
import styles from './validacion.module.css'

/*
  LA VALIDACIÓN DE LOS FORMULARIOS  ·  rediseño del panel (15/10/2026)
  ---------------------------------------------------------------------------
  «Sus formularios no tienen excepciones». Un formulario declara sus reglas
  (`lib/validacion/reglas.ts`) y este gancho:

    · AL ENVIAR, revisa todo. Si algo falla, NO envía, marca cada campo con
      su mensaje (por el `error` de `Field`) y lleva el foco al primero.
    · AL SALIR de un campo con algo escrito, lo revisa ya: el aviso llega
      antes de llegar al botón.
    · AL CORREGIR, el aviso se va en cuanto el dato vale.

  Y `ResumenErrores` pone arriba cuántos campos hay que revisar, con un botón
  por campo que lleva a él (como en la propuesta aprobada).

  El servidor sigue validando por su cuenta: esto es para avisar al momento.
*/

/** Los valores de un formulario como texto, por nombre. */
function leer(form: HTMLFormElement): Valores {
  const valores: Valores = {}
  for (const [clave, valor] of new FormData(form)) {
    valores[clave] = typeof valor === 'string' ? valor : ''
  }
  return valores
}

/** El control de un campo por su nombre. */
function control(form: HTMLFormElement | null, nombre: string): HTMLElement | null {
  const el = form?.elements.namedItem(nombre)
  if (!el) return null
  if (el instanceof RadioNodeList) return (el[0] as HTMLElement) ?? null
  return el as HTMLElement
}

/** Lleva el foco a un campo; si es un campo oculto (un `SelectMenu`), a su botón. */
function enfocar(form: HTMLFormElement | null, nombre: string) {
  const el = control(form, nombre)
  if (!el) return
  if (el instanceof HTMLInputElement && el.type === 'hidden') {
    const visible = el.closest('[data-campo]')?.querySelector<HTMLElement>('button, input:not([type=hidden])')
    visible?.focus()
    visible?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    return
  }
  el.focus()
  el.scrollIntoView({ block: 'center', behavior: 'smooth' })
}

export function useValidacion(reglas: ReglasFormulario) {
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [formulario, setFormulario] = useState<HTMLFormElement | null>(null)

  function revisarCampo(form: HTMLFormElement, nombre: string) {
    if (!(nombre in reglas)) return
    const error = errorDe(nombre, reglas, leer(form))
    setErrores((antes) => {
      if ((antes[nombre] ?? null) === error) return antes
      const nuevo = { ...antes }
      if (error) nuevo[nombre] = error
      else delete nuevo[nombre]
      return nuevo
    })
  }

  /*
    Al cambiar cualquier campo se revisan de nuevo los que YA tenían aviso,
    no solo el tocado: hay reglas que dependen de otro campo (la fecha de fin
    de la de inicio; el valor de una promoción, de su tipo) y su aviso tiene
    que irse en cuanto el otro lo arregla. Un campo que desaparece (el valor
    de un 2x1) deja de leerse y su aviso se va con él.
  */
  function revisarAvisados(form: HTMLFormElement) {
    if (Object.keys(errores).length === 0) return
    const valores = leer(form)
    setErrores((antes) => {
      let cambio = false
      const nuevo: Record<string, string> = {}
      for (const [nombre, previo] of Object.entries(antes)) {
        const error = nombre in valores || control(form, nombre) ? errorDe(nombre, reglas, valores) : null
        if (error) nuevo[nombre] = error
        if (error !== previo) cambio = true
      }
      return cambio ? nuevo : antes
    })
  }

  const propsFormulario = {
    ref: setFormulario,
    noValidate: true,
    onSubmit: (e: FormEvent<HTMLFormElement>) => {
      const todos = validarTodo(reglas, leer(e.currentTarget))
      setErrores(todos)
      const primero = Object.keys(todos)[0]
      if (primero) {
        e.preventDefault()
        enfocar(e.currentTarget, primero)
      }
    },
    // Al corregir: solo los campos que ya tenían aviso (no se regaña mientras se escribe).
    onInput: (e: FormEvent<HTMLFormElement>) => revisarAvisados(e.currentTarget),
    // Al salir de un campo con algo escrito: se revisa ya.
    onBlur: (e: FocusEvent<HTMLFormElement>) => {
      const el = e.target as unknown as HTMLInputElement
      if (el.name && (el.value ?? '').trim() !== '') revisarCampo(e.currentTarget, el.name)
    },
    // Un `SelectMenu` cambia un campo oculto: se avisa con `change`.
    onChange: (e: FormEvent<HTMLFormElement>) => revisarAvisados(e.currentTarget),
  }

  return {
    errores,
    /** El mensaje de un campo, para el `error` de su `Field`. */
    error: (nombre: string) => errores[nombre] ?? null,
    propsFormulario,
    /** Lleva el foco al campo (lo usa el resumen). */
    ir: (nombre: string) => enfocar(formulario, nombre),
    /** Marca un error que viene de fuera (del servidor). */
    marcar: (nombre: string, mensaje: string) => setErrores((a) => ({ ...a, [nombre]: mensaje })),
  }
}

/** Arriba del formulario: cuántos campos hay que revisar y un botón a cada uno. */
export function ResumenErrores({
  errores,
  etiquetas,
  ir,
}: {
  errores: Record<string, string>
  /** El nombre visible de cada campo. */
  etiquetas: Record<string, string>
  ir: (nombre: string) => void
}) {
  const campos = Object.keys(errores)
  if (campos.length === 0) return null
  return (
    <Alert
      tone="danger"
      title={
        campos.length === 1 ? 'Revisa 1 campo antes de continuar' : `Revisa ${campos.length} campos antes de continuar`
      }
    >
      <span className={styles.lista}>
        {campos.map((c) => (
          <button key={c} type="button" className={styles.enlace} onClick={() => ir(c)}>
            {etiquetas[c] ?? c}
          </button>
        ))}
      </span>
    </Alert>
  )
}
