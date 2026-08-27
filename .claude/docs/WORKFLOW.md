# Flujo de trabajo del equipo de agentes

17 agentes. Tres reglas que sostienen todo.

---

## Las tres reglas

### 1. Un solo agente escribe código
`frontend-implementer` es el único con permiso de escritura sobre el código de
producto. Todos los demás tienen herramientas de solo lectura.

Razón: si varios agentes editan los mismos archivos, el diff se vuelve ingobernable y
no hay forma de atribuir un cambio inesperado.

Excepciones acotadas: `qa-tester` escribe tests. Los agentes de planificación y
diseño escriben en `.claude/docs/`. `agent-tuner` escribe en `.claude/agents/`.
Ninguno toca código de producto.

### 2. Cada agente entrega un artefacto, no una opinión
Severidad + `archivo:línea` + impacto + corrección concreta. "Esto se podría mejorar"
no es un entregable válido.

### 3. Dominios sin solapamiento
Cada agente tiene "Fuera de tu alcance". Lo que ve fuera de su dominio lo deriva en
una línea, no lo desarrolla. Sin esto, el implementador recibe el mismo issue cuatro
veces y termina ignorándolos todos.

---

## Reparto de dominios

| Dominio | Dueño único |
|---|---|
| Clasificar el alcance de una petición | `task-triage` |
| Convenciones reales del repo | `codebase-analyst` |
| Plan, tareas, orquestación | `tech-lead` |
| Flujos, estados de UI, copy (todas las plataformas) | `ux-designer` |
| Coherencia visual contra el sistema ya existente | `design-system-architect` |
| Estado, caché, contratos de datos | `state-data-architect` |
| Escritura de código de producto | `frontend-implementer` |
| Correctitud, arquitectura, tipado | `code-reviewer` |
| XSS, secretos, autorización | `security-auditor` |
| Web Vitals, bundle, re-renders | `performance-engineer` |
| WCAG 2.1 AA | `accessibility-auditor` |
| Ergonomía táctil, viewport, teclado móvil | `mobile-ux-specialist` |
| iOS Safari, PWA, HIG | `apple-hig-specialist` |
| Animación y detalle percibido | `motion-ux-polish` |
| Pruebas y bugs | `qa-tester` |
| Documentación | `docs-handoff` |
| El propio equipo de agentes | `agent-tuner` |

### Fronteras que se confunden con facilidad

- **`ux-designer` vs especialistas de plataforma**: `ux-designer` es el dueño único
  del flujo, los estados y el copy. Los especialistas **auditan** esa spec contra las
  convenciones de su medio; no producen specs paralelas.
- **`mobile-ux-specialist` vs `apple-hig-specialist`**: el primero cubre lo agnóstico
  de plataforma (táctil, viewport, teclado, rendimiento móvil); el segundo, lo
  específico de Apple (safe areas, Dynamic Type, VoiceOver, convenciones HIG).
- **`accessibility-auditor` vs móvil**: WCAG es del primero. El área táctil de 44px
  la reportan ambos: es el mismo criterio desde dos normas, no duplicación.
- **`task-triage` vs `tech-lead`**: triage decide **si** planificar; tech-lead decide
  **cómo**.

---

## Pipeline

```
FASE 0 — UNA SOLA VEZ, AL INSTALAR
  codebase-analyst                       →  .claude/docs/ARCHITECTURE.md
                                            .claude/docs/API-CONTRACT.md
  [DESIGN_RULES.md ya no se genera: el sistema de diseño de ORUM existe y vive
   en CLAUDE.md + src/styles/tokens.css + src/lib/shared/motion.ts]

ENTRADA — EN CADA PETICIÓN
  task-triage  →  nivel T0–T4 + lista de agentes
       ↓
   T0/T1 → directo al implementer (+ reviewer)
   T2–T4 → sigue el pipeline

FASE 1 — PLANIFICACIÓN
  tech-lead  →  plan con tareas, dependencias y DoD
       ↓
  ux-designer            →  spec con los 8 estados y los 3 layouts
  state-data-architect   →  mapa de estado    [si el estado es no trivial]

FASE 2 — IMPLEMENTACIÓN
  frontend-implementer  →  código

FASE 3 — AUDITORÍA (en paralelo, todos solo lectura)
  code-reviewer · security-auditor · performance-engineer
  accessibility-auditor · mobile-ux-specialist · apple-hig-specialist
       ↓
  frontend-implementer  →  aplica correcciones por severidad

FASE 4 — VERIFICACIÓN
  qa-tester  →  tests + bugs
       ↓
  frontend-implementer  →  corrige    [repetir hasta que pase]

FASE 5 — PULIDO
  motion-ux-polish  →  propuestas priorizadas
       ↓
  frontend-implementer  →  aplica

FASE 6 — CIERRE
  design-system-architect  →  coherencia visual (modo único: AUDITAR)
  docs-handoff                       →  documentación

MANTENIMIENTO — ESPORÁDICO
  agent-tuner  →  audita el roster, ajusta modelos y permisos
```

---

## Niveles de alcance

`task-triage` clasifica cada petición. No apliques el pipeline completo a todo.

| Nivel | Qué es | Agentes |
|---|---|---|
| **T0** | Texto, constante, typo | `frontend-implementer` |
| **T1** | Bug acotado, ajuste de estilo | `frontend-implementer` → `code-reviewer` |
| **T2** | Componente aislado, refactor contenido | `ux-designer` → implementer → auditores relevantes → `qa-tester` |
| **T3** | Feature completo | Pipeline desde `tech-lead` |
| **T4** | Migración, auditoría global | `codebase-analyst` → `tech-lead` → pipeline por fases |

Añade siempre `security-auditor` si toca datos, autenticación o permisos.

---

## Bucle de corrección

Cuando `frontend-implementer` recibe hallazgos de varios auditores a la vez:

1. Ordena por severidad global (ver `REVIEW_SEVERITY.md`)
2. Aplica en ese orden
3. Si discrepa, argumenta por escrito; no omite en silencio
4. Tras aplicar nivel 1 y 2, se re-audita **solo el dominio afectado**, no todo

---

## Modelos

Ver `MODEL_POLICY.md`. Resumen: Opus para juicio, Sonnet para checklist, Haiku para
enrutar. **Verifica empíricamente que el campo `model` se respeta en tu versión**
antes de contar con el ahorro.
