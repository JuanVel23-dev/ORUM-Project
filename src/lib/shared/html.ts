const ENTIDADES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Escapa los caracteres que rompen HTML, para interpolar texto de usuario en correos. */
export function escaparHtml(valor: string): string {
  return valor.replace(/[&<>"']/g, (c) => ENTIDADES[c])
}
