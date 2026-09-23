# Arranque del equipo de agentes

> Guía para poner en marcha el equipo tras instalarlo. Los prompts están listos
> para copiar y pegar. Escrito el 28/08/2026, rama `mejora-diseno`.

---

## Por qué hace falta reiniciar

Claude Code lee `.claude/agents/` **al arrancar la sesión**. Los 17 agentes se
instalaron con la sesión ya abierta, así que no están cargados: invocar cualquiera
devuelve `Agent type '<nombre>' not found`.

No es un problema de los archivos —los 17 pasan validación de frontmatter, sin BOM,
con `name` coincidiendo con el nombre de archivo y modelos válidos—. Es el mismo
patrón que `CLAUDE.md` documenta para las rutas paralelas de Next: el manifiesto
queda obsoleto y falla en silencio, lo que parece un bug de código y no lo es.

---

## Pasos

1. **Cierra Claude Code por completo** y vuelve a abrirlo en `D:\ORUM-Project`.
2. Escribe **`/agents`** y comprueba que aparecen los 17.
   - Si no aparecen, ve a «Si algo falla» al final.
3. Confirma que sigues en la rama correcta: **`mejora-diseno`**.
4. Pega el **PROMPT DE ARRANQUE** de abajo.
5. Lee el veredicto de la verificación de modelo antes de seguir con el pipeline.

---

## PROMPT DE ARRANQUE

```
Estamos en la rama mejora-diseno del proyecto ORUM. Acabo de instalar un equipo
de 17 agentes en .claude/agents/, adaptado a las reglas de este repositorio.
Antes de nada lee .claude/docs/WORKFLOW.md, .claude/docs/SCOPE.md y
.claude/docs/MODEL_POLICY.md.

Haz estas dos cosas en orden y PARA al final para que yo lea el resultado.

PASO 1 — Verificar que el campo `model` del frontmatter se respeta

Invoca el agente task-triage, que está fijado a haiku, con esta tarea:

  "Clasifica en nivel T0-T4 y lista los agentes que deberían intervenir:
   'Quiero mejorar el diseño del Portal de Miembros. No sé aún qué pantallas;
   algo se ve desalineado en móvil y las transiciones entre lista y ficha se
   sienten bruscas.'
   Antes de clasificar, indica en una línea que empiece por 'MODELO: ' qué
   modelo eres, con el ID completo si lo conoces. Si no estás seguro, di la
   familia y tu grado de certeza. No inventes un ID."

Dime qué modelo respondió. Si la UI te muestra el modelo real del subagente,
fíate de eso antes que de lo que el agente diga de sí mismo.

- Si responde Haiku -> la política de coste de MODEL_POLICY.md funciona.
- Si responde Opus/Sonnet -> está heredando el modelo de la sesión y no hay
  ahorro. Anótalo y sigue igualmente; lo decidiré yo después.

PASO 2 — Fase 0 del pipeline

Lanza codebase-analyst para que genere sus dos entregables:
  .claude/docs/ARCHITECTURE.md
  .claude/docs/API-CONTRACT.md

Recuérdale explícitamente al delegarle la tarea:
- Respeta .claude/docs/SCOPE.md. Las Server Actions (los doce archivos con
  'use server'), src/lib/auth, src/lib/supabase, src/lib/correo, supabase/ y
  docs/ son SOLO LECTURA: se inventarían como contrato externo, no se modifican
  ni se documenta su implementación interna.
- NO uses graphify-out/. Está congelado el 19/08 y el repo lleva 13 commits de
  ventaja: desconoce activar-cuenta/, cree vivo src/lib/shared/password.ts e
  ignora src/lib/shared/html.ts. Está en la zona prohibida de SCOPE.md.
- ARCHITECTURE.md NO duplica el CLAUDE.md de la raíz. Lo referencia y documenta
  solo lo que falta: convenciones inferidas del código real con evidencia y
  conteo de ocurrencias, deuda técnica, e inventario de API.
- Si encuentras código que contradice a CLAUDE.md, eso es deuda técnica y va en
  esa tabla. La norma no se ajusta al código.

PARA ahí. No sigas con tech-lead ni con ningún otro agente hasta que yo lo diga.
No modifiques código de producto. No commitees nada sin preguntarme.
```

---

## Después: el pipeline

Con `ARCHITECTURE.md` y `API-CONTRACT.md` generados, el orden de `WORKFLOW.md` es:

```
task-triage        -> clasifica cada petición en T0-T4
  T0/T1            -> directo a frontend-implementer (+ code-reviewer)
  T2-T4            -> tech-lead -> ux-designer -> frontend-implementer
                      -> auditores en paralelo -> qa-tester -> motion-ux-polish
```

Para el trabajo de diseño que tienes en mente, el prompt siguiente sería:

```
Invoca task-triage con mi petición real: "quiero mejorar el diseño del Portal de
Miembros de ORUM; algo se ve desalineado en móvil y las transiciones entre lista
y ficha se sienten bruscas". Cuando te dé el nivel y la lista de agentes,
muéstramelos y PARA antes de ejecutar el pipeline.
```

Ten presente una limitación real, ya anotada en la deuda conocida de `CLAUDE.md`:
**la automatización de navegador de esta máquina no consigue redimensionar la
ventana**. Cualquier hallazgo de móvil habrá que verificarlo con una captura tuya o
en un dispositivo real. `mobile-ux-specialist` y `apple-hig-specialist` pueden
auditar el código, no el render.

---

## Si algo falla

**`/agents` no muestra los 17.** Comprueba que estás en `D:\ORUM-Project` y que
`.claude/agents/` tiene 17 archivos `.md`. Los archivos ya se validaron: frontmatter
correcto, sin BOM, `name` igual al nombre de archivo, modelo válido en los 17.

**Un agente dice que no puede leer un archivo.** Los auditores solo tienen Read,
Grep y Glob — es deliberado. Si necesita ejecutar algo, la tarea es de
`frontend-implementer`, `qa-tester` o `codebase-analyst`.

**Un agente propone tocar una Server Action.** No debe. Eso va en la sección
`PROPUESTAS PARA BACKEND` de su reporte (`SCOPE.md` §4 y §5). Si lo intenta, es un
fallo del agente y merece una nota a `agent-tuner`.

**Los hooks parecen colgarse.** No lo hacen: `graphify` no está instalado en esta
máquina, así que los cuatro hooks `PreToolUse` de `.claude/settings.json` fallan con
exit 127 en cada llamada a Read, Glob, Bash y Grep. Cuesta ~65-70 ms por invocación
y no bloquea nada.
