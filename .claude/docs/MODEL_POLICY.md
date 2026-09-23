# Política de modelos

## Criterio

| Modelo | Cuándo |
|---|---|
| **opus** | Juicio abierto, trade-offs, razonamiento adversarial, síntesis sin respuesta única |
| **sonnet** | Contrastar contra un cuerpo de reglas conocido y producir salida estructurada |
| **haiku** | Clasificar, enrutar, extraer. Sin juicio de valor |

**Regla de decisión**: si el agente puede fallar por **falta de criterio**, es Opus.
Si solo puede fallar por **falta de minuciosidad**, es Sonnet. Si solo enruta, es Haiku.

## Asignación del roster

| Agente | Modelo | Razón |
|---|---|---|
| `task-triage` | haiku | Clasificación pura |
| `codebase-analyst` | opus | Síntesis; corre una vez |
| `tech-lead` | opus | Trade-offs y descomposición |
| `ux-designer` | opus | Diseño sin respuesta única |
| `design-system-architect` | opus | Juzgar coherencia visual; candidato a sonnet (ver ajuste de coste) |
| `state-data-architect` | opus | Decisiones de arquitectura |
| `frontend-implementer` | opus | Es quien escribe; no ahorrar aquí |
| `code-reviewer` | opus | Detectar lo que *no* está en el código |
| `security-auditor` | opus | Razonamiento adversarial |
| `performance-engineer` | opus | Atribuir causa a métrica |
| `apple-hig-specialist` | opus | Juicio de diseño, no solo checklist |
| `agent-tuner` | opus | Meta-razonamiento; uso esporádico |
| `accessibility-auditor` | sonnet | WCAG es un corpus cerrado |
| `mobile-ux-specialist` | sonnet | Checklist de plataforma |
| `qa-tester` | sonnet | Generación estructurada |
| `motion-ux-polish` | sonnet | Catálogo acotado de patrones |
| `docs-handoff` | sonnet | Redacción estructurada |

Otros valores válidos del campo: un ID completo de modelo, el alias `fable`, o
`inherit` (valor por defecto si se omite: hereda el modelo de la sesión).

## Verificación obligatoria antes de confiar en esto

Existe un comportamiento reportado en el que el campo `model` del frontmatter se
ignora y el subagente hereda el modelo de la sesión padre. Puede estar resuelto en tu
versión, pero **compruébalo antes de asumir ahorro de coste**:

1. Abre Claude Code con Opus como modelo de sesión
2. Invoca `task-triage` (fijado a `haiku`)
3. Comprueba qué modelo responde

Si hereda, la política no surte efecto. En ese caso, o pasas el modelo explícitamente
al delegar, o asumes que todo corre en el modelo de la sesión y eliges el de sesión
según la fase de trabajo.

## Ajuste de coste

Si necesitas reducir gasto, en este orden:

1. `design-system-architect` → sonnet. Ya no define tokens (el sistema de ORUM existe);
   solo audita contra un cuerpo de reglas cerrado, que es justo el perfil de sonnet
2. `performance-engineer` → sonnet si tus auditorías son mayormente de checklist
3. `codebase-analyst` → sonnet (corre una sola vez, el ahorro es marginal)

Nunca degrades `frontend-implementer` ni `security-auditor`.
