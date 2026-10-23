import { describe, it, expect } from 'vitest'
import { correoYaRegistrado } from './correo-registrado'

function falso(paginas: { email?: string | null }[][], falla = false) {
  const pedidas: number[] = []
  return {
    pedidas,
    auth: {
      admin: {
        listUsers: async ({ page }: { page: number; perPage: number }) => {
          pedidas.push(page)
          if (falla) return { data: null, error: { message: 'boom' } }
          return { data: { users: paginas[page - 1] ?? [] }, error: null }
        },
      },
    },
  }
}

describe('correoYaRegistrado', () => {
  it('encuentra el correo sin distinguir mayúsculas ni espacios', async () => {
    const a = falso([[{ email: 'LaCasa@Yahoo.com' }]])
    expect(await correoYaRegistrado(a, '  lacasa@yahoo.com ')).toBe(true)
  })

  it('dice false si no está y la lista cabe en una página', async () => {
    const a = falso([[{ email: 'otro@x.com' }, { email: null }]])
    expect(await correoYaRegistrado(a, 'nuevo@x.com')).toBe(false)
    expect(a.pedidas).toEqual([1])
  })

  it('sigue a la página siguiente mientras la actual venga llena', async () => {
    const llena = Array.from({ length: 1000 }, (_, i) => ({ email: `u${i}@x.com` }))
    const a = falso([llena, [{ email: 'buscado@x.com' }]])
    expect(await correoYaRegistrado(a, 'buscado@x.com')).toBe(true)
    expect(a.pedidas).toEqual([1, 2])
  })

  it('devuelve null si la consulta falla: no se asume que esté libre', async () => {
    expect(await correoYaRegistrado(falso([], true), 'a@x.com')).toBeNull()
  })
})
