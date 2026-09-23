# Equipo de agentes para desarrollo frontend (Next.js)

17 subagentes de Claude Code con reparto estricto de dominios y un único agente con
permiso de escritura sobre el código.

Para ejecutar la auditoría y mejora del proyecto, ve directamente a **`PROMPTS.md`**.

---

## Instalación

Desde la raíz de tu proyecto:

```bash
unzip agentes-frontend.zip
mkdir -p .claude/agents .claude/docs
cp -r agentes-frontend/.claude/agents/* .claude/agents/
cp -r agentes-frontend/.claude/docs/*   .claude/docs/
cp agentes-frontend/PROMPTS.md .
rm -rf agentes-frontend
```

Abre Claude Code **en esa carpeta** y verifica:

```
/agents
```

Deben aparecer los 17. Si no, revisa que los `.md` estén directamente en
`.claude/agents/` y no en un subdirectorio.

### Antes de empezar: dos comprobaciones

**1. Declara la frontera.** Si tu proyecto tiene backend que los agentes no deben
tocar, rellena `.claude/docs/SCOPE.md` **antes de ejecutar nada**. `frontend-implementer`
tiene escritura sobre el repositorio entero: ese archivo es lo único que la limita.

**2. Control de versiones.** Estos agentes van a modificar tu código. Trabaja en una
rama:

```bash
git checkout -b mejora-agentes
git status   # debe estar limpio
```

**3. El campo `model` se respeta?** Existe un comportamiento reportado en el que el
modelo del frontmatter se ignora y el subagente hereda el de la sesión. Comprueba:
abre Claude Code con Opus, invoca `task-triage` (fijado a `haiku`) y mira qué modelo
responde. Si hereda, la política de modelos no te ahorra nada — detalles en
`.claude/docs/MODEL_POLICY.md`.

---

## Los 17 agentes

### Entrada y planificación
| Agente | Modelo | Función |
|---|---|---|
| `task-triage` | haiku | Clasifica la petición y dice qué agentes hacen falta |
| `codebase-analyst` | opus | Ingeniería inversa del repo: stack, convenciones, deuda |
| `tech-lead` | opus | Plan de desarrollo, tareas, DoD, orquestación |

### Diseño
| Agente | Modelo | Función |
|---|---|---|
| `ux-designer` | opus | Dueño único de flujos, estados y copy |
| `design-system-architect` | opus | Define tokens y **audita** el código contra ellos |
| `state-data-architect` | opus | Arquitectura de estado y capa de datos |

### Implementación
| Agente | Modelo | Función |
|---|---|---|
| `frontend-implementer` | opus | **Único que escribe código de producto** |
| `motion-ux-polish` | sonnet | Animación y detalle percibido (capa final) |

### Auditoría (solo lectura)
| Agente | Modelo | Función |
|---|---|---|
| `code-reviewer` | opus | Correctitud, arquitectura, tipado |
| `security-auditor` | opus | XSS, secretos, autorización, Server Actions |
| `performance-engineer` | opus | Core Web Vitals, bundle, re-renders, caché |
| `accessibility-auditor` | sonnet | WCAG 2.1 AA |
| `mobile-ux-specialist` | sonnet | Táctil, viewport, teclado virtual, gestos |
| `apple-hig-specialist` | opus | iOS Safari, PWA, Human Interface Guidelines |
| `qa-tester` | sonnet | Plan de pruebas, tests, bugs |

### Soporte
| Agente | Modelo | Función |
|---|---|---|
| `docs-handoff` | sonnet | Documentación, ADRs, handoff |
| `agent-tuner` | opus | Audita y afina el propio equipo de agentes |

---

## Las tres reglas

1. **Un solo escritor.** `frontend-implementer` es el único que toca el código de
   producto. Los auditores no tienen `Write` ni `Edit` en su frontmatter — es una
   restricción real, no una recomendación. Si se la quitas, pierdes la trazabilidad
   del diff.
2. **Artefactos, no opiniones.** Cada hallazgo lleva severidad, `archivo:línea`,
   impacto y corrección concreta.
3. **Dominios sin solapamiento.** Cada agente tiene "Fuera de tu alcance". Lo ajeno lo
   deriva en una línea; no lo desarrolla.

Detalle en `.claude/docs/WORKFLOW.md`.

---

## Estructura

```
.claude/
├── agents/                      17 subagentes
└── docs/
    ├── WORKFLOW.md              pipeline, dominios y fronteras
    ├── MODEL_POLICY.md          criterio de asignación de modelo
    ├── REVIEW_SEVERITY.md       escala común de severidad
    ├── NOMINA.md                apodos del equipo
    ├── SCOPE.md                  frontera frontend/backend — RELLENAR A MANO
    ├── DESIGN_RULES.md          plantilla — la genera design-system-architect
    ├── API-CONTRACT.md           no incluido — lo genera codebase-analyst
    └── ARCHITECTURE.md          no incluido — lo genera codebase-analyst
PROMPTS.md                       secuencia de ejecución
```

---

## Qué no hace este equipo

Backend, base de datos, infraestructura, CI/CD y despliegue. Seguridad y rendimiento
se auditan desde la perspectiva del cliente y de la capa de servidor de Next, no del
sistema completo.
