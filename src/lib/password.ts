import { randomInt } from 'node:crypto'

/**
 * Genera una contraseña aleatoria segura, con al menos una minúscula, una
 * mayúscula, un número y un símbolo. Evita caracteres ambiguos (O/0, l/1).
 */
export function generarPassword(longitud = 14): string {
  const minus = 'abcdefghijkmnpqrstuvwxyz'
  const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const nums = '23456789'
  const simbolos = '!@#$%*?-_'
  const todos = minus + mayus + nums + simbolos

  const elegir = (set: string) => set[randomInt(0, set.length)]

  const chars = [elegir(minus), elegir(mayus), elegir(nums), elegir(simbolos)]
  for (let i = chars.length; i < longitud; i++) chars.push(elegir(todos))

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
