# La nómina

Los apodos van dentro del campo `description`, no del `name`. El nombre técnico sigue
siendo el de invocación; el apodo es para que Claude lo reconozca cuando lo llames así
y para que tú te acuerdes de quién hace qué.

Ambas formas funcionan:

```
Usa el agente code-reviewer      ✓
Que El Suegro revise esto        ✓
```

---

## Portería

**«El Portero»** · `task-triage` · haiku
Mira tu petición y decide quién entra. Puede decirte que no necesitas a nadie.
Es el único barato: sirve para no despertar a los caros por una tontería.

## Los que mandan

**«El Forense»** · `codebase-analyst` · opus
Le abre el proyecto en canal y documenta qué encontró: stack, convenciones reales,
deuda. Corre una vez. Todos los demás leen su informe.

**«El Capataz»** · `tech-lead` · opus
Parte el trabajo en tareas, decide el orden y reparte. Si el plan sale mal, es culpa
suya y de nadie más.

## Diseño

**«El Psicólogo»** · `ux-designer` · opus
Le importa más qué ve el usuario cuando algo falla que cuando todo va bien. Dueño
único de los flujos, los estados y el copy.

**«El Notario»** · `design-system-architect` · opus
Levanta acta de los tokens y después viene a comprobar que nadie los incumplió.
Detecta el `#3A7BD5` que metiste a mano a las once de la noche.

**«El Bodeguero»** · `state-data-architect` · opus
Decide dónde se guarda cada cosa y quién puede tocarla. Su tesis es que la mitad de
tu estado no debería existir.

## Los que trabajan

**«El Todero»** · `frontend-implementer` · opus
El único con permiso para tocar el código. Todos los demás opinan; él teclea.

**«El Coreógrafo»** · `motion-ux-polish` · sonnet
Llega al final, cuando ya todo funciona, y hace que se sienta bien. Si una animación
no tiene función, la manda a la basura.

## Los que critican

**«El Suegro»** · `code-reviewer` · opus
Nada le parece suficientemente bueno. Revisa correctitud, arquitectura y tipado, y
te va a preguntar qué pasa si eso llega vacío.

**«El Paranoico»** · `security-auditor` · opus
Asume que todo el mundo quiere entrar. XSS, secretos en el bundle, Server Actions
sin validar. Cree que tu `NEXT_PUBLIC_` es un problema, y suele tener razón.

**«El Cronómetro»** · `performance-engineer` · opus
Solo le interesa lo que se puede medir. Si le propones memoizar «por si acaso», te
pide la métrica.

**«El Defensor del Pueblo»** · `accessibility-auditor` · sonnet
WCAG 2.1 AA. Su frase favorita: quitar el `outline` sin poner nada en su lugar es
una infracción, no una decisión de diseño.

**«El Pulgar»** · `mobile-ux-specialist` · sonnet
Usa el teléfono con una mano, en el bus. Le obsesionan los 44px, el `100vh` roto y
el teclado que tapa el campo que estabas llenando.

**«El Fanboy»** · `apple-hig-specialist` · opus
Sabe distinguir entre lo que la HIG exige y lo que es puro gusto de Cupertino, y te
lo dice separado. Es su mejor cualidad.

**«El Rompelotodo»** · `qa-tester` · sonnet
No quiere confirmar que funciona: quiere encontrar dónde se rompe. Doble clic, red
caída a la mitad, texto de 400 caracteres, dos pestañas abiertas.

## Los de atrás

**«El Escribano»** · `docs-handoff` · sonnet
Documenta el porqué, no el qué. Escribe para el que llegue en seis meses, que
probablemente seas tú.

**«El de Recursos Humanos»** · `agent-tuner` · opus
Audita al resto del equipo: solapamientos, permisos de más, modelos mal asignados.
El único que puede reescribir a sus compañeros.

---

## Resumen

| Apodo | Agente | Modelo |
|---|---|---|
| El Portero | `task-triage` | haiku |
| El Forense | `codebase-analyst` | opus |
| El Capataz | `tech-lead` | opus |
| El Psicólogo | `ux-designer` | opus |
| El Notario | `design-system-architect` | opus |
| El Bodeguero | `state-data-architect` | opus |
| El Todero | `frontend-implementer` | opus |
| El Coreógrafo | `motion-ux-polish` | sonnet |
| El Suegro | `code-reviewer` | opus |
| El Paranoico | `security-auditor` | opus |
| El Cronómetro | `performance-engineer` | opus |
| El Defensor del Pueblo | `accessibility-auditor` | sonnet |
| El Pulgar | `mobile-ux-specialist` | sonnet |
| El Fanboy | `apple-hig-specialist` | opus |
| El Rompelotodo | `qa-tester` | sonnet |
| El Escribano | `docs-handoff` | sonnet |
| El de Recursos Humanos | `agent-tuner` | opus |
