import { describe, expect, it, vi } from 'vitest'
import { confirmarCorreoAlCambiar } from './activacion'
import { cambiarCorreoDeCuenta } from './cambiar-correo'

describe('confirmarCorreoAlCambiar', () => {
  it('una cuenta que nunca ha iniciado sesión no se da por verificada', () => {
    expect(confirmarCorreoAlCambiar({ last_sign_in_at: null })).toBe(false)
    expect(confirmarCorreoAlCambiar({})).toBe(false)
  })

  it('si no se pudo leer la cuenta, tampoco se confirma', () => {
    expect(confirmarCorreoAlCambiar(null)).toBe(false)
    expect(confirmarCorreoAlCambiar(undefined)).toBe(false)
  })

  it('una cuenta que ya inició sesión conserva su comportamiento: se confirma', () => {
    expect(confirmarCorreoAlCambiar({ last_sign_in_at: '2026-10-20T15:00:00Z' })).toBe(true)
  })
})

/** Un cliente de Auth falso que solo recuerda lo que se le mandó. */
function authFalso(usuario: { last_sign_in_at?: string | null } | null, errorAlActualizar?: string) {
  const updateUserById = vi.fn(async () => ({
    error: errorAlActualizar ? { message: errorAlActualizar } : null,
  }))
  const cliente = {
    auth: {
      admin: {
        getUserById: vi.fn(async () => ({ data: { user: usuario }, error: null })),
        updateUserById,
      },
    },
  }
  return { cliente, updateUserById }
}

describe('cambiarCorreoDeCuenta', () => {
  it('en una cuenta que nunca entró, el correo nuevo se manda SIN confirmar', async () => {
    const { cliente, updateUserById } = authFalso({ last_sign_in_at: null })
    const r = await cambiarCorreoDeCuenta(cliente, 'perfil-1', 'nuevo@correo.com')
    expect(r).toEqual({ ok: true })
    expect(updateUserById).toHaveBeenCalledWith('perfil-1', {
      email: 'nuevo@correo.com',
      email_confirm: false,
    })
  })

  it('en una cuenta que ya entró, se confirma como antes', async () => {
    const { cliente, updateUserById } = authFalso({ last_sign_in_at: '2026-10-20T15:00:00Z' })
    await cambiarCorreoDeCuenta(cliente, 'perfil-2', 'otro@correo.com')
    expect(updateUserById).toHaveBeenCalledWith('perfil-2', {
      email: 'otro@correo.com',
      email_confirm: true,
    })
  })

  it('un correo que ya usa otra cuenta da un mensaje claro', async () => {
    const { cliente } = authFalso({ last_sign_in_at: null }, 'A user with this email address has already been registered')
    expect(await cambiarCorreoDeCuenta(cliente, 'perfil-3', 'repetido@correo.com')).toEqual({
      ok: false,
      error: 'Ese correo ya está en uso por otro usuario.',
    })
  })
})
